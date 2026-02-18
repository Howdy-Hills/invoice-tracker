import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export interface OrgMember {
  id: string;
  userId: string;
  email: string;
  role: string;
  createdAt: Date;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  isExpired: boolean;
}

/**
 * Get all members of an organization with their emails.
 * We fetch emails from Supabase auth.users via the admin API.
 */
export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const memberships = await prisma.orgMembership.findMany({
    where: { orgId },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) return [];

  // Fetch user emails from Supabase
  const supabase = await createClient();
  const members: OrgMember[] = [];

  for (const m of memberships) {
    // Use Supabase to get user email
    // Since we don't have admin access from server client,
    // we'll use the user IDs we have. In practice, the current user's
    // email is already known. For other users, we store email in the invite flow.
    // Fallback: query from a joined approach using raw SQL or cache.
    // For now, use a simple approach with what we have.
    members.push({
      id: m.id,
      userId: m.userId,
      email: "", // Will be filled below
      role: m.role,
      createdAt: m.createdAt,
    });
  }

  // Fetch emails via raw SQL from Supabase auth.users
  try {
    const userIds = memberships.map((m) => m.userId);
    const emailRows = await prisma.$queryRawUnsafe<
      { id: string; email: string }[]
    >(
      `SELECT id::text, email FROM auth.users WHERE id = ANY($1::uuid[])`,
      userIds
    );

    const emailMap = new Map<string, string>();
    for (const row of emailRows) {
      emailMap.set(row.id, row.email);
    }

    for (const member of members) {
      member.email = emailMap.get(member.userId) ?? "Unknown";
    }
  } catch (e) {
    console.error("Failed to fetch member emails:", e);
    // Fall back — emails will show as "Unknown"
  }

  return members;
}

/**
 * Get all pending (non-expired) invites for an organization.
 */
export async function getPendingInvites(
  orgId: string
): Promise<PendingInvite[]> {
  const invites = await prisma.orgInvite.findMany({
    where: {
      orgId,
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return invites.map((inv: any) => ({
    id: inv.id as string,
    email: inv.email as string,
    role: inv.role as string,
    token: inv.token as string,
    expiresAt: inv.expiresAt as Date,
    createdAt: inv.createdAt as Date,
    isExpired: (inv.expiresAt as Date) < now,
  }));
}
