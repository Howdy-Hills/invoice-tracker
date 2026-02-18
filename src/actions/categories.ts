"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { DEFAULT_CONSTRUCTION_CATEGORIES } from "@/lib/constants";

type ActionResult = {
  success?: boolean;
  errors?: { general: string };
};

function parseCurrency(value: string | null): number {
  if (!value) return 0;
  const cleaned = value.replace(/[$,\s]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num) || num < 0) return 0;
  return Math.round(num * 100) / 100; // 2 decimal places
}

export async function loadDefaultBudget(
  projectId: string
): Promise<ActionResult> {
  const user = await requireRole("categories:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
    include: { _count: { select: { budgetCategories: true } } },
  });

  if (!project) {
    return { errors: { general: "Project not found." } };
  }

  // Get current max sort order to append after existing categories
  const maxSort = await prisma.budgetCategory.aggregate({
    where: { projectId },
    _max: { sortOrder: true },
  });
  const startOrder = (maxSort._max.sortOrder ?? 0) + 1;

  try {
    await prisma.budgetCategory.createMany({
      data: DEFAULT_CONSTRUCTION_CATEGORIES.map((cat, i) => ({
        orgId,
        projectId,
        name: cat.name,
        budgetedAmount: cat.defaultAmount,
        sortOrder: startOrder + i,
      })),
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to load default budget:", e);
    return { errors: { general: "Failed to load default budget." } };
  }
}

export async function addCategory(
  projectId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireRole("categories:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const name = formData.get("name") as string;
  const amountStr = formData.get("budgetedAmount") as string;

  if (!name?.trim()) {
    return { errors: { general: "Category name is required." } };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
  });
  if (!project) {
    return { errors: { general: "Project not found." } };
  }

  const maxSort = await prisma.budgetCategory.aggregate({
    where: { projectId },
    _max: { sortOrder: true },
  });

  try {
    await prisma.budgetCategory.create({
      data: {
        orgId,
        projectId,
        name: name.trim(),
        budgetedAmount: parseCurrency(amountStr),
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to add category:", e);
    return { errors: { general: "Failed to add category." } };
  }
}

export async function updateCategory(
  categoryId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireRole("categories:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const category = await prisma.budgetCategory.findFirst({
    where: { id: categoryId, orgId },
  });

  if (!category) {
    return { errors: { general: "Category not found." } };
  }

  const name = formData.get("name") as string;
  const amountStr = formData.get("budgetedAmount") as string;

  const data: Record<string, unknown> = {};
  if (name !== null && name !== undefined) data.name = name.trim();
  if (amountStr !== null && amountStr !== undefined)
    data.budgetedAmount = parseCurrency(amountStr);

  try {
    await prisma.budgetCategory.update({
      where: { id: categoryId },
      data,
    });

    revalidatePath(`/projects/${category.projectId}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to update category:", e);
    return { errors: { general: "Failed to update category." } };
  }
}

export async function deleteCategory(
  categoryId: string
): Promise<ActionResult> {
  const user = await requireRole("categories:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const category = await prisma.budgetCategory.findFirst({
    where: { id: categoryId, orgId },
  });

  if (!category) {
    return { errors: { general: "Category not found." } };
  }

  // Future: check for line items before deleting
  try {
    await prisma.budgetCategory.delete({
      where: { id: categoryId },
    });

    revalidatePath(`/projects/${category.projectId}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to delete category:", e);
    return { errors: { general: "Failed to delete category." } };
  }
}

export async function reorderCategories(
  projectId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  const user = await requireRole("categories:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
  });
  if (!project) {
    return { errors: { general: "Project not found." } };
  }

  try {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.budgetCategory.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      )
    );

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to reorder categories:", e);
    return { errors: { general: "Failed to reorder categories." } };
  }
}

export async function saveAsTemplate(
  projectId: string,
  templateName: string
): Promise<ActionResult> {
  const user = await requireRole("categories:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
    include: { budgetCategories: { orderBy: { sortOrder: "asc" } } },
  });

  if (!project) {
    return { errors: { general: "Project not found." } };
  }

  if (project.budgetCategories.length === 0) {
    return { errors: { general: "No categories to save as template." } };
  }

  if (!templateName?.trim()) {
    return { errors: { general: "Template name is required." } };
  }

  try {
    await prisma.budgetTemplate.create({
      data: {
        orgId,
        name: templateName.trim(),
        items: {
          create: project.budgetCategories.map((cat) => ({
            orgId,
            categoryName: cat.name,
            defaultAmount: cat.budgetedAmount,
            sortOrder: cat.sortOrder,
          })),
        },
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to save template:", e);
    return { errors: { general: "Failed to save template." } };
  }
}

export async function loadTemplate(
  projectId: string,
  templateId: string
): Promise<ActionResult> {
  const user = await requireRole("categories:write");
  if ("errors" in user) return user;
  const { orgId } = user;

  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
  });
  if (!project) {
    return { errors: { general: "Project not found." } };
  }

  const template = await prisma.budgetTemplate.findFirst({
    where: { id: templateId, orgId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template) {
    return { errors: { general: "Template not found." } };
  }

  const maxSort = await prisma.budgetCategory.aggregate({
    where: { projectId },
    _max: { sortOrder: true },
  });
  const startOrder = (maxSort._max.sortOrder ?? 0) + 1;

  try {
    await prisma.budgetCategory.createMany({
      data: template.items.map((item, i) => ({
        orgId,
        projectId,
        name: item.categoryName,
        budgetedAmount: item.defaultAmount,
        sortOrder: startOrder + i,
      })),
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to load template:", e);
    return { errors: { general: "Failed to load template." } };
  }
}
