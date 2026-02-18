"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { validateGeminiKey } from "@/lib/gemini";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success?: boolean;
  errors?: { general: string };
};

/**
 * Save AI settings (Gemini API key + preferences).
 */
export async function saveAiSettings(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireRole("ai_settings:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const apiKey = (formData.get("apiKey") as string)?.trim() || null;
  const autoCategorize = formData.get("autoCategorize") === "true";
  const thresholdStr = formData.get("categorizeThreshold") as string;
  const categorizeThreshold = thresholdStr ? parseFloat(thresholdStr) : 0.7;

  // Validate API key if provided
  if (apiKey) {
    const isValid = await validateGeminiKey(apiKey);
    if (!isValid) {
      return {
        errors: {
          general:
            "Invalid Gemini API key. Please check the key and try again.",
        },
      };
    }
  }

  try {
    const apiKeyEncrypted = apiKey ? await encrypt(apiKey) : null;

    await prisma.aiSettings.upsert({
      where: { orgId },
      create: {
        orgId,
        provider: "gemini",
        apiKeyEncrypted,
        autoCategorize,
        categorizeThreshold,
      },
      update: {
        // Only update the key if a new one was provided
        ...(apiKey !== null ? { apiKeyEncrypted } : {}),
        autoCategorize,
        categorizeThreshold,
      },
    });

    revalidatePath("/settings/ai");
    return { success: true };
  } catch (e) {
    console.error("Failed to save AI settings:", e);
    return { errors: { general: "Failed to save AI settings." } };
  }
}

/**
 * Remove the stored API key.
 */
export async function removeApiKey(): Promise<ActionResult> {
  const user = await requireRole("ai_settings:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  try {
    await prisma.aiSettings.update({
      where: { orgId },
      data: { apiKeyEncrypted: null },
    });

    revalidatePath("/settings/ai");
    return { success: true };
  } catch (e) {
    console.error("Failed to remove API key:", e);
    return { errors: { general: "Failed to remove API key." } };
  }
}

/**
 * Get current AI settings (without the raw key).
 */
export async function getAiSettings(orgId: string) {
  const settings = await prisma.aiSettings.findUnique({
    where: { orgId },
  });

  if (!settings) return null;

  return {
    provider: settings.provider,
    hasApiKey: !!settings.apiKeyEncrypted,
    autoCategorize: settings.autoCategorize,
    categorizeThreshold: Number(settings.categorizeThreshold),
  };
}
