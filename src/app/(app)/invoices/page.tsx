import Link from "next/link";
import { FileText, Upload, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { canWrite } from "@/lib/roles";
import { getSelectedProjectId } from "@/lib/project-context";
import {
  getFilteredInvoices,
  getStatusCounts,
  getProjectVendors,
} from "@/queries/invoices";
import { InvoiceFilters } from "./invoice-filters";
import { InvoiceTable } from "./invoice-table";
import { InvoicePagination } from "./invoice-pagination";
import { ExportButtons } from "@/components/exports/export-buttons";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  const selectedProjectId = await getSelectedProjectId();
  const params = await searchParams;

  if (!selectedProjectId) {
    return (
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-8 h-8 text-brand-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-charcoal-900">Invoices</h1>
            <p className="text-xl text-charcoal-600 mt-1">
              Upload and track invoices
            </p>
          </div>
        </div>

        <div className="bg-cream-50 rounded-2xl border-2 border-warning-200 p-8">
          <div className="text-center">
            <p className="text-xl text-charcoal-700 font-semibold mb-2">
              Please select a project first
            </p>
            <p className="text-lg text-charcoal-600">
              Choose a project from the sidebar to view and manage invoices.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Parse filter params
  const sortParts = (params.sort || "createdAt-desc").split("-");
  const sortDir = sortParts.pop() as "asc" | "desc";
  const sortBy = sortParts.join("-");

  const filters = {
    status: params.status || undefined,
    vendor: params.vendor || undefined,
    search: params.search || undefined,
    sortBy,
    sortDir,
    page: params.page ? parseInt(params.page) : 1,
    perPage: 20,
  };

  const [result, statusCounts, vendors] = await Promise.all([
    getFilteredInvoices(user.orgId, selectedProjectId, filters),
    getStatusCounts(user.orgId, selectedProjectId),
    getProjectVendors(user.orgId, selectedProjectId),
  ]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
          <FileText className="w-8 h-8 text-brand-600" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900">Invoices</h1>
          <p className="text-xl text-charcoal-600 mt-1">
            Upload and track invoices
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8 flex-wrap">
        {canWrite(user.role) && (
          <>
            <Link
              href="/invoices/upload"
              className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors h-11 min-w-44 text-lg"
            >
              <Upload className="w-6 h-6" />
              Upload PDF
            </Link>
            <Link
              href="/invoices/new"
              className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-charcoal-100 text-charcoal-900 rounded-2xl font-semibold hover:bg-charcoal-200 transition-colors h-11 min-w-44 text-lg"
            >
              <Plus className="w-6 h-6" />
              Manual Entry
            </Link>
          </>
        )}
        <ExportButtons projectId={selectedProjectId} />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <InvoiceFilters statusCounts={statusCounts} vendors={vendors} />
      </div>

      {/* Table */}
      <InvoiceTable invoices={result.invoices} />

      {/* Pagination */}
      <InvoicePagination
        page={result.page}
        totalPages={result.totalPages}
        totalCount={result.totalCount}
        perPage={result.perPage}
      />
    </div>
  );
}
