"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { normalizeVendorName } from "@/lib/vendor-matching";

type ActionResult = {
  success?: boolean;
  errors?: { general: string };
  vendorId?: string;
};

/**
 * Create or update a vendor record.
 * Uses normalised name for dedup; upserts on orgId + normalizedName.
 */
export async function upsertVendor(formData: FormData): Promise<ActionResult> {
  const user = await requireRole("vendors:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const name = (formData.get("name") as string)?.trim();
  const defaultCategoryId =
    (formData.get("defaultCategoryId") as string) || null;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!name) {
    return { errors: { general: "Vendor name is required." } };
  }

  const normalizedName = normalizeVendorName(name);

  try {
    const vendor = await prisma.vendor.upsert({
      where: {
        orgId_normalizedName: { orgId, normalizedName },
      },
      create: {
        orgId,
        name,
        normalizedName,
        defaultCategoryId,
        email,
        phone,
        notes,
      },
      update: {
        name,
        defaultCategoryId,
        email,
        phone,
        notes,
      },
    });

    revalidatePath("/invoices");
    return { success: true, vendorId: vendor.id };
  } catch (e) {
    console.error("Failed to upsert vendor:", e);
    return { errors: { general: "Failed to save vendor." } };
  }
}

/**
 * Update a vendor's default category (from the vendors page or after invoice save).
 */
export async function updateVendorCategory(
  vendorId: string,
  categoryId: string | null
): Promise<ActionResult> {
  const user = await requireRole("vendors:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, orgId },
  });
  if (!vendor) {
    return { errors: { general: "Vendor not found." } };
  }

  try {
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { defaultCategoryId: categoryId },
    });

    revalidatePath("/invoices");
    return { success: true };
  } catch (e) {
    console.error("Failed to update vendor category:", e);
    return { errors: { general: "Failed to update vendor." } };
  }
}

/**
 * Delete a vendor.
 */
export async function deleteVendor(vendorId: string): Promise<ActionResult> {
  const user = await requireRole("vendors:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, orgId },
  });
  if (!vendor) {
    return { errors: { general: "Vendor not found." } };
  }

  try {
    await prisma.vendor.delete({
      where: { id: vendorId },
    });

    revalidatePath("/vendors");
    revalidatePath("/invoices");
    return { success: true };
  } catch (e) {
    console.error("Failed to delete vendor:", e);
    return { errors: { general: "Failed to delete vendor." } };
  }
}

/**
 * Update a vendor's fields.
 */
export async function updateVendor(
  vendorId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireRole("vendors:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, orgId },
  });
  if (!vendor) {
    return { errors: { general: "Vendor not found." } };
  }

  const name = (formData.get("name") as string)?.trim();
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const notes = formData.get("notes") as string;
  const defaultCategoryId =
    (formData.get("defaultCategoryId") as string) || null;

  if (!name) {
    return { errors: { general: "Vendor name is required." } };
  }

  const data: Record<string, unknown> = {
    name,
    normalizedName: normalizeVendorName(name),
    email: email || null,
    phone: phone || null,
    notes: notes || null,
    defaultCategoryId,
  };

  try {
    await prisma.vendor.update({
      where: { id: vendorId },
      data,
    });

    revalidatePath(`/vendors/${vendorId}`);
    revalidatePath("/vendors");
    return { success: true };
  } catch (e) {
    console.error("Failed to update vendor:", e);
    return { errors: { general: "Failed to update vendor." } };
  }
}

/**
 * Merge multiple vendors into one.
 * The "keep" vendor survives; merged vendors get absorbed.
 */
export async function mergeVendors(
  keepVendorId: string,
  mergeVendorIds: string[]
): Promise<ActionResult & { mergedCount?: number }> {
  const user = await requireRole("vendors:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  if (!mergeVendorIds.length) {
    return { errors: { general: "No vendors to merge." } };
  }

  const keepVendor = await prisma.vendor.findFirst({
    where: { id: keepVendorId, orgId },
  });
  if (!keepVendor) {
    return { errors: { general: "Keep vendor not found." } };
  }

  const mergeVendors = await prisma.vendor.findMany({
    where: { id: { in: mergeVendorIds }, orgId },
  });
  if (mergeVendors.length === 0) {
    return { errors: { general: "No valid vendors to merge." } };
  }

  try {
    let totalInvoicesUpdated = 0;

    for (const mv of mergeVendors) {
      // Update invoices: change vendor_name to the keep vendor's name
      const result = await prisma.invoice.updateMany({
        where: {
          orgId,
          vendorName: mv.name,
        },
        data: {
          vendorName: keepVendor.name,
        },
      });
      totalInvoicesUpdated += result.count;

      // Copy contact info if keep vendor's fields are empty
      const updates: Record<string, string> = {};
      if (!keepVendor.email && mv.email) updates.email = mv.email;
      if (!keepVendor.phone && mv.phone) updates.phone = mv.phone;
      if (!keepVendor.notes && mv.notes) updates.notes = mv.notes;

      if (Object.keys(updates).length > 0) {
        await prisma.vendor.update({
          where: { id: keepVendorId },
          data: updates,
        });
      }

      // Delete the merged vendor
      await prisma.vendor.delete({
        where: { id: mv.id },
      });
    }

    revalidatePath("/vendors");
    revalidatePath("/invoices");
    return {
      success: true,
      mergedCount: totalInvoicesUpdated,
    };
  } catch (e) {
    console.error("Failed to merge vendors:", e);
    return { errors: { general: "Failed to merge vendors." } };
  }
}

/**
 * Create a new vendor manually.
 */
export async function createVendor(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireRole("vendors:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const defaultCategoryId =
    (formData.get("defaultCategoryId") as string) || null;

  if (!name) {
    return { errors: { general: "Vendor name is required." } };
  }

  const normalizedName = normalizeVendorName(name);

  // Check for duplicate
  const existing = await prisma.vendor.findUnique({
    where: { orgId_normalizedName: { orgId, normalizedName } },
  });
  if (existing) {
    return {
      errors: {
        general: `A vendor with a similar name already exists: "${existing.name}"`,
      },
    };
  }

  try {
    const vendor = await prisma.vendor.create({
      data: {
        orgId,
        name,
        normalizedName,
        email,
        phone,
        notes,
        defaultCategoryId,
      },
    });

    revalidatePath("/vendors");
    return { success: true, vendorId: vendor.id };
  } catch (e) {
    console.error("Failed to create vendor:", e);
    return { errors: { general: "Failed to create vendor." } };
  }
}

/**
 * Auto-create/update a vendor when saving an invoice.
 * Called internally from the invoice save flow.
 */
export async function ensureVendor(
  orgId: string,
  vendorName: string,
  defaultCategoryId?: string | null
): Promise<string | null> {
  if (!vendorName?.trim()) return null;

  const normalizedName = normalizeVendorName(vendorName);

  try {
    const vendor = await prisma.vendor.upsert({
      where: {
        orgId_normalizedName: { orgId, normalizedName },
      },
      create: {
        orgId,
        name: vendorName.trim(),
        normalizedName,
        defaultCategoryId: defaultCategoryId || null,
      },
      update: {
        // Only update default category if one is provided and the vendor doesn't have one
        ...(defaultCategoryId
          ? {
              defaultCategoryId: defaultCategoryId,
            }
          : {}),
      },
    });

    return vendor.id;
  } catch (e) {
    console.error("ensureVendor failed:", e);
    return null;
  }
}
