import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user already has an org membership
      const existing = await prisma.orgMembership.findFirst({
        where: { userId: data.user.id },
      });

      if (!existing) {
        // First time via magic link — create org + membership
        const emailPrefix = data.user.email?.split("@")[0] ?? "My";
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

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth code exchange failed — redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
