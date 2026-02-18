"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { canManageMembers } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type ActionResult = {
  success?: boolean;
  errors?: { general: string };
  inviteLink?: string;
};

/**
 * Send an invite — creates an OrgInvite record and returns a shareable link.
 * Owner only.
 */
export async function sendInvite(formData: FormData): Promise<ActionResult> {
  const currentUser = await getCurrentUser();

  if (!canManageMembers(currentUser.role)) {
    return { errors: { general: "Only the owner can invite members." } };
  }

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = (formData.get("role") as string) || "viewer";

  if (!email) {
    return { errors: { general: "Email is required." } };
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { errors: { general: "Invalid email address." } };
  }

  // Only allow admin or viewer roles
  if (role !== "admin" && role !== "viewer") {
    return { errors: { general: "Invalid role. Must be admin or viewer." } };
  }

  // Check if email is already a member
  try {
    const existingMembers = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT om.id FROM org_memberships om
       JOIN auth.users au ON om.user_id = au.id
       WHERE om.org_id = $1::uuid AND LOWER(au.email) = $2`,
      currentUser.orgId,
      email
    );

    if (existingMembers.length > 0) {
      return { errors: { general: "This person is already a member." } };
    }
  } catch {
    // If query fails (e.g., no auth.users access), skip check
  }

  // Check for existing pending invite
  const existingInvite = await prisma.orgInvite.findFirst({
    where: {
      orgId: currentUser.orgId,
      email,
      status: "pending",
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvite) {
    // Return existing invite link
    const origin = (await headers()).get("origin") ?? "";
    return {
      success: true,
      inviteLink: `${origin}/invite/${existingInvite.token}`,
    };
  }

  // Create new invite (7-day expiry)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  try {
    const invite = await prisma.orgInvite.create({
      data: {
        orgId: currentUser.orgId,
        email,
        role,
        invitedBy: currentUser.authUser.id,
        expiresAt,
      },
    });

    const origin = (await headers()).get("origin") ?? "";
    const inviteLink = `${origin}/invite/${invite.token}`;

    revalidatePath("/settings");
    return { success: true, inviteLink };
  } catch (e) {
    console.error("Failed to create invite:", e);
    return { errors: { general: "Failed to create invite." } };
  }
}

/**
 * Accept an invite — creates an OrgMembership for the current user.
 */
export async function acceptInvite(
  token: string
): Promise<ActionResult & { orgId?: string }> {
  const currentUser = await getCurrentUser();

  // Find invite by token
  const invite = await prisma.orgInvite.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  if (!invite) {
    return { errors: { general: "Invite not found." } };
  }

  if (invite.status !== "pending") {
    return { errors: { general: "This invite has already been used." } };
  }

  if (invite.expiresAt < new Date()) {
    // Mark as expired
    await prisma.orgInvite.update({
      where: { id: invite.id },
      data: { status: "expired" },
    });
    return { errors: { general: "This invite has expired." } };
  }

  // Check if user is already a member of this org
  const existingMembership = await prisma.orgMembership.findUnique({
    where: {
      orgId_userId: {
        orgId: invite.orgId,
        userId: currentUser.authUser.id,
      },
    },
  });

  if (existingMembership) {
    // Already a member — mark invite as accepted
    await prisma.orgInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    });
    return { success: true, orgId: invite.orgId };
  }

  // Create membership
  try {
    await prisma.orgMembership.create({
      data: {
        orgId: invite.orgId,
        userId: currentUser.authUser.id,
        role: invite.role,
      },
    });

    // Mark invite as accepted
    await prisma.orgInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    });

    return { success: true, orgId: invite.orgId };
  } catch (e) {
    console.error("Failed to accept invite:", e);
    return { errors: { general: "Failed to accept invite." } };
  }
}

/**
 * Revoke a pending invite. Owner only.
 */
export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  const currentUser = await getCurrentUser();

  if (!canManageMembers(currentUser.role)) {
    return { errors: { general: "Only the owner can revoke invites." } };
  }

  const invite = await prisma.orgInvite.findFirst({
    where: { id: inviteId, orgId: currentUser.orgId },
  });

  if (!invite) {
    return { errors: { general: "Invite not found." } };
  }

  try {
    await prisma.orgInvite.delete({
      where: { id: inviteId },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    console.error("Failed to revoke invite:", e);
    return { errors: { general: "Failed to revoke invite." } };
  }
}

/**
 * Change a member's role. Owner only.
 * Cannot change own role. Cannot make someone owner.
 */
export async function changeMemberRole(
  membershipId: string,
  newRole: string
): Promise<ActionResult> {
  const currentUser = await getCurrentUser();

  if (!canManageMembers(currentUser.role)) {
    return { errors: { general: "Only the owner can change roles." } };
  }

  if (newRole !== "admin" && newRole !== "viewer") {
    return { errors: { general: "Invalid role." } };
  }

  const membership = await prisma.orgMembership.findFirst({
    where: { id: membershipId, orgId: currentUser.orgId },
  });

  if (!membership) {
    return { errors: { general: "Member not found." } };
  }

  // Cannot change own role
  if (membership.userId === currentUser.authUser.id) {
    return { errors: { general: "You cannot change your own role." } };
  }

  // Cannot change the owner's role
  if (membership.role === "owner") {
    return { errors: { general: "Cannot change the owner's role." } };
  }

  try {
    await prisma.orgMembership.update({
      where: { id: membershipId },
      data: { role: newRole },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    console.error("Failed to change role:", e);
    return { errors: { general: "Failed to change role." } };
  }
}

/**
 * Remove a member from the organization. Owner only.
 * Cannot remove self (owner).
 */
export async function removeMember(
  membershipId: string
): Promise<ActionResult> {
  const currentUser = await getCurrentUser();

  if (!canManageMembers(currentUser.role)) {
    return { errors: { general: "Only the owner can remove members." } };
  }

  const membership = await prisma.orgMembership.findFirst({
    where: { id: membershipId, orgId: currentUser.orgId },
  });

  if (!membership) {
    return { errors: { general: "Member not found." } };
  }

  // Cannot remove self
  if (membership.userId === currentUser.authUser.id) {
    return { errors: { general: "You cannot remove yourself." } };
  }

  // Cannot remove the owner
  if (membership.role === "owner") {
    return { errors: { general: "Cannot remove the owner." } };
  }

  try {
    await prisma.orgMembership.delete({
      where: { id: membershipId },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    console.error("Failed to remove member:", e);
    return { errors: { general: "Failed to remove member." } };
  }
}

/**
 * Update the organization name. Owner only.
 */
export async function updateOrgName(
  formData: FormData
): Promise<ActionResult> {
  const currentUser = await getCurrentUser();

  if (!canManageMembers(currentUser.role)) {
    return { errors: { general: "Only the owner can rename the organization." } };
  }

  const name = (formData.get("name") as string)?.trim();
  if (!name) {
    return { errors: { general: "Organization name is required." } };
  }

  try {
    await prisma.organization.update({
      where: { id: currentUser.orgId },
      data: { name },
    });

    revalidatePath("/settings");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Failed to update org name:", e);
    return { errors: { general: "Failed to update organization name." } };
  }
}
