import { getCurrentUser } from "@/lib/auth";
import { getDuplicateVendors } from "@/queries/vendors";
import { GitMerge } from "lucide-react";
import { MergeDuplicatesClient } from "./merge-client";

export default async function MergeDuplicatesPage() {
  const { orgId } = await getCurrentUser();
  const groups = await getDuplicateVendors(orgId);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-warning-100 flex items-center justify-center flex-shrink-0">
          <GitMerge className="w-8 h-8 text-warning-600" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900">
            Merge Duplicate Vendors
          </h1>
          <p className="text-xl text-charcoal-600 mt-1">
            {groups.length === 0
              ? "No duplicates found"
              : `${groups.length} group${groups.length > 1 ? "s" : ""} of potential duplicates`}
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="bg-cream-50 rounded-2xl border-2 border-dashed border-brand-200 p-12 text-center">
          <GitMerge className="w-12 h-12 text-brand-400 mx-auto mb-4" />
          <p className="text-2xl font-semibold text-charcoal-900 mb-2">
            All clean!
          </p>
          <p className="text-lg text-charcoal-600">
            No duplicate vendors were detected.
          </p>
        </div>
      ) : (
        <MergeDuplicatesClient groups={groups} />
      )}
    </div>
  );
}
