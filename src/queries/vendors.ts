import { prisma } from "@/lib/prisma";

export interface VendorWithStats {
  id: string;
  name: string;
  normalizedName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  defaultCategoryId: string | null;
  defaultCategoryName: string | null;
  invoiceCount: number;
  totalSpent: number;
  lastInvoiceDate: Date | null;
  createdAt: Date;
}

export interface VendorDetail extends VendorWithStats {
  firstInvoiceDate: Date | null;
  categoryBreakdown: { name: string; amount: number }[];
  invoices: {
    id: string;
    invoiceNumber: string | null;
    invoiceDate: Date | null;
    totalAmount: number | null;
    status: string;
    projectName: string;
  }[];
}

export interface DuplicateGroup {
  normalizedName: string;
  vendors: {
    id: string;
    name: string;
    invoiceCount: number;
    totalSpent: number;
    email: string | null;
    phone: string | null;
    notes: string | null;
  }[];
}

/**
 * Get all vendors with invoice stats.
 * If projectId provided, filters to vendors with invoices in that project.
 */
export async function getVendorsWithStats(
  orgId: string,
  projectId?: string | null
): Promise<VendorWithStats[]> {
  const projectFilter = projectId
    ? `AND i.project_id = '${projectId}'::uuid`
    : "";

  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      name: string;
      normalized_name: string | null;
      email: string | null;
      phone: string | null;
      notes: string | null;
      default_category_id: string | null;
      default_category_name: string | null;
      created_at: Date;
      invoice_count: string;
      total_spent: string;
      last_invoice_date: Date | null;
    }[]
  >(
    `SELECT v.id, v.name, v.normalized_name, v.email, v.phone, v.notes,
            v.default_category_id, bc.name as default_category_name,
            v.created_at,
            COUNT(DISTINCT i.id)::text as invoice_count,
            COALESCE(SUM(i.total_amount), 0)::text as total_spent,
            MAX(i.invoice_date) as last_invoice_date
     FROM vendors v
     LEFT JOIN budget_categories bc ON v.default_category_id = bc.id
     LEFT JOIN invoices i ON LOWER(TRIM(i.vendor_name)) = v.normalized_name
       AND i.org_id = v.org_id ${projectFilter}
     WHERE v.org_id = $1::uuid
     GROUP BY v.id, v.name, v.normalized_name, v.email, v.phone, v.notes,
              v.default_category_id, bc.name, v.created_at
     ORDER BY total_spent DESC`,
    orgId
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    normalizedName: r.normalized_name,
    email: r.email,
    phone: r.phone,
    notes: r.notes,
    defaultCategoryId: r.default_category_id,
    defaultCategoryName: r.default_category_name,
    invoiceCount: parseInt(r.invoice_count),
    totalSpent: parseFloat(r.total_spent),
    lastInvoiceDate: r.last_invoice_date,
    createdAt: r.created_at,
  }));
}

/**
 * Get full vendor detail with invoice history and category breakdown.
 */
export async function getVendorDetail(
  orgId: string,
  vendorId: string
): Promise<VendorDetail | null> {
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, orgId },
    include: {
      defaultCategory: { select: { id: true, name: true } },
    },
  });

  if (!vendor) return null;

  // Get invoices matched by normalized name
  const invoices = await prisma.invoice.findMany({
    where: {
      orgId,
      vendorName: { not: null },
    },
    include: {
      project: { select: { name: true } },
    },
    orderBy: { invoiceDate: "desc" },
  });

  // Filter by normalized name match
  const normalizedName = vendor.normalizedName;
  const matchedInvoices = invoices.filter((inv) => {
    if (!inv.vendorName || !normalizedName) return false;
    const invNorm = inv.vendorName
      .toLowerCase()
      .trim()
      .replace(
        /\b(llc|l\.l\.c\.?|inc\.?|incorporated|corp\.?|corporation|co\.?|company|ltd\.?|limited|lp|l\.p\.?|plc|pllc|dba|d\/b\/a)\b/gi,
        ""
      )
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return invNorm === normalizedName;
  });

  const invoiceIds = matchedInvoices.map((i) => i.id);

  // Category breakdown from line items
  let categoryBreakdown: { name: string; amount: number }[] = [];
  if (invoiceIds.length > 0) {
    const lineItems = await prisma.lineItem.findMany({
      where: {
        invoiceId: { in: invoiceIds },
        categoryId: { not: null },
      },
      include: {
        category: { select: { name: true } },
      },
    });

    const catMap = new Map<string, number>();
    for (const li of lineItems) {
      const catName = li.category?.name ?? "(uncategorized)";
      catMap.set(catName, (catMap.get(catName) ?? 0) + Number(li.amount));
    }
    categoryBreakdown = Array.from(catMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }

  const totalSpent = matchedInvoices.reduce(
    (sum, i) => sum + Number(i.totalAmount ?? 0),
    0
  );
  const dates = matchedInvoices
    .map((i) => i.invoiceDate)
    .filter((d): d is Date => d !== null);

  return {
    id: vendor.id,
    name: vendor.name,
    normalizedName: vendor.normalizedName,
    email: vendor.email,
    phone: vendor.phone,
    notes: vendor.notes,
    defaultCategoryId: vendor.defaultCategoryId,
    defaultCategoryName: vendor.defaultCategory?.name ?? null,
    invoiceCount: matchedInvoices.length,
    totalSpent,
    lastInvoiceDate: dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null,
    firstInvoiceDate: dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null,
    createdAt: vendor.createdAt,
    categoryBreakdown,
    invoices: matchedInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      totalAmount: inv.totalAmount ? Number(inv.totalAmount) : null,
      status: inv.status,
      projectName: inv.project.name,
    })),
  };
}

