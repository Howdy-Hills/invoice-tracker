"use client";

import { useState, useRef, useEffect } from "react";
import {
  Download,
  ChevronDown,
  BarChart3,
  FileText,
  Building2,
} from "lucide-react";

interface ExportButtonsProps {
  projectId: string;
}

const EXPORT_OPTIONS = [
  {
    type: "budget",
    label: "Budget vs. Actual",
    description: "Budget breakdown by category",
    icon: BarChart3,
    hasFilters: false,
  },
  {
    type: "invoices",
    label: "Invoice Detail",
    description: "All invoices with line items",
    icon: FileText,
    hasFilters: true,
  },
  {
    type: "vendors",
    label: "Vendor Summary",
    description: "Spending per vendor",
    icon: Building2,
    hasFilters: false,
  },
];

export function ExportButtons({ projectId }: ExportButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleExport(type: string) {
    if (type === "invoices") {
      setIsOpen(false);
      setShowInvoiceDialog(true);
      return;
    }

    const url = `/api/exports?type=${type}&projectId=${projectId}`;
    triggerDownload(url);
    setIsOpen(false);
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-charcoal-100 text-charcoal-900 rounded-2xl font-semibold hover:bg-charcoal-200 transition-colors text-base min-h-[44px]"
        >
          <Download className="w-5 h-5" />
          Export
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-charcoal-100 shadow-lg z-50 overflow-hidden">
            {EXPORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.type}
                  onClick={() => handleExport(opt.type)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-cream-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4.5 h-4.5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-charcoal-900">
                      {opt.label}
                    </p>
                    <p className="text-sm text-charcoal-500">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showInvoiceDialog && (
        <InvoiceExportDialog
          projectId={projectId}
          onClose={() => setShowInvoiceDialog(false)}
        />
      )}
    </>
  );
}

// ── Invoice Export Dialog ──────────────────────────────────

function InvoiceExportDialog({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");

  function handleDownload() {
    const params = new URLSearchParams({
      type: "invoices",
      projectId,
    });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (status) params.set("status", status);

    triggerDownload(`/api/exports?${params.toString()}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-charcoal-100 shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-charcoal-900 mb-4">
          Export Invoice Detail
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-base font-semibold text-charcoal-700 mb-1">
              Date Range (optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px]"
                placeholder="From"
              />
              <span className="text-charcoal-400">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px]"
                placeholder="To"
              />
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-charcoal-700 mb-1">
              Status Filter (optional)
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px] appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleDownload}
            className="flex-1 px-5 py-3 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-lg min-h-[44px] inline-flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 bg-charcoal-100 text-charcoal-900 rounded-2xl font-semibold hover:bg-charcoal-200 transition-colors text-lg min-h-[44px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Download Helper ───────────────────────────────────────

function triggerDownload(url: string) {
  // Use fetch + blob for cross-browser reliability (especially mobile Safari)
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
    })
    .catch((err) => {
      console.error("Download failed:", err);
      alert("Export failed. Please try again.");
    });
}
