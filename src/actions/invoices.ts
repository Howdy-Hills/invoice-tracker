"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { uploadInvoicePdf, deleteInvoicePdf } from "@/lib/supabase/storage";

type ActionResult = {
  success?: boolean;
  errors?: { general: string };
  invoiceId?: string;
};

/**
 * Save a parsed (or manually entered) invoice with its line items.
 * Called from the upload review form or manual entry form.
 */
export async function saveInvoice(formData: FormData): Promise<ActionResult> {
  const user = await requireRole("invoices:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const projectId = formData.get("projectId") as string;
  const vendorName = (formData.get("vendorName") as string) || null;
  const invoiceNumber = (formData.get("invoiceNumber") as string) || null;
  const invoiceDateStr = formData.get("invoiceDate") as string;
  const totalAmountStr = formData.get("totalAmount") as string;
  const taxAmountStr = formData.get("taxAmount") as string;
  const parseMethod = (formData.get("parseMethod") as string) || "manual";
  const parseConfidenceStr = formData.get("parseConfidence") as string;
  const notes = (formData.get("notes") as string) || null;
  const lineItemsJson = formData.get("lineItems") as string;
  const pdfFile = formData.get("pdfFile") as File | null;

  if (!projectId) {
    return { errors: { general: "Project is required." } };
  }

  // Verify project belongs to org
  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
  });
  if (!project) {
    return { errors: { general: "Project not found." } };
  }

  const totalAmount = totalAmountStr
    ? parseFloat(totalAmountStr.replace(/[$,\s]/g, ""))
    : null;
  const taxAmount = taxAmountStr
    ? parseFloat(taxAmountStr.replace(/[$,\s]/g, ""))
    : 0;
  const parseConfidence = parseConfidenceStr
    ? parseFloat(parseConfidenceStr)
    : null;

  let lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number | null;
    amount: number;
    categoryId: string | null;
    categoryConfidence: number | null;
    categorySuggestion: string | null;
    isTax: boolean;
  }> = [];

  if (lineItemsJson) {
    try {
      lineItems = JSON.parse(lineItemsJson);
    } catch {
      return { errors: { general: "Invalid line items data." } };
    }
  }

  try {
    const invoice = await prisma.invoice.create({
      data: {
        orgId,
        projectId,
        vendorName,
        invoiceNumber,
        invoiceDate: invoiceDateStr ? new Date(invoiceDateStr) : null,
        totalAmount,
        taxAmount,
        status: "pending",
        parseMethod,
        parseConfidence,
        notes,
        lineItems: {
          create: lineItems.map((li) => ({
            orgId,
            description: li.description,
            quantity: li.quantity ?? 1,
            unitPrice: li.unitPrice,
            amount: li.amount,
            categoryId: li.categoryId || null,
            categoryConfidence: li.categoryConfidence,
            categorySuggestion: li.categorySuggestion,
            isTax: li.isTax ?? false,
          })),
        },
      },
    });

    // Upload PDF if provided
    if (pdfFile && pdfFile.size > 0) {
      const { path, error } = await uploadInvoicePdf(
        orgId,
        projectId,
        invoice.id,
        pdfFile
      );
      if (path) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            pdfStoragePath: path,
            pdfOriginalFilename: pdfFile.name,
          },
        });
      } else {
        console.error("PDF upload failed:", error);
        // Don't fail the whole save — invoice is still created
      }
    }

    revalidatePath("/invoices");
    return { success: true, invoiceId: invoice.id };
  } catch (e) {
    console.error("Failed to save invoice:", e);
    return { errors: { general: "Failed to save invoice." } };
  }
}

/**
 * Update an existing invoice's header fields.
 */
