"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { bulkUpdateStatus } from "@/actions/invoices";
import { INVOICE_STATUSES } from "@/lib/constants";
import { useCanWrite } from "@/components/layout/role-context";

interface Invoice {
  id: string;
  vendorName: string | null;
  invoiceNumber: string | null;
  invoiceDate: Date | null;
  totalAmount: number | null;
  status: string;
  lineItemCount: number;
}

interface InvoiceTableProps {
  invoices: Invoice[];
}

function formatCurrency(amount: number | null) {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  const router = useRouter();
  const userCanWrite = useCanWrite();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const allSelected =
    invoices.length > 0 && selected.size === invoices.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(invoices.map((inv) => inv.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleBulkUpdate() {
    if (!bulkStatus || selected.size === 0) return;
    setIsBulkUpdating(true);
    const result = await bulkUpdateStatus(Array.from(selected), bulkStatus);
    setIsBulkUpdating(false);
    if (result.success) {
      setSelected(new Set());
      setBulkStatus("");
      router.refresh();
    }
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-cream-50 rounded-2xl border-2 border-dashed border-brand-200 p-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-brand-600" />
          </div>
          <p className="text-2xl font-semibold text-charcoal-900 mb-2">
            No invoices found
          </p>
          <p className="text-lg text-charcoal-600">
            Try adjusting your filters or upload a new invoice
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Bulk Action Bar — only for users with write access */}
      {userCanWrite && selected.size > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 mb-4 flex items-center gap-4 flex-wrap">
          <span className="text-base font-semibold text-brand-700">
            {selected.size} selected
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-charcoal-900 text-base min-h-[44px] appearance-none cursor-pointer"
          >
            <option value="">Mark as...</option>
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkUpdate}
            disabled={!bulkStatus || isBulkUpdating}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 min-h-[44px] text-base"
          >
            {isBulkUpdating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Apply"
            )}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="px-4 py-2.5 text-charcoal-600 hover:bg-cream-200 rounded-xl transition-colors min-h-[44px] text-base"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-charcoal-200 bg-cream-50">
                {userCanWrite && (
                  <th className="py-3 px-4 w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="w-5 h-5 rounded border-charcoal-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                  </th>
                )}
                <th className="py-3 px-4 text-left text-sm font-semibold text-charcoal-600 uppercase tracking-wide">
                  Vendor
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-charcoal-600 uppercase tracking-wide">
                  Invoice #
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-charcoal-600 uppercase tracking-wide">
                  Date
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-charcoal-600 uppercase tracking-wide">
                  Amount
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-charcoal-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="py-3 px-4 text-center text-sm font-semibold text-charcoal-600 uppercase tracking-wide">
                  Items
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-charcoal-100 hover:bg-cream-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/invoices/${invoice.id}`)}
                >
                  {userCanWrite && (
                  <td
                    className="py-4 px-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(invoice.id)}
                      onChange={() => toggleOne(invoice.id)}
                      className="w-5 h-5 rounded border-charcoal-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                  </td>
                  )}
                  <td className="py-4 px-4">
                    <p className="text-lg font-semibold text-charcoal-900">
                      {invoice.vendorName || "—"}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-base text-charcoal-700">
                      {invoice.invoiceNumber || "—"}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-base text-charcoal-700">
                      {formatDate(invoice.invoiceDate)}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <p className="text-lg font-semibold text-charcoal-900 tabular-nums">
                      {formatCurrency(invoice.totalAmount)}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={invoice.status} size="sm" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-base font-medium text-charcoal-600">
                      {invoice.lineItemCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