/**
 * Find duplicate vendors (same normalizedName).
 */
export async function getDuplicateVendors(
  orgId: string
): Promise<DuplicateGroup[]> {
  // Find normalized names that have more than one vendor
  const groups = await prisma.vendor.groupBy({
    by: ["normalizedName"],
    where: { orgId, normalizedName: { not: null } },
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
  });

  if (groups.length === 0) return [];

  const normalizedNames = groups.map((g) => g.normalizedName!);

  // Get all vendors in those groups
  const vendors = await prisma.vendor.findMany({
    where: {
      orgId,
      normalizedName: { in: normalizedNames },
    },
    orderBy: { name: "asc" },
  });

  // Get invoice stats for these vendors via raw SQL
  const vendorIds = vendors.map((v) => v.id);
  const stats = await prisma.$queryRawUnsafe<
    { normalized_name: string; vendor_name: string; invoice_count: string; total_spent: string }[]
  >(
    `SELECT v.normalized_name, v.name as vendor_name,
            COUNT(DISTINCT i.id)::text as invoice_count,
            COALESCE(SUM(i.total_amount), 0)::text as total_spent
     FROM vendors v
     LEFT JOIN invoices i ON LOWER(TRIM(i.vendor_name)) = v.normalized_name
       AND i.org_id = v.org_id
     WHERE v.org_id = $1::uuid AND v.id = ANY($2::uuid[])
     GROUP BY v.id, v.normalized_name, v.name`,
    orgId,
    vendorIds
  );

  const statsMap = new Map<string, { invoiceCount: number; totalSpent: number }>();
  for (const s of stats) {
    statsMap.set(s.vendor_name, {
      invoiceCount: parseInt(s.invoice_count),
      totalSpent: parseFloat(s.total_spent),
    });
  }

  // Group by normalizedName
  const result: DuplicateGroup[] = [];
  const groupMap = new Map<string, DuplicateGroup>();

  for (const v of vendors) {
    const nn = v.normalizedName!;
    if (!groupMap.has(nn)) {
      groupMap.set(nn, { normalizedName: nn, vendors: [] });
    }
    const stat = statsMap.get(v.name) ?? { invoiceCount: 0, totalSpent: 0 };
    groupMap.get(nn)!.vendors.push({
      id: v.id,
      name: v.name,
      invoiceCount: stat.invoiceCount,
      totalSpent: stat.totalSpent,
      email: v.email,
      phone: v.phone,
      notes: v.notes,
    });
  }

  // Sort each group: most invoices first
  for (const group of groupMap.values()) {
    group.vendors.sort((a, b) => b.invoiceCount - a.invoiceCount);
    result.push(group);
  }

  return result;
}

// Keep the simple getVendor for backward compatibility
export async function getVendor(orgId: string, vendorId: string) {
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, orgId },
    include: {
      defaultCategory: { select: { id: true, name: true } },
    },
  });

  if (!vendor) return null;

  return {
    id: vendor.id,
    name: vendor.name,
    normalizedName: vendor.normalizedName,
    defaultCategoryId: vendor.defaultCategoryId,
    defaultCategoryName: vendor.defaultCategory?.name ?? null,
    email: vendor.email,
    phone: vendor.phone,
    notes: vendor.notes,
    createdAt: vendor.createdAt,
  };
}
