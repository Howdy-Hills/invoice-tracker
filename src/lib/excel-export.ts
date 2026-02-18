import { prisma } from "@/lib/prisma";

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

// Generate xlsx via Python openpyxl (available in the environment)
async function generateXlsx(data: {
  sheets: Array<{
    name: string;
    titleRows?: string[][];
    headers: string[];
    rows: (string | number | null)[][];
    currencyCols?: number[];
    percentCols?: number[];
    colWidths?: number[];
  }>;
}): Promise<Buffer> {
  const { execFile } = await import("child_process");
  const { writeFile, readFile, unlink } = await import("fs/promises");
  const path = await import("path");
  const crypto = await import("crypto");

  const tmpId = crypto.randomBytes(8).toString("hex");
  const jsonPath = `/tmp/export-${tmpId}.json`;
  const outPath = `/tmp/export-${tmpId}.xlsx`;

  await writeFile(jsonPath, JSON.stringify(data));

  return new Promise((resolve, reject) => {
    execFile(
      "python3",
      [
        "-c",
        `
import json, sys
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side, numbers
from openpyxl.utils import get_column_letter

with open("${jsonPath}") as f:
    data = json.load(f)

wb = Workbook()
wb.remove(wb.active)

header_font = Font(name="Arial", bold=True, size=11, color="FFFFFF")
header_fill = PatternFill("solid", fgColor="4A6741")
header_align = Alignment(horizontal="center", vertical="center")
title_font = Font(name="Arial", bold=True, size=14, color="2D3A2D")
subtitle_font = Font(name="Arial", size=11, color="666666")
data_font = Font(name="Arial", size=11)
total_font = Font(name="Arial", bold=True, size=11)
total_fill = PatternFill("solid", fgColor="F5F0E8")
thin_border = Border(
    bottom=Side(style="thin", color="D4D4D4")
)
currency_fmt = '$#,##0.00'
percent_fmt = '0.0%'

for si, sheet_data in enumerate(data["sheets"]):
    ws = wb.create_sheet(title=sheet_data["name"])
    row_offset = 0

    # Title rows
    for tr in sheet_data.get("titleRows", []):
        row_offset += 1
        for ci, val in enumerate(tr):
            cell = ws.cell(row=row_offset, column=ci + 1, value=val)
            if row_offset == 1:
                cell.font = title_font
            else:
                cell.font = subtitle_font

    if row_offset > 0:
        row_offset += 1  # blank row

    # Headers
    row_offset += 1
    header_row = row_offset
    for ci, h in enumerate(sheet_data["headers"]):
        cell = ws.cell(row=header_row, column=ci + 1, value=h)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_align

    # Data rows
    currency_cols = set(sheet_data.get("currencyCols", []))
    percent_cols = set(sheet_data.get("percentCols", []))
    rows = sheet_data["rows"]

    for ri, row in enumerate(rows):
        r = header_row + 1 + ri
        is_total = ri == len(rows) - 1 and rows and rows[-1] and str(rows[-1][0]).startswith("TOTAL")
        is_uncat = ri == len(rows) - 1 and rows and rows[-1] and str(rows[-1][0]).startswith("UNCAT")
        if not is_total and ri == len(rows) - 2 and len(rows) > 1 and rows[-1] and str(rows[-1][0]).startswith("UNCAT"):
            is_total = str(rows[-2][0]).startswith("TOTAL")

        for ci, val in enumerate(row):
            cell = ws.cell(row=r, column=ci + 1, value=val)
            cell.font = total_font if is_total or is_uncat else data_font
            cell.border = thin_border
            if is_total or is_uncat:
                cell.fill = total_fill
            if ci in currency_cols and isinstance(val, (int, float)):
                cell.number_format = currency_fmt
            if ci in percent_cols and isinstance(val, (int, float)):
                cell.number_format = percent_fmt
            if ci > 0 and isinstance(val, (int, float)):
                cell.alignment = Alignment(horizontal="right")

    # Column widths
    for ci, w in enumerate(sheet_data.get("colWidths", [])):
        ws.column_dimensions[get_column_letter(ci + 1)].width = w

    # Freeze pane below headers
    ws.freeze_panes = ws.cell(row=header_row + 1, column=1)

    # Auto-filter on header row
    if rows:
        last_col = get_column_letter(len(sheet_data["headers"]))
        ws.auto_filter.ref = f"A{header_row}:{last_col}{header_row + len(rows)}"

wb.save("${outPath}")
`,
      ],
      { timeout: 30000 },
      async (err) => {
        try {
          await unlink(jsonPath).catch(() => {});
          if (err) {
            reject(new Error(`Excel generation failed: ${err.message}`));
            return;
          }
          const buffer = await readFile(outPath);
          await unlink(outPath).catch(() => {});
          resolve(buffer);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
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
    const percentUsed = budgeted > 0 ? spent / budgeted : 0;
    const status =
      percentUsed > 1
        ? "OVER BUDGET"
        : percentUsed > 0.9
        ? "WARNING"
        : "OK";

    rows.push([cat.name, budgeted, spent, remaining, percentUsed, status]);
    totalBudgeted += budgeted;
    totalSpent += spent;
  }

  // Total row
  rows.push([
    "TOTAL",
    totalBudgeted,
    totalSpent,
    totalBudgeted - totalSpent,
    totalBudgeted > 0 ? totalSpent / totalBudgeted : 0,
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
      0,
      "NEEDS REVIEW",
    ]);
  }

  return generateXlsx({
    sheets: [
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
        currencyCols: [1, 2, 3],
        percentCols: [4],
        colWidths: [28, 16, 16, 16, 12, 16],
      },
    ],
  });
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

  return generateXlsx({
    sheets: [
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
        currencyCols: [3, 4],
        colWidths: [28, 16, 14, 16, 14, 14, 12, 14],
      },
      {
        name: "Line Items",
        titleRows: [],
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
        currencyCols: [5, 6],
        colWidths: [28, 16, 14, 38, 8, 14, 14, 22, 10],
      },
    ],
  });
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
    .map(([vendor, data]) => [
      vendor,
      data.invoiceCount,
      data.totalSpent,
      Array.from(data.categories).sort().join(", "),
      formatDateStr(data.firstDate),
      formatDateStr(data.lastDate),
    ] as (string | number | null)[]);

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

  return generateXlsx({
    sheets: [
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
        currencyCols: [2],
        colWidths: [28, 14, 16, 42, 14, 14],
      },
    ],
  });
}