export async function updateInvoice(
  invoiceId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireRole("invoices:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId },
  });
  if (!invoice) {
    return { errors: { general: "Invoice not found." } };
  }

  const vendorName = formData.get("vendorName") as string;
  const invoiceNumber = formData.get("invoiceNumber") as string;
  const invoiceDateStr = formData.get("invoiceDate") as string;
  const totalAmountStr = formData.get("totalAmount") as string;
  const taxAmountStr = formData.get("taxAmount") as string;
  const status = formData.get("status") as string;
  const notes = formData.get("notes") as string;

  const data: Record<string, unknown> = {};
  if (vendorName !== null) data.vendorName = vendorName || null;
  if (invoiceNumber !== null) data.invoiceNumber = invoiceNumber || null;
  if (invoiceDateStr) data.invoiceDate = new Date(invoiceDateStr);
  if (totalAmountStr)
    data.totalAmount = parseFloat(totalAmountStr.replace(/[$,\s]/g, ""));
  if (taxAmountStr !== null)
    data.taxAmount = parseFloat((taxAmountStr || "0").replace(/[$,\s]/g, ""));
  if (status) data.status = status;
  if (notes !== null) data.notes = notes || null;

  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data,
    });

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    return { success: true };
  } catch (e) {
    console.error("Failed to update invoice:", e);
    return { errors: { general: "Failed to update invoice." } };
  }
}

/**
 * Update a single line item's category assignment.
 */
