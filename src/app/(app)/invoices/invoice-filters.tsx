"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ArrowUpDown } from "lucide-react";

interface InvoiceFiltersProps {
  statusCounts: Record<string, number>;
  vendors: string[];
}

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "reviewed", label: "Reviewed" },
  { key: "approved", label: "Approved" },
  { key: "paid", label: "Paid" },
];

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest First" },
  { value: "createdAt-asc", label: "Oldest First" },
  { value: "amount-desc", label: "Amount: High to Low" },
  { value: "amount-asc", label: "Amount: Low to High" },
  { value: "vendor-asc", label: "Vendor: A to Z" },
  { value: "vendor-desc", label: "Vendor: Z to A" },
  { value: "date-desc", label: "Date: Newest" },
  { value: "date-asc", label: "Date: Oldest" },
];

export function InvoiceFilters({ statusCounts, vendors }: InvoiceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "all";
  const currentVendor = searchParams.get("vendor") || "";
  const currentSort = searchParams.get("sort") || "createdAt-desc";
  const currentSearch = searchParams.get("search") || "";

  const [searchValue, setSearchValue] = useState(currentSearch);

  // Sync search value with URL
  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset page when filters change
      if (!("page" in updates)) {
        params.delete("page");
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== currentSearch) {
        updateParams({ search: searchValue });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, currentSearch, updateParams]);

  return (
    <div className="space-y-5">
      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count = statusCounts[tab.key] ?? 0;
          const isActive = currentStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => updateParams({ status: tab.key === "all" ? "" : tab.key })}
              className={`px-4 py-2.5 rounded-xl text-base font-semibold transition-colors min-h-[44px] ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "bg-cream-100 text-charcoal-600 hover:bg-cream-200"
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 px-2 py-0.5 rounded-lg text-sm ${
                  isActive
                    ? "bg-brand-500 text-white"
                    : "bg-cream-200 text-charcoal-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search by vendor or invoice #..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px]"
          />
        </div>

        {/* Vendor Filter */}
        {vendors.length > 0 && (
          <div className="relative min-w-[180px]">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <select
              value={currentVendor}
              onChange={(e) => updateParams({ vendor: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px] appearance-none cursor-pointer"
            >
              <option value="">All Vendors</option>
              {vendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort */}
        <div className="relative min-w-[180px]">
          <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <select
            value={currentSort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px] appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
