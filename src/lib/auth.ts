import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasPermission, type Role } from "@/lib/roles";

export type CurrentUser = {
  user: {
    id: string;
    orgId: string;
    userId: string;
    role: string;
    createdAt: Date;
  };
  orgId: string;
  authUser: {
    id: string;
    email: string | undefined;
  };
  role: Role;
};

/**
 * Get the current authenticated user with their org membership.
 * Redirects to /sign-in if not authenticated.
 * Returns { user, orgId, authUser } — all future server actions depend on this shape.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/sign-in");
  }

  // Find the user's org membership
  const membership = await prisma.orgMembership.findFirst({
    where: { userId: authUser.id },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    // This shouldn't happen if sign-up flow is correct,
    // but handle gracefully
    redirect("/sign-in");
  }

  return {
    user: {
      id: membership.id,
      orgId: membership.orgId,
      userId: membership.userId,
      role: membership.role,
      createdAt: membership.createdAt,
    },
    orgId: membership.orgId,
    authUser: {
      id: authUser.id,
      email: authUser.email,
    },
    role: membership.role as Role,
  };
}

/**
 * Role guard for server actions.
 * Returns the current user if they have the required permission,
 * or an error object if they don't.
 *
 * Usage:
 *   const user = await requireRole('invoices:write');
 *   if ('errors' in user) return user;
 *   const { orgId } = user;
 */
export async function requireRole(
  requiredPermission: string
): Promise<CurrentUser | { errors: { general: string } }> {
  const currentUser = await getCurrentUser();

  if (!hasPermission(currentUser.role, requiredPermission)) {
    return {
      errors: {
        general: "You do not have permission to perform this action.",
      },
    };
  }

  return currentUser;
}

/**
 * Get the organization name for display in the header.
 */
export async function getOrgName(orgId: string): Promise<string> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });
  return org?.name ?? "My Organization";
}
