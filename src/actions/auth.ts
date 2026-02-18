"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

type AuthActionResult = {
  success?: boolean;
  errors?: { general: string };
};

export async function signUp(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { errors: { general: "Email and password are required." } };
  }

  if (password.length < 6) {
    return { errors: { general: "Password must be at least 6 characters." } };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    return { errors: { general: error.message } };
  }

  if (data.user) {
    // Auto-create organization and membership on sign-up
    const emailPrefix = email.split("@")[0] ?? "My";
    const orgName = `${emailPrefix}'s Organization`;

    try {
      const org = await prisma.organization.create({
        data: { name: orgName },
      });

      await prisma.orgMembership.create({
        data: {
          orgId: org.id,
          userId: data.user.id,
          role: "owner",
        },
      });
    } catch (e) {
      // If org already exists for this user (e.g., duplicate sign-up attempt), skip
      const existing = await prisma.orgMembership.findFirst({
        where: { userId: data.user.id },
      });
      if (!existing) {
        console.error("Failed to create org for new user:", e);
        return { errors: { general: "Account created but organization setup failed. Please contact support." } };
      }
    }
  }

  return { success: true };
}

export async function signIn(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { errors: { general: "Email and password are required." } };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { errors: { general: error.message } };
  }

  // Ensure org + membership exist (handles users who signed up before DB was ready)
  if (data.user) {
    const existing = await prisma.orgMembership.findFirst({
      where: { userId: data.user.id },
    });

    if (!existing) {
      const emailPrefix = email.split("@")[0] ?? "My";
      const orgName = `${emailPrefix}'s Organization`;

      const org = await prisma.organization.create({
        data: { name: orgName },
      });

      await prisma.orgMembership.create({
        data: {
          orgId: org.id,
          userId: data.user.id,
          role: "owner",
        },
      });
    }
  }

  return { success: true };
}

export async function signInWithMagicLink(
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;

  if (!email) {
    return { errors: { general: "Email is required." } };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    return { errors: { general: error.message } };
  }

  return { errors: { general: "Check your email for a sign-in link!" } };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
