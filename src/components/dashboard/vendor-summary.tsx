import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { DashboardData } from "@/queries/dashboard";

interface VendorSummaryProps {
  vendors: DashboardData["vendors"];
}

export function VendorSummary({ vendors }: VendorSummaryProps) {
  if (vendors.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
        <h3 className="text-xl font-bold text-charcoal-900 mb-4">
          Top Vendors
        </h3>
        <p className="text-base text-charcoal-400">No vendor data yet</p>
      </div>
    );
  }

  const topVendors = vendors.slice(0, 10);

  return (
    <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
      <h3 className="text-xl font-bold text-charcoal-900 mb-4">
        Top Vendors
      </h3>
      <div className="space-y-4">
        {topVendors.map((vendor, i) => (
          <div
            key={vendor.vendorName}
            className="flex items-center justify-between py-2 border-b border-charcoal-50 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {i + 1}
              </span>
              <div>
                <p className="text-base font-semibold text-charcoal-900">
                  {vendor.vendorName}
                </p>
                <p className="text-sm text-charcoal-500">
                  {vendor.invoiceCount} invoice
                  {vendor.invoiceCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <p className="text-base font-bold text-charcoal-900 tabular-nums">
              {formatCurrency(vendor.totalSpent)}
            </p>
          </div>
        ))}
      </div>
      {vendors.length > 10 && (
        <Link
          href="/vendors"
          className="block mt-4 text-center text-base font-medium text-brand-600 hover:text-brand-700"
        >
          View all vendors
        </Link>
      )}
    </div>
  );
}
