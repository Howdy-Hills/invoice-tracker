import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import type { DashboardData } from "@/queries/dashboard";

interface RecentInvoicesProps {
  invoices: DashboardData["recentInvoices"];
}

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
        <h3 className="text-xl font-bold text-charcoal-900 mb-4">
          Recent Invoices
        </h3>
        <p className="text-base text-charcoal-400 mb-4">No invoices yet.</p>
        <Link
          href="/invoices/upload"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors text-base"
        >
          Upload your first invoice
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
      <h3 className="text-xl font-bold text-charcoal-900 mb-4">
        Recent Invoices
      </h3>
      <div className="space-y-3">
        {invoices.map((inv) => (
          <Link
            key={inv.id}
            href={`/invoices/${inv.id}`}
            className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-cream-50 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-charcoal-900">
                {inv.vendorName || "Unknown Vendor"}
              </p>
              <p className="text-sm text-charcoal-500">
                {formatDate(inv.invoiceDate || inv.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-base font-bold text-charcoal-900 tabular-nums">
                {inv.totalAmount !== null
                  ? formatCurrency(inv.totalAmount)
                  : "—"}
              </p>
              <StatusBadge status={inv.status} size="sm" />
            </div>
          </Link>
        ))}
      </div>
      <Link
        href="/invoices"
        className="block mt-4 text-center text-base font-medium text-brand-600 hover:text-brand-700"
      >
        View all invoices
      </Link>
    </div>
  );
}