export async function updateLineItemCategory(
  lineItemId: string,
  categoryId: string | null
): Promise<ActionResult> {
  const user = await requireRole("invoices:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const lineItem = await prisma.lineItem.findFirst({
    where: { id: lineItemId, orgId },
    include: { invoice: { select: { id: true } } },
  });
  if (!lineItem) {
    return { errors: { general: "Line item not found." } };
  }

  try {
    await prisma.lineItem.update({
      where: { id: lineItemId },
      data: {
        categoryId: categoryId || null,
        categoryConfidence: categoryId ? 1.0 : null,
        categorySuggestion: null,
      },
    });

    revalidatePath(`/invoices/${lineItem.invoice.id}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to update line item:", e);
    return { errors: { general: "Failed to update line item category." } };
  }
}

/**
 * Bulk update status for multiple invoices.
 */
export async function bulkUpdateStatus(
  invoiceIds: string[],
  newStatus: string
): Promise<ActionResult> {
  const user = await requireRole("invoices:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  if (!invoiceIds.length) {
    return { errors: { general: "No invoices selected." } };
  }

  const validStatuses = ["pending", "reviewed", "approved", "paid"];
  if (!validStatuses.includes(newStatus)) {
    return { errors: { general: "Invalid status." } };
  }

  try {
    await prisma.invoice.updateMany({
      where: { id: { in: invoiceIds }, orgId },
      data: { status: newStatus },
    });

    revalidatePath("/invoices");
    return { success: true };
  } catch (e) {
    console.error("Failed to bulk update status:", e);
    return { errors: { general: "Failed to update invoices." } };
  }
}

/**
 * Add a new line item to an existing invoice.
 */
export async function addLineItem(
  invoiceId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireRole("invoices:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId },
  });
  if (!invoice) {
    return { errors: { general: "Invoice not found." } };
  }

  const description = (formData.get("description") as string) || "New item";
  const quantity = parseFloat(formData.get("quantity") as string) || 1;
  const unitPriceStr = formData.get("unitPrice") as string;
  const unitPrice = unitPriceStr ? parseFloat(unitPriceStr) : null;
  const amountStr = formData.get("amount") as string;
  const amount = amountStr ? parseFloat(amountStr) : (unitPrice ?? 0) * quantity;
  const categoryId = (formData.get("categoryId") as string) || null;
  const isTax = formData.get("isTax") === "true";

  try {
    await prisma.lineItem.create({
      data: {
        orgId,
        invoiceId,
        description,
        quantity,
        unitPrice,
        amount,
        categoryId,
        isTax,
      },
    });

    await recalculateInvoiceTotal(invoiceId);
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    return { success: true };
  } catch (e) {
    console.error("Failed to add line item:", e);
    return { errors: { general: "Failed to add line item." } };
  }
}

/**
 * Update a line item's fields.
 */
export async function updateLineItem(
  lineItemId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireRole("invoices:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const lineItem = await prisma.lineItem.findFirst({
    where: { id: lineItemId, orgId },
    include: { invoice: { select: { id: true } } },
  });
  if (!lineItem) {
    return { errors: { general: "Line item not found." } };
  }

  const data: Record<string, unknown> = {};

  const description = formData.get("description") as string;
  if (description !== null && description !== undefined)
    data.description = description;

  const quantityStr = formData.get("quantity") as string;
  if (quantityStr) data.quantity = parseFloat(quantityStr);

  const unitPriceStr = formData.get("unitPrice") as string;
  if (unitPriceStr !== null && unitPriceStr !== undefined)
    data.unitPrice = unitPriceStr ? parseFloat(unitPriceStr) : null;

  const amountStr = formData.get("amount") as string;
  if (amountStr) data.amount = parseFloat(amountStr);

  const categoryId = formData.get("categoryId") as string;
  if (categoryId !== null && categoryId !== undefined) {
    data.categoryId = categoryId || null;
    data.categoryConfidence = categoryId ? 1.0 : null;
    data.categorySuggestion = null;
  }

  const isTaxStr = formData.get("isTax") as string;
  if (isTaxStr !== null && isTaxStr !== undefined)
    data.isTax = isTaxStr === "true";

  try {
    await prisma.lineItem.update({
      where: { id: lineItemId },
      data,
    });

    await recalculateInvoiceTotal(lineItem.invoice.id);
    revalidatePath(`/invoices/${lineItem.invoice.id}`);
    revalidatePath("/invoices");
    return { success: true };
  } catch (e) {
    console.error("Failed to update line item:", e);
    return { errors: { general: "Failed to update line item." } };
  }
}

/**
 * Delete a line item from an invoice.
 */
export async function deleteLineItem(
  lineItemId: string
): Promise<ActionResult> {
  const user = await requireRole("invoices:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const lineItem = await prisma.lineItem.findFirst({
    where: { id: lineItemId, orgId },
    include: { invoice: { select: { id: true } } },
  });
  if (!lineItem) {
    return { errors: { general: "Line item not found." } };
  }

  try {
    await prisma.lineItem.delete({
      where: { id: lineItemId },
    });

    await recalculateInvoiceTotal(lineItem.invoice.id);
    revalidatePath(`/invoices/${lineItem.invoice.id}`);
    revalidatePath("/invoices");
    return { success: true };
  } catch (e) {
    console.error("Failed to delete line item:", e);
    return { errors: { general: "Failed to delete line item." } };
  }
}

/**
 * Recalculate an invoice's total from its line items.
 */
async function recalculateInvoiceTotal(invoiceId: string) {
  const lineItems = await prisma.lineItem.findMany({
    where: { invoiceId },
    select: { amount: true, isTax: true },
  });

  let subtotal = 0;
  let tax = 0;
  for (const li of lineItems) {
    const amt = Number(li.amount);
    if (li.isTax) {
      tax += amt;
    } else {
      subtotal += amt;
    }
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      totalAmount: Math.round((subtotal + tax) * 100) / 100,
      taxAmount: Math.round(tax * 100) / 100,
    },
  });
}

/**
 * Delete an invoice and its associated PDF.
 */
export async function deleteInvoice(
  invoiceId: string
): Promise<ActionResult> {
  const user = await requireRole("invoices:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId },
  });
  if (!invoice) {
    return { errors: { general: "Invoice not found." } };
  }

  try {
    // Delete PDF from storage
    if (invoice.pdfStoragePath) {
      await deleteInvoicePdf(invoice.pdfStoragePath);
    }

    // Delete invoice (cascade deletes line items)
    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    revalidatePath("/invoices");
    return { success: true };
  } catch (e) {
    console.error("Failed to delete invoice:", e);
    return { errors: { general: "Failed to delete invoice." } };
  }
}
