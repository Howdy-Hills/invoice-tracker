import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

// ── Shared Helpers ────────────────────────────────────────

function formatDateStr(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function today(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

interface SheetDef {
  name: string;
  titleRows?: string[][];
  headers: string[];
  rows: (string | number | null)[][];
  colWidths?: number[];
}

function buildWorkbook(sheets: SheetDef[]): Buffer {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const data: (string | number | null)[][] = [];

    // Title rows
    if (sheet.titleRows) {
      for (const tr of sheet.titleRows) {
        data.push(tr);
      }
      data.push([]); // blank separator row
    }

    // Header row
    data.push(sheet.headers);

    // Data rows
    for (const row of sheet.rows) {
      data.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Column widths
    if (sheet.colWidths) {
      ws["!cols"] = sheet.colWidths.map((w) => ({ wch: w }));
    }

    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buf);
}

// ── Budget vs. Actual ─────────────────────────────────────

export async function generateBudgetReport(
  orgId: string,
  projectId: string
): Promise<Buffer> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
  });

  const categories = await prisma.budgetCategory.findMany({
    where: { projectId, orgId },
    orderBy: { sortOrder: "asc" },
    include: {
      lineItems: { select: { amount: true } },
    },
  });

  const rows: (string | number | null)[][] = [];
  let totalBudgeted = 0;
  let totalSpent = 0;

  for (const cat of categories) {
    const budgeted = Number(cat.budgetedAmount);
    const spent = cat.lineItems.reduce(
      (sum, li) => sum + Number(li.amount),
      0
    );
    const remaining = budgeted - spent;
    const percentUsed = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0;
    const status =
      percentUsed > 100
        ? "OVER BUDGET"
        : percentUsed > 90
        ? "WARNING"
        : "OK";

    rows.push([cat.name, budgeted, spent, remaining, `${percentUsed}%`, status]);
    totalBudgeted += budgeted;
    totalSpent += spent;
  }

  // Total row
  const totalPercent = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
  rows.push([
    "TOTAL",
    totalBudgeted,
    totalSpent,
    totalBudgeted - totalSpent,
    `${totalPercent}%`,
    "",
  ]);

  // Uncategorized
  const uncategorized = await prisma.lineItem.aggregate({
    where: { orgId, invoice: { projectId }, categoryId: null },
    _sum: { amount: true },
  });
  const uncatAmount = Number(uncategorized._sum.amount ?? 0);
  if (uncatAmount > 0) {
    rows.push([
      "UNCATEGORIZED",
      0,
      uncatAmount,
      0,
      "—",
      "NEEDS REVIEW",
    ]);
  }

  return buildWorkbook([
    {
      name: "Budget vs Actual",
      titleRows: [
        [`Budget vs. Actual — ${project?.name ?? "Project"}`],
        [`Client: ${project?.clientName ?? "N/A"}`],
        [`Generated: ${today()}`],
      ],
      headers: [
        "Category",
        "Budgeted",
        "Spent",
        "Remaining",
        "% Used",
        "Status",
      ],
      rows,
      colWidths: [28, 16, 16, 16, 12, 16],
    },
  ]);
}

// ── Invoice Detail ────────────────────────────────────────

interface InvoiceReportFilters {
  dateFrom?: string | null;
  dateTo?: string | null;
  status?: string | null;
}

