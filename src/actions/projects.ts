"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { setSelectedProjectId } from "@/lib/project-context";

type ActionResult = {
  success?: boolean;
  errors?: { general: string };
  projectId?: string;
};

export async function createProject(formData: FormData): Promise<ActionResult> {
  const user = await requireRole("projects:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const name = formData.get("name") as string;
  const clientName = (formData.get("clientName") as string) || null;
  const description = (formData.get("description") as string) || null;

  if (!name?.trim()) {
    return { errors: { general: "Project name is required." } };
  }

  try {
    const project = await prisma.project.create({
      data: {
        orgId,
        name: name.trim(),
        clientName: clientName?.trim() || null,
        description: description?.trim() || null,
      },
    });

    // Auto-select the newly created project
    await setSelectedProjectId(project.id);

    revalidatePath("/projects");
    return { success: true, projectId: project.id };
  } catch (e) {
    console.error("Failed to create project:", e);
    return { errors: { general: "Failed to create project." } };
  }
}

export async function updateProject(
  projectId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireRole("projects:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  // Verify project belongs to org
  const existing = await prisma.project.findFirst({
    where: { id: projectId, orgId },
  });

  if (!existing) {
    return { errors: { general: "Project not found." } };
  }

  const name = formData.get("name") as string;
  const clientName = formData.get("clientName") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;

  const data: Record<string, unknown> = {};
  if (name !== null && name !== undefined) data.name = name.trim();
  if (clientName !== null && clientName !== undefined)
    data.clientName = clientName.trim() || null;
  if (description !== null && description !== undefined)
    data.description = description.trim() || null;
  if (status !== null && status !== undefined) data.status = status;

  try {
    await prisma.project.update({
      where: { id: projectId },
      data,
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to update project:", e);
    return { errors: { general: "Failed to update project." } };
  }
}

export async function archiveProject(projectId: string): Promise<ActionResult> {
  const user = await requireRole("projects:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const existing = await prisma.project.findFirst({
    where: { id: projectId, orgId },
  });

  if (!existing) {
    return { errors: { general: "Project not found." } };
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "archived" },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to archive project:", e);
    return { errors: { general: "Failed to archive project." } };
  }
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  const user = await requireRole("projects:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const existing = await prisma.project.findFirst({
    where: { id: projectId, orgId },
  });

  if (!existing) {
    return { errors: { general: "Project not found." } };
  }

  // Future: check for invoices before deleting
  try {
    await prisma.project.delete({
      where: { id: projectId },
    });

    revalidatePath("/projects");
    return { success: true };
  } catch (e) {
    console.error("Failed to delete project:", e);
    return { errors: { general: "Failed to delete project." } };
  }
}

export async function selectProject(projectId: string): Promise<ActionResult> {
  await getCurrentUser(); // ensure authenticated
  await setSelectedProjectId(projectId);
  revalidatePath("/");
  return { success: true };
}
