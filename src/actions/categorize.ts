"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  categorizeLineItem,
  type CategoryMatch,
} from "@/lib/keyword-categorizer";
import { findBestVendorMatch } from "@/lib/vendor-matching";
import { geminiCategorize } from "@/lib/gemini";
import { decrypt } from "@/lib/crypto";

type ActionResult = {
  success?: boolean;
  errors?: { general: string };
};

interface CategorizationResult {
  lineItemId: string;
  description: string;
  suggestedCategoryId: string | null;
  suggestedCategoryName: string | null;
  confidence: number;
  source: "keyword" | "vendor" | "ai" | "none";
}

/**
 * Run the categorisation pipeline on all line items of an invoice.
 * Three layers: vendor memory → keywords → AI (if enabled and available).
 */
export async function categorizeInvoiceItems(
  invoiceId: string
): Promise<{ success?: boolean; results?: CategorizationResult[]; errors?: { general: string } }> {
  const user = await requireRole("invoices:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId },
    include: {
      lineItems: true,
      project: {
        include: {
          budgetCategories: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!invoice) {
    return { errors: { general: "Invoice not found." } };
  }

  const categories = invoice.project.budgetCategories;
  const categoryNames = categories.map((c) => c.name);
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

  const results: CategorizationResult[] = [];

  // Layer 1: Vendor memory — if we know this vendor, use their default category
  let vendorDefaultCategoryId: string | null = null;
  if (invoice.vendorName) {
    const vendors = await prisma.vendor.findMany({
      where: { orgId },
      select: { id: true, name: true, normalizedName: true, defaultCategoryId: true },
    });

    const match = findBestVendorMatch(
      invoice.vendorName,
      vendors
    );
    if (match) {
      const vendor = vendors.find((v) => v.id === match.vendorId);
      if (vendor?.defaultCategoryId) {
        vendorDefaultCategoryId = vendor.defaultCategoryId;
      }
    }
  }

  // Layer 2: Keyword categorisation for each line item
  for (const li of invoice.lineItems) {
    let categoryId: string | null = null;
    let categoryName: string | null = null;
    let confidence = 0;
    let source: "keyword" | "vendor" | "ai" | "none" = "none";

    // Try vendor default first
    if (vendorDefaultCategoryId) {
      const cat = categories.find((c) => c.id === vendorDefaultCategoryId);
      if (cat) {
        categoryId = cat.id;
        categoryName = cat.name;
        confidence = 0.6;
        source = "vendor";
      }
    }

    // Try keyword match (may override vendor if higher confidence)
    const keywordMatch: CategoryMatch | null = categorizeLineItem(
      li.description,
      categoryNames
    );
    if (keywordMatch && keywordMatch.confidence > confidence) {
      const catId = categoryMap.get(keywordMatch.categoryName);
      if (catId) {
        categoryId = catId;
        categoryName = keywordMatch.categoryName;
        confidence = keywordMatch.confidence;
        source = "keyword";
      }
    }

    results.push({
      lineItemId: li.id,
      description: li.description,
      suggestedCategoryId: categoryId,
      suggestedCategoryName: categoryName,
      confidence,
      source,
    });
  }

  // Layer 3: AI categorisation for items with low confidence
  const aiSettings = await prisma.aiSettings.findUnique({
    where: { orgId },
  });

  if (aiSettings?.apiKeyEncrypted) {
    const threshold = Number(aiSettings.categorizeThreshold);
    const lowConfItems = results.filter((r) => r.confidence < threshold);

    if (lowConfItems.length > 0) {
      try {
        const apiKey = await decrypt(aiSettings.apiKeyEncrypted);

        const aiResults = await geminiCategorize(apiKey, {
          lineItems: lowConfItems.map((r) => ({
            description: r.description,
            amount: Number(
              invoice.lineItems.find((li) => li.id === r.lineItemId)?.amount ?? 0
            ),
          })),
          categories: categoryNames,
          vendorName: invoice.vendorName,
        });

        // Merge AI results with higher confidence
        for (let i = 0; i < lowConfItems.length; i++) {
          const aiResult = aiResults[i];
          if (
            aiResult?.suggestedCategory &&
            aiResult.confidence > lowConfItems[i].confidence
          ) {
            const catId = categoryMap.get(aiResult.suggestedCategory);
            if (catId) {
              lowConfItems[i].suggestedCategoryId = catId;
              lowConfItems[i].suggestedCategoryName = aiResult.suggestedCategory;
              lowConfItems[i].confidence = aiResult.confidence;
              lowConfItems[i].source = "ai";
            }
          }
        }
      } catch (e) {
        console.error("AI categorisation failed:", e);
        // Non-fatal — keyword results still apply
      }
    }
  }

  // Save suggestions to database (as suggestions, not auto-applied)
  try {
    await prisma.$transaction(
      results.map((r) =>
        prisma.lineItem.update({
          where: { id: r.lineItemId },
          data: {
            categorySuggestion: r.suggestedCategoryName,
            categoryConfidence: r.confidence,
            // Only auto-apply if high confidence
            categoryId:
              r.confidence >= 0.8 ? r.suggestedCategoryId : undefined,
          },
        })
      )
    );

    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true, results };
  } catch (e) {
    console.error("Failed to save categorisation results:", e);
    return { errors: { general: "Failed to save categorisation results." } };
  }
}

/**
 * Accept a categorisation suggestion — apply it as the confirmed category.
 */
export async function acceptSuggestion(
  lineItemId: string,
  categoryId: string
): Promise<ActionResult> {
  const user = await requireRole("invoices:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const lineItem = await prisma.lineItem.findFirst({
    where: { id: lineItemId, orgId },
  });
  if (!lineItem) {
    return { errors: { general: "Line item not found." } };
  }

  try {
    await prisma.lineItem.update({
      where: { id: lineItemId },
      data: {
        categoryId,
        categoryConfidence: 1.0,
        categorySuggestion: null,
      },
    });

    revalidatePath(`/invoices/${lineItem.invoiceId}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to accept suggestion:", e);
    return { errors: { general: "Failed to accept suggestion." } };
  }
}
