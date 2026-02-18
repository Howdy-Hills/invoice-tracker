import { prisma } from "@/lib/prisma";

export interface DashboardData {
  project: {
    id: string;
    name: string;
    clientName: string | null;
    status: string;
  };

  summary: {
    totalBudget: number;
    totalSpent: number;
    totalUncategorized: number;
    remaining: number;
    percentUsed: number;
    invoiceCount: number;
    pendingCount: number;
    reviewedCount: number;
    approvedCount: number;
    paidCount: number;
  };

  categories: {
    id: string;
    name: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    lineItemCount: number;
    sortOrder: number;
  }[];

  vendors: {
    vendorName: string;
    totalSpent: number;
    invoiceCount: number;
  }[];

  recentInvoices: {
    id: string;
    vendorName: string | null;
    invoiceDate: string | null;
    totalAmount: number | null;
    status: string;
    createdAt: string;
  }[];

  spendingByMonth: {
    month: string;
    amount: number;
  }[];
}

export async function getDashboardData(
  orgId: string,
  projectId: string
): Promise<DashboardData | null> {
  // 1. Project info
  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
    select: { id: true, name: true, clientName: true, status: true },
  });

  if (!project) return null;

  // 2. Budget categories with spent aggregation
  const categories = await prisma.budgetCategory.findMany({
    where: { projectId, orgId },
    orderBy: { sortOrder: "asc" },
    include: {
      lineItems: {
        select: { amount: true },
      },
    },
  });

  const categoryData = categories.map((cat) => {
    const budgeted = Number(cat.budgetedAmount);
    const spent = cat.lineItems.reduce(
      (sum, li) => sum + Number(li.amount),
      0
    );
    const remaining = budgeted - spent;
    const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0;

    return {
      id: cat.id,
      name: cat.name,
      budgeted,
      spent,
      remaining,
      percentUsed,
      lineItemCount: cat.lineItems.length,
      sortOrder: cat.sortOrder,
    };
  });

  const totalBudget = categoryData.reduce((s, c) => s + c.budgeted, 0);
  const totalSpent = categoryData.reduce((s, c) => s + c.spent, 0);

  // 3. Invoice counts by status
  const invoiceCounts = await prisma.invoice.groupBy({
    by: ["status"],
    where: { projectId, orgId },
    _count: { id: true },
  });

  const countMap: Record<string, number> = {};
  let invoiceCount = 0;
  for (const row of invoiceCounts) {
    countMap[row.status] = row._count.id;
    invoiceCount += row._count.id;
  }

  // 4. Uncategorized line item total
  const uncategorized = await prisma.lineItem.aggregate({
    where: {
      orgId,
      invoice: { projectId },
      categoryId: null,
    },
    _sum: { amount: true },
  });

  const totalUncategorized = Number(uncategorized._sum.amount ?? 0);

  // 5. Vendor spending
  const vendorSpending = await prisma.invoice.groupBy({
    by: ["vendorName"],
    where: { projectId, orgId, vendorName: { not: null } },
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 20,
  });

  const vendors = vendorSpending.map((v) => ({
    vendorName: v.vendorName ?? "Unknown",
    totalSpent: Number(v._sum.totalAmount ?? 0),
    invoiceCount: v._count.id,
  }));

  // 6. Recent invoices
  const recent = await prisma.invoice.findMany({
    where: { projectId, orgId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      vendorName: true,
      invoiceDate: true,
      totalAmount: true,
      status: true,
      createdAt: true,
    },
  });

  const recentInvoices = recent.map((inv) => ({
    id: inv.id,
    vendorName: inv.vendorName,
    invoiceDate: inv.invoiceDate ? inv.invoiceDate.toISOString() : null,
    totalAmount: inv.totalAmount ? Number(inv.totalAmount) : null,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
  }));

  // 7. Spending by month — use raw SQL for date grouping
  let spendingByMonth: { month: string; amount: number }[] = [];
  try {
    const monthlyRows = await prisma.$queryRaw<
      { month: string; amount: string | number }[]
    >`
      SELECT TO_CHAR(i.invoice_date, 'YYYY-MM') as month,
             SUM(li.amount) as amount
      FROM line_items li
      JOIN invoices i ON li.invoice_id = i.id
      WHERE i.project_id = ${projectId}::uuid
        AND i.org_id = ${orgId}::uuid
        AND li.category_id IS NOT NULL
        AND i.invoice_date IS NOT NULL
      GROUP BY month
      ORDER BY month
    `;

    spendingByMonth = monthlyRows.map((r) => ({
      month: r.month,
      amount: parseFloat(String(r.amount)),
    }));
  } catch (e) {
    console.error("Spending by month query failed:", e);
    // Non-fatal — charts just show empty
  }

  const remaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return {
    project,
    summary: {
      totalBudget,
      totalSpent,
      totalUncategorized,
      remaining,
      percentUsed,
      invoiceCount,
      pendingCount: countMap["pending"] ?? 0,
      reviewedCount: countMap["reviewed"] ?? 0,
      approvedCount: countMap["approved"] ?? 0,
      paidCount: countMap["paid"] ?? 0,
    },
    categories: categoryData,
    vendors,
    recentInvoices,
    spendingByMonth,
  };
}
