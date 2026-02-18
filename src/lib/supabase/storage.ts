"use server";

import { createClient } from "./server";

const BUCKET = "invoices";

/**
 * Upload a PDF file to Supabase Storage.
 * Path format: orgId/projectId/invoiceId.pdf
 */
export async function uploadInvoicePdf(
  orgId: string,
  projectId: string,
  invoiceId: string,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  const supabase = await createClient();
  const storagePath = `${orgId}/${projectId}/${invoiceId}.pdf`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    console.error("Storage upload error:", error);
    return { path: null, error: error.message };
  }

  return { path: storagePath, error: null };
}

/**
 * Get a signed URL for downloading an invoice PDF.
 * Valid for 1 hour.
 */
export async function getInvoicePdfUrl(
  storagePath: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error) {
    console.error("Storage signed URL error:", error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Delete an invoice PDF from storage.
 */
export async function deleteInvoicePdf(
  storagePath: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);

  if (error) {
    console.error("Storage delete error:", error);
    return { error: error.message };
  }

  return { error: null };
}
