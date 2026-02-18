import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface InvoiceFilters {
  status?: string;
  vendor?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export async function getFilteredInvoices(
  orgId: string,
  projectId: string,
  filters: InvoiceFilters = {}
) {
  const {
    status,
    vendor,
    search,
    sortBy = "createdAt",
    sortDir = "desc",
    page = 1,
    perPage = 20,
  } = filters;

  const where: Prisma.InvoiceWhereInput = {
    orgId,
    projectId,
    ...(status && status !== "all" ? { status } : {}),
    ...(vendor ? { vendorName: vendor } : {}),
    ...(search
      ? {
          OR: [
            { vendorName: { contains: search, mode: "insensitive" } },
            { invoiceNumber: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // Map sort fields
  const orderByMap: Record<string, Prisma.InvoiceOrderByWithRelationInput> = {
    createdAt: { createdAt: sortDir },
    date: { invoiceDate: sortDir },
    amount: { totalAmount: sortDir },
    vendor: { vendorName: sortDir },
  };
  const orderBy = orderByMap[sortBy] ?? { createdAt: "desc" };

  const [invoices, totalCount] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        project: { select: { name: true } },
        _count: { select: { lineItems: true } },
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    invoices: invoices.map((inv) => ({
      id: inv.id,
      projectId: inv.projectId,
      projectName: inv.project.name,
      vendorName: inv.vendorName,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      totalAmount: inv.totalAmount ? Number(inv.totalAmount) : null,
      taxAmount: Number(inv.taxAmount),
      status: inv.status,
      parseMethod: inv.parseMethod,
      parseConfidence: inv.parseConfidence
        ? Number(inv.parseConfidence)
        : null,
      pdfOriginalFilename: inv.pdfOriginalFilename,
      lineItemCount: inv._count.lineItems,
      createdAt: inv.createdAt,
    })),
    totalCount,
    totalPages: Math.ceil(totalCount / perPage),
    page,
    perPage,
  };
}

export async function getStatusCounts(orgId: string, projectId: string) {
  const groups = await prisma.invoice.groupBy({
    by: ["status"],
    where: { orgId, projectId },
    _count: { _all: true },
  });

  const counts: Record<string, number> = { all: 0 };
  for (const g of groups) {
    counts[g.status] = g._count._all;
    counts.all += g._count._all;
  }
  return counts;
}

export async function getProjectVendors(orgId: string, projectId: string) {
  const vendors = await prisma.invoice.findMany({
    where: { orgId, projectId, vendorName: { not: null } },
    distinct: ["vendorName"],
    select: { vendorName: true },
    orderBy: { vendorName: "asc" },
  });
  return vendors
    .map((v) => v.vendorName)
    .filter((name): name is string => name !== null);
}

export async function getInvoices(orgId: string, projectId?: string) {
  const invoices = await prisma.invoice.findMany({
    where: {
      orgId,
      ...(projectId ? { projectId } : {}),
    },
    include: {
      project: { select: { name: true } },
      _count: { select: { lineItems: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    projectId: inv.projectId,
    projectName: inv.project.name,
    vendorName: inv.vendorName,
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate,
    totalAmount: inv.totalAmount ? Number(inv.totalAmount) : null,
    taxAmount: Number(inv.taxAmount),
    status: inv.status,
    parseMethod: inv.parseMethod,
    parseConfidence: inv.parseConfidence ? Number(inv.parseConfidence) : null,
    pdfOriginalFilename: inv.pdfOriginalFilename,
    lineItemCount: inv._count.lineItems,
    createdAt: inv.createdAt,
  }));
}

export async function getInvoice(orgId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId },
    include: {
      project: {
        include: {
          budgetCategories: { orderBy: { sortOrder: "asc" } },
        },
      },
      lineItems: {
        include: {
          category: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!invoice) return null;

  return {
    id: invoice.id,
    orgId: invoice.orgId,
    projectId: invoice.projectId,
    projectName: invoice.project.name,
    vendorName: invoice.vendorName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    totalAmount: invoice.totalAmount ? Number(invoice.totalAmount) : null,
    taxAmount: Number(invoice.taxAmount),
    status: invoice.status,
    pdfStoragePath: invoice.pdfStoragePath,
    pdfOriginalFilename: invoice.pdfOriginalFilename,
    parseMethod: invoice.parseMethod,
    parseConfidence: invoice.parseConfidence
      ? Number(invoice.parseConfidence)
      : null,
    notes: invoice.notes,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    budgetCategories: invoice.project.budgetCategories.map((c) => ({
      id: c.id,
      name: c.name,
      budgetedAmount: Number(c.budgetedAmount),
    })),
    lineItems: invoice.lineItems.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: Number(li.quantity),
      unitPrice: li.unitPrice ? Number(li.unitPrice) : null,
      amount: Number(li.amount),
      categoryId: li.categoryId,
      categoryName: li.category?.name ?? null,
      categoryConfidence: li.categoryConfidence
        ? Number(li.categoryConfidence)
        : null,
      categorySuggestion: li.categorySuggestion,
      isTax: li.isTax,
    })),
  };
}
