"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import {
  geminiParseInvoice,
  geminiSuggestCategory,
  type GeminiParsedInvoice,
  type CategorySuggestion,
} from "@/lib/gemini";

interface ParseResult {
  success: boolean;
  data?: GeminiParsedInvoice;
  parseMethod?: string;
  errors?: { general: string };
}

/**
 * Check if the current org has an AI API key configured.
 */
export async function hasAiKey(): Promise<boolean> {
  const { orgId } = await getCurrentUser();
  const settings = await prisma.aiSettings.findUnique({
    where: { orgId },
    select: { apiKeyEncrypted: true },
  });
  return !!settings?.apiKeyEncrypted;
}

/**
 * Parse raw PDF text using Gemini AI.
 * Called from the upload form after pdf.js extracts the text client-side.
 */
export async function aiParseInvoice(
  rawText: string
): Promise<ParseResult> {
  const user = await requireRole("invoices:write");
  if ("errors" in user) return { success: false, errors: user.errors };
  const { orgId } = user;

  const settings = await prisma.aiSettings.findUnique({
    where: { orgId },
    select: { apiKeyEncrypted: true },
  });

  if (!settings?.apiKeyEncrypted) {
    return {
      success: false,
      errors: { general: "No AI API key configured. Go to Settings > AI to add one." },
    };
  }

  try {
    const apiKey = await decrypt(settings.apiKeyEncrypted);
    const data = await geminiParseInvoice(apiKey, rawText);
    return { success: true, data, parseMethod: "pdf_js_plus_ai" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("AI parse failed:", message, err);
    return {
      success: false,
      errors: { general: `AI parsing failed: ${message}` },
    };
  }
}

/**
 * Ask AI to suggest the best overall category for an invoice.
 * Returns a category name suggestion with confidence and reason.
 */
export async function aiSuggestCategory(input: {
  vendorName: string;
  lineDescriptions: string[];
  categoryNames: string[];
}): Promise<CategorySuggestion> {
  const user = await requireRole("invoices:write");
  if ("errors" in user) return { categoryName: null, confidence: 0, reason: "Permission denied" };
  const { orgId } = user;

  const settings = await prisma.aiSettings.findUnique({
    where: { orgId },
    select: { apiKeyEncrypted: true },
  });

  if (!settings?.apiKeyEncrypted) {
    return { categoryName: null, confidence: 0, reason: "No API key" };
  }

  try {
    const apiKey = await decrypt(settings.apiKeyEncrypted);
    return await geminiSuggestCategory(apiKey, input);
  } catch (err) {
    console.error("AI suggest category failed:", err);
    return { categoryName: null, confidence: 0, reason: "Suggestion failed" };
  }
}
