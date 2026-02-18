"use client";

import { useState } from "react";
import {
  Download,
  BarChart3,
  FileText,
  Building2,
  Loader2,
} from "lucide-react";

interface ExportsPageClientProps {
  projectId: string;
}

function triggerDownload(url: string, setLoading: (v: string | null) => void, type: string) {
  setLoading(type);
  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("Download failed");
      const disposition = res.headers.get("Content-Disposition");
      let filename = "export.xlsx";
      if (disposition) {
        const match = disposition.match(/filename="?([^";\n]+)"?/);
        if (match) filename = match[1];
      }
      return res.blob().then((blob) => ({ blob, filename }));
    })
    .then(({ blob, filename }) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 100);
      setLoading(null);
    })
    .catch((err) => {
      console.error("Download failed:", err);
      alert("Export failed. Please try again.");
      setLoading(null);
    });
}

export function ExportsPageClient({ projectId }: ExportsPageClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");

  function downloadBudget() {
    triggerDownload(
      `/api/exports?type=budget&projectId=${projectId}`,
      setLoading,
      "budget"
    );
  }

  function downloadInvoices() {
    const params = new URLSearchParams({
      type: "invoices",
      projectId,
    });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (status) params.set("status", status);
    triggerDownload(`/api/exports?${params.toString()}`, setLoading, "invoices");
  }

  function downloadVendors() {
    triggerDownload(
      `/api/exports?type=vendors&projectId=${projectId}`,
      setLoading,
      "vendors"
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget vs. Actual */}
      <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-charcoal-900">
                Budget vs. Actual
              </h3>
              <p className="text-base text-charcoal-600 mt-1">
                Complete budget breakdown with budgeted, spent, and remaining
                amounts per category. Includes percentage used and over-budget
                warnings.
              </p>
            </div>
          </div>
          <button
            onClick={downloadBudget}
            disabled={loading === "budget"}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-base min-h-[44px] min-w-[170px] disabled:opacity-50 flex-shrink-0"
          >
            {loading === "budget" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            Download .xlsx
          </button>
        </div>
      </div>

      {/* Invoice Detail */}
      <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-charcoal-900">
              Invoice Detail
            </h3>
            <p className="text-base text-charcoal-600 mt-1">
              All invoices with line items, categories, and status. Two sheets:
              Invoice Summary and Line Item Detail.
            </p>
          </div>
        </div>

        <div className="bg-cream-50 rounded-xl p-4 mb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-semibold text-charcoal-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal-600 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px] appearance-none cursor-pointer min-w-[140px]"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <button
              onClick={downloadInvoices}
              disabled={loading === "invoices"}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-base min-h-[44px] min-w-[170px] disabled:opacity-50"
            >
              {loading === "invoices" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              Download .xlsx
            </button>
          </div>
        </div>
      </div>

      {/* Vendor Summary */}
      <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-charcoal-900">
                Vendor Summary
              </h3>
              <p className="text-base text-charcoal-600 mt-1">
                Total spending per vendor with invoice count, categories used,
                and first/last invoice dates. Sorted by highest spend.
              </p>
            </div>
          </div>
          <button
            onClick={downloadVendors}
            disabled={loading === "vendors"}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-base min-h-[44px] min-w-[170px] disabled:opacity-50 flex-shrink-0"
          >
            {loading === "vendors" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            Download .xlsx
          </button>
        </div>
      </div>
    </div>
  );
}
