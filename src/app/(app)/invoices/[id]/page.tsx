import { getCurrentUser } from "@/lib/auth";
import { getInvoice } from "@/queries/invoices";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { InvoiceDetailClient } from "./invoice-detail-client";
import { LineItemsManager } from "./line-items-manager";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await getCurrentUser();
  const invoice = await getInvoice(orgId, id);

  if (!invoice) notFound();

  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate line items total
  const lineItemsTotal = invoice.lineItems
    .filter((li) => !li.isTax)
    .reduce((sum, li) => sum + li.amount, 0);

  return (
    <div className="w-full">
      {/* Back Link */}
      <Link
        href="/invoices"
        className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-charcoal-100 text-charcoal-900 hover:bg-charcoal-200 transition-colors mb-8 text-lg font-semibold h-11"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Invoices
      </Link>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-charcoal-100 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-charcoal-900">
                  {invoice.vendorName || "—"}
                </h1>
                <div className="mt-3 space-y-1">
                  <p className="text-lg text-charcoal-600">
                    <span className="font-semibold">Invoice #:</span>{" "}
                    {invoice.invoiceNumber || "—"}
                  </p>
                  <p className="text-lg text-charcoal-600">
                    <span className="font-semibold">Date:</span>{" "}
                    {formatDate(invoice.invoiceDate)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-charcoal-500 font-semibold mb-1">
                  Total
                </p>
                <p className="text-3xl font-bold text-charcoal-900">
                  {formatCurrency(invoice.totalAmount)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge status={invoice.status} />
              <InvoiceDetailClient
                invoiceId={invoice.id}
                currentStatus={invoice.status}
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="bg-white rounded-2xl border border-charcoal-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-charcoal-900">
                Line Items
              </h2>
              <InvoiceDetailClient
                invoiceId={invoice.id}
                showAutoCategorize={true}
              />
            </div>

            <LineItemsManager
              invoiceId={invoice.id}
              lineItems={invoice.lineItems}
              budgetCategories={invoice.budgetCategories}
              taxAmount={invoice.taxAmount}
              totalAmount={invoice.totalAmount}
            />
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* PDF Card */}
          {invoice.pdfOriginalFilename && (
            <div className="bg-white rounded-2xl border border-charcoal-100 p-6">
              <h3 className="text-lg font-bold text-charcoal-900 mb-4">
                PDF File
              </h3>
              <div className="flex items-center gap-3 bg-cream-50 rounded-xl p-3 border border-charcoal-100">
                <FileText className="w-5 h-5 text-brand-600 flex-shrink-0" />
                <span className="text-base text-charcoal-900 font-medium truncate flex-1">
                  {invoice.pdfOriginalFilename}
                </span>
                <button className="text-brand-600 hover:text-brand-700 transition-colors flex-shrink-0">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Notes Card */}
          <div className="bg-white rounded-2xl border border-charcoal-100 p-6">
            <h3 className="text-lg font-bold text-charcoal-900 mb-4">Notes</h3>
            <InvoiceDetailClient
              invoiceId={invoice.id}
              currentNotes={invoice.notes}
              showNotesEditor={true}
            />
          </div>

          {/* Actions Card */}
          <div className="bg-white rounded-2xl border border-charcoal-100 p-6">
            <h3 className="text-lg font-bold text-charcoal-900 mb-4">
              Actions
            </h3>
            <InvoiceDetailClient
              invoiceId={invoice.id}
              showDeleteButton={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
