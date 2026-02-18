"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  AlertTriangle,
  Users,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { createVendor } from "@/actions/vendors";
import { useCanWrite } from "@/components/layout/role-context";
import type { VendorWithStats } from "@/queries/vendors";

interface VendorListClientProps {
  vendors: VendorWithStats[];
  duplicateCount: number;
  projects: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  currentProjectId: string | null;
}

function formatCurrency(amount: number) {
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

type SortKey = "name" | "totalSpent" | "invoiceCount" | "lastInvoiceDate";

export function VendorListClient({
  vendors,
  duplicateCount,
  categories,
  currentProjectId,
}: VendorListClientProps) {
  const router = useRouter();
  const userCanWrite = useCanWrite();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("totalSpent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Filter
  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "totalSpent":
        cmp = a.totalSpent - b.totalSpent;
        break;
      case "invoiceCount":
        cmp = a.invoiceCount - b.invoiceCount;
        break;
      case "lastInvoiceDate":
        cmp =
          (a.lastInvoiceDate?.getTime() ?? 0) -
          (b.lastInvoiceDate?.getTime() ?? 0);
        break;
    }
    return sortDir === "desc" ? -cmp : cmp;
  });

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const totalSpent = filtered.reduce((s, v) => s + v.totalSpent, 0);

  function SortArrow({ col }: { col: SortKey }) {
    if (sortBy !== col) return null;
    return (
      <span className="ml-1 text-brand-400">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  return (
    <div>
      {/* Duplicate Warning */}
      {userCanWrite && duplicateCount > 0 && (
        <Link
          href="/vendors/merge"
          className="flex items-center gap-3 bg-warning-100 border border-warning-200 rounded-2xl p-4 mb-6 hover:bg-warning-50 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0" />
          <p className="text-base text-warning-700 font-semibold">
            {duplicateCount} potential duplicate vendor
            {duplicateCount > 1 ? " groups" : " group"} found.
          </p>
          <span className="text-base text-brand-600 font-semibold ml-auto">
            Review Duplicates →
          </span>
        </Link>
      )}

      {/* Controls */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px]"
          />
        </div>
        {userCanWrite && (
          <button
            onClick={() => setShowAddDialog(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-base min-h-[44px]"
          >
            <Plus className="w-5 h-5" />
            Add Vendor
          </button>
        )}
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="bg-cream-50 rounded-2xl border-2 border-dashed border-brand-200 p-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-brand-600" />
            </div>
            <p className="text-2xl font-semibold text-charcoal-900 mb-2">
              {search ? "No vendors match your search" : "No vendors yet"}
            </p>
            <p className="text-lg text-charcoal-600">
              {search
                ? "Try a different search term"
                : "Vendors are created automatically when you upload invoices"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-charcoal-200 bg-cream-50">
                  <th
                    className="py-3 px-4 text-left text-sm font-semibold text-charcoal-600 uppercase tracking-wide cursor-pointer hover:text-charcoal-900"
                    onClick={() => handleSort("name")}
                  >
                    Vendor
                    <SortArrow col="name" />
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-charcoal-600 uppercase tracking-wide">
                    Default Category
                  </th>
                  <th
                    className="py-3 px-4 text-center text-sm font-semibold text-charcoal-600 uppercase tracking-wide cursor-pointer hover:text-charcoal-900"
                    onClick={() => handleSort("invoiceCount")}
                  >
                    Invoices
                    <SortArrow col="invoiceCount" />
                  </th>
                  <th
                    className="py-3 px-4 text-right text-sm font-semibold text-charcoal-600 uppercase tracking-wide cursor-pointer hover:text-charcoal-900"
                    onClick={() => handleSort("totalSpent")}
                  >
                    Total Spent
                    <SortArrow col="totalSpent" />
                  </th>
                  <th
                    className="py-3 px-4 text-left text-sm font-semibold text-charcoal-600 uppercase tracking-wide cursor-pointer hover:text-charcoal-900"
                    onClick={() => handleSort("lastInvoiceDate")}
                  >
                    Last Invoice
                    <SortArrow col="lastInvoiceDate" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((vendor) => (
                  <tr
                    key={vendor.id}
                    onClick={() => router.push(`/vendors/${vendor.id}`)}
                    className="border-b border-charcoal-100 hover:bg-cream-50 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4">
                      <p className="text-lg font-semibold text-charcoal-900">
                        {vendor.name}
                      </p>
                      {vendor.email && (
                        <p className="text-sm text-charcoal-500">
                          {vendor.email}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {vendor.defaultCategoryName ? (
                        <span className="px-3 py-1 rounded-lg bg-brand-100 text-brand-700 font-semibold text-sm">
                          {vendor.defaultCategoryName}
                        </span>
                      ) : (
                        <span className="text-sm text-charcoal-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-base font-medium text-charcoal-700">
                        {vendor.invoiceCount}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-lg font-semibold text-charcoal-900 tabular-nums">
                        {formatCurrency(vendor.totalSpent)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-base text-charcoal-600">
                        {formatDate(vendor.lastInvoiceDate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-charcoal-200 bg-cream-50 px-4 py-3">
            <p className="text-base text-charcoal-600">
              <span className="font-semibold text-charcoal-900">
                {sorted.length}
              </span>{" "}
              vendor{sorted.length !== 1 ? "s" : ""} •{" "}
              <span className="font-semibold text-charcoal-900">
                {formatCurrency(totalSpent)}
              </span>{" "}
              total
            </p>
          </div>
        </div>
      )}

      {/* Add Vendor Dialog */}
      {showAddDialog && (
        <AddVendorDialog
          categories={categories}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </div>
  );
}

// ── Add Vendor Dialog ─────────────────────────────────────

function AddVendorDialog({
  categories,
  onClose,
}: {
  categories: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const result = await createVendor(fd);

    if (result.errors) {
      setError(result.errors.general);
      setIsSubmitting(false);
    } else {
      router.refresh();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-charcoal-100 shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-charcoal-900 mb-4">
          Add Vendor
        </h3>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-danger-50 text-danger-700 border border-danger-200 font-semibold text-base">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-base font-semibold text-charcoal-700 mb-1">
              Name *
            </label>
            <input
              name="name"
              type="text"
              required
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-charcoal-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              className="w-full px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-charcoal-700 mb-1">
              Phone
            </label>
            <input
              name="phone"
              type="tel"
              className="w-full px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-charcoal-700 mb-1">
              Default Category
            </label>
            <select
              name="defaultCategoryId"
              className="w-full px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px] appearance-none cursor-pointer"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-5 py-3 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-lg min-h-[44px] disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              Add Vendor
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 bg-charcoal-100 text-charcoal-900 rounded-2xl font-semibold hover:bg-charcoal-200 transition-colors text-lg min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
