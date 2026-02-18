"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitMerge, Loader2, Check, Mail, Phone, FileText } from "lucide-react";
import { mergeVendors } from "@/actions/vendors";
import type { DuplicateGroup } from "@/queries/vendors";

interface MergeDuplicatesClientProps {
  groups: DuplicateGroup[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function MergeDuplicatesClient({
  groups,
}: MergeDuplicatesClientProps) {
  const router = useRouter();

  // Track selected "keep" vendor per group (default: first, which has most invoices)
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const g of groups) {
      init[g.normalizedName] = g.vendors[0].id;
    }
    return init;
  });

  const [merging, setMerging] = useState<string | null>(null);
  const [mergedGroups, setMergedGroups] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleMerge(group: DuplicateGroup) {
    const keepId = selections[group.normalizedName];
    const mergeIds = group.vendors
      .filter((v) => v.id !== keepId)
      .map((v) => v.id);

    setMerging(group.normalizedName);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[group.normalizedName];
      return next;
    });

    const result = await mergeVendors(keepId, mergeIds);

    if (result.errors) {
      setErrors((prev) => ({
        ...prev,
        [group.normalizedName]: result.errors!.general,
      }));
    } else {
      setMergedGroups((prev) => new Set([...prev, group.normalizedName]));
      router.refresh();
    }
    setMerging(null);
  }

  return (
    <div className="space-y-6">
      <div className="bg-cream-50 rounded-xl border border-charcoal-200 p-4 mb-2">
        <p className="text-base text-charcoal-700">
          For each group, select the vendor name you want to <strong>keep</strong>.
          All invoices from the other vendors will be reassigned to the kept
          vendor, and the duplicates will be removed.
        </p>
      </div>

      {groups.map((group) => {
        const isMerged = mergedGroups.has(group.normalizedName);
        const isMerging = merging === group.normalizedName;
        const error = errors[group.normalizedName];

        return (
          <div
            key={group.normalizedName}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
              isMerged
                ? "border-success-200"
                : "border-charcoal-100"
            }`}
          >
            {/* Group Header */}
            <div
              className={`px-6 py-4 border-b ${
                isMerged
                  ? "bg-success-50 border-success-200"
                  : "bg-cream-50 border-charcoal-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-charcoal-900">
                    {isMerged && (
                      <Check className="w-5 h-5 text-success-600 inline mr-2" />
                    )}
                    &ldquo;{group.vendors[0].name}&rdquo;
                    {group.vendors.length > 2
                      ? ` + ${group.vendors.length - 1} variants`
                      : ` + 1 variant`}
                  </h3>
                  <p className="text-sm text-charcoal-500 mt-1">
                    {group.vendors.length} vendor records with similar names
                  </p>
                </div>
                {isMerged ? (
                  <span className="px-4 py-2 rounded-xl bg-success-100 text-success-700 font-semibold text-base">
                    Merged
                  </span>
                ) : (
                  <button
                    onClick={() => handleMerge(group)}
                    disabled={isMerging}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-warning-600 text-white rounded-2xl font-semibold hover:bg-warning-700 transition-colors text-base min-h-[44px] disabled:opacity-50"
                  >
                    {isMerging ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <GitMerge className="w-5 h-5" />
                    )}
                    Merge Group
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-danger-50 text-danger-700 border border-danger-200 font-semibold text-base">
                {error}
              </div>
            )}

            {/* Vendor Options */}
            {!isMerged && (
              <div className="p-6 space-y-3">
                {group.vendors.map((v) => {
                  const isSelected =
                    selections[group.normalizedName] === v.id;
                  return (
                    <label
                      key={v.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-brand-400 bg-brand-50"
                          : "border-charcoal-200 hover:border-charcoal-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`keep-${group.normalizedName}`}
                        checked={isSelected}
                        onChange={() =>
                          setSelections((prev) => ({
                            ...prev,
                            [group.normalizedName]: v.id,
                          }))
                        }
                        className="mt-1 w-5 h-5 text-brand-600 accent-brand-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-lg font-semibold text-charcoal-900">
                            {v.name}
                          </span>
                          {isSelected && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-brand-100 text-brand-700 text-sm font-semibold">
                              Keep
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-charcoal-600">
                          <span className="inline-flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {v.invoiceCount} invoice
                            {v.invoiceCount !== 1 ? "s" : ""}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatCurrency(v.totalSpent)}
                          </span>
                          {v.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {v.email}
                            </span>
                          )}
                          {v.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {v.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
