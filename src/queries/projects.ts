import { prisma } from "@/lib/prisma";

export async function getProjects(orgId: string) {
  const projects = await prisma.project.findMany({
    where: { orgId },
    include: {
      _count: {
        select: { budgetCategories: true },
      },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return projects.map((p) => ({
    ...p,
    categoryCount: p._count.budgetCategories,
  }));
}

export async function getProject(orgId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
    include: {
      budgetCategories: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!project) return null;

  return {
    ...project,
    budgetCategories: project.budgetCategories.map((cat) => ({
      ...cat,
      budgetedAmount: Number(cat.budgetedAmount),
    })),
  };
}

export async function getTemplates(orgId: string) {
  return prisma.budgetTemplate.findMany({
    where: { orgId },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