export async function generateInvoiceReport(
  orgId: string,
  projectId: string,
  filters: InvoiceReportFilters
): Promise<Buffer> {
  const where: Record<string, unknown> = { projectId, orgId };
  if (filters.status) where.status = filters.status;
  if (filters.dateFrom || filters.dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
    if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
    where.invoiceDate = dateFilter;
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { invoiceDate: "desc" },
    include: {
      lineItems: {
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
  });

  // Sheet 1: Invoice Summary
  const summaryRows: (string | number | null)[][] = [];
  let totalAmount = 0;
  let totalTax = 0;
  let totalLineItems = 0;
  let totalCategorized = 0;

  for (const inv of invoices) {
    const amt = Number(inv.totalAmount ?? 0);
    const tax = Number(inv.taxAmount ?? 0);
    const categorized = inv.lineItems.filter((li) => li.categoryId).length;

    summaryRows.push([
      inv.vendorName ?? "",
      inv.invoiceNumber ?? "",
      formatDateStr(inv.invoiceDate),
      amt,
      tax,
      inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
      inv.lineItems.length,
      categorized,
    ]);
    totalAmount += amt;
    totalTax += tax;
    totalLineItems += inv.lineItems.length;
    totalCategorized += categorized;
  }

  summaryRows.push([
    `TOTAL (${invoices.length} invoices)`,
    "",
    "",
    totalAmount,
    totalTax,
    "",
    totalLineItems,
    totalCategorized,
  ]);

  // Sheet 2: Line Items
  const lineRows: (string | number | null)[][] = [];
  let lineTotal = 0;

  for (const inv of invoices) {
    for (const li of inv.lineItems) {
      const amt = Number(li.amount);
      lineRows.push([
        inv.vendorName ?? "",
        inv.invoiceNumber ?? "",
        formatDateStr(inv.invoiceDate),
        li.description,
        Number(li.quantity),
        li.unitPrice ? Number(li.unitPrice) : null,
        amt,
        li.category?.name ?? "(uncategorized)",
        li.isTax ? "Yes" : "",
      ]);
      lineTotal += amt;
    }
  }

  lineRows.push([
    `TOTAL (${lineRows.length} line items)`,
    "",
    "",
    "",
    null,
    null,
    lineTotal,
    "",
    "",
  ]);

  const titleRows: string[][] = [
    [`Invoice Detail — ${project?.name ?? "Project"}`],
    [`Client: ${project?.clientName ?? "N/A"}`],
    [`Generated: ${today()}`],
  ];
  if (filters.dateFrom || filters.dateTo) {
    titleRows.push([
      `Date Range: ${filters.dateFrom ?? "start"} to ${
        filters.dateTo ?? "present"
      }`,
    ]);
  }

  return buildWorkbook([
    {
      name: "Invoice Summary",
      titleRows,
      headers: [
        "Vendor",
        "Invoice #",
        "Date",
        "Total",
        "Tax",
        "Status",
        "Line Items",
        "Categorized",
      ],
      rows: summaryRows,
      colWidths: [28, 16, 14, 16, 14, 14, 12, 14],
    },
    {
      name: "Line Items",
      headers: [
        "Vendor",
        "Invoice #",
        "Invoice Date",
        "Description",
        "Qty",
        "Unit Price",
        "Amount",
        "Category",
        "Tax Item",
      ],
      rows: lineRows,
      colWidths: [28, 16, 14, 38, 8, 14, 14, 22, 10],
    },
  ]);
}

// ── Vendor Summary ────────────────────────────────────────

export async function generateVendorReport(
  orgId: string,
  projectId: string
): Promise<Buffer> {
  const invoices = await prisma.invoice.findMany({
    where: { projectId, orgId, vendorName: { not: null } },
    include: {
      lineItems: {
        include: { category: { select: { name: true } } },
      },
    },
  });

  const vendorMap = new Map<
    string,
    {
      invoiceCount: number;
      totalSpent: number;
      categories: Set<string>;
      firstDate: Date | null;
      lastDate: Date | null;
    }
  >();

  for (const inv of invoices) {
    const vendor = inv.vendorName!;
    const existing = vendorMap.get(vendor) ?? {
      invoiceCount: 0,
      totalSpent: 0,
      categories: new Set<string>(),
      firstDate: null,
      lastDate: null,
    };

    existing.invoiceCount++;
    existing.totalSpent += Number(inv.totalAmount ?? 0);

    for (const li of inv.lineItems) {
      if (li.category?.name) existing.categories.add(li.category.name);
    }

    if (inv.invoiceDate) {
      const d = new Date(inv.invoiceDate);
      if (!existing.firstDate || d < existing.firstDate) existing.firstDate = d;
      if (!existing.lastDate || d > existing.lastDate) existing.lastDate = d;
    }

    vendorMap.set(vendor, existing);
  }

  const vendorRows = Array.from(vendorMap.entries())
    .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
    .map(
      ([vendor, data]) =>
        [
          vendor,
          data.invoiceCount,
          data.totalSpent,
          Array.from(data.categories).sort().join(", "),
          formatDateStr(data.firstDate),
          formatDateStr(data.lastDate),
        ] as (string | number | null)[]
    );

  // Totals
  vendorRows.push([
    `TOTAL (${vendorMap.size} vendors)`,
    vendorRows.reduce((s, r) => s + (r[1] as number), 0),
    vendorRows.reduce((s, r) => s + (r[2] as number), 0),
    "",
    "",
    "",
  ]);

  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
  });

  return buildWorkbook([
    {
      name: "Vendor Summary",
      titleRows: [
        [`Vendor Summary — ${project?.name ?? "Project"}`],
        [`Client: ${project?.clientName ?? "N/A"}`],
        [`Generated: ${today()}`],
      ],
      headers: [
        "Vendor",
        "# Invoices",
        "Total Spent",
        "Categories Used",
        "First Invoice",
        "Last Invoice",
      ],
      rows: vendorRows,
      colWidths: [28, 14, 16, 42, 14, 14],
    },
  ]);
}
