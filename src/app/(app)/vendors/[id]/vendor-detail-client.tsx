"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Trash2,
  Loader2,
  Mail,
  Phone,
  FileText,
  ArrowLeft,
  DollarSign,
  Calendar,
} from "lucide-react";
import { updateVendor, deleteVendor } from "@/actions/vendors";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCanWrite } from "@/components/layout/role-context";
import type { VendorDetail } from "@/queries/vendors";

interface VendorDetailClientProps {
  vendor: VendorDetail;
  categories: { id: string; name: string }[];
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

export function VendorDetailClient({
  vendor,
  categories,
}: VendorDetailClientProps) {
  const router = useRouter();
  const userCanWrite = useCanWrite();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(vendor.name);
  const [email, setEmail] = useState(vendor.email ?? "");
  const [phone, setPhone] = useState(vendor.phone ?? "");
  const [notes, setNotes] = useState(vendor.notes ?? "");
  const [defaultCategoryId, setDefaultCategoryId] = useState(
    vendor.defaultCategoryId ?? ""
  );

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const fd = new FormData();
    fd.set("name", name);
    fd.set("email", email);
    fd.set("phone", phone);
    fd.set("notes", notes);
    fd.set("defaultCategoryId", defaultCategoryId);

    const result = await updateVendor(vendor.id, fd);
    if (result.errors) {
      setError(result.errors.general);
    } else {
      setSuccess("Vendor updated successfully.");
      router.refresh();
    }
    setIsSaving(false);
  }

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteVendor(vendor.id);
    if (result.errors) {
      setError(result.errors.general);
      setIsDeleting(false);
    } else {
      router.push("/vendors");
    }
  }

  const maxCategoryAmount =
    vendor.categoryBreakdown.length > 0
      ? Math.max(...vendor.categoryBreakdown.map((c) => c.amount))
      : 0;

  return (
    <div>
      {/* Back link */}
      <Link
        href="/vendors"
        className="inline-flex items-center gap-2 text-brand-600 font-semibold mb-6 hover:text-brand-700 transition-colors text-base"
      >
        <ArrowLeft className="w-5 h-5" />
        All Vendors
      </Link>

      {/* Messages */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 text-danger-700 border border-danger-200 font-semibold text-base">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-success-50 text-success-700 border border-success-200 font-semibold text-base">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact Info + Spending */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Info Card */}
          <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-charcoal-900 mb-4">
              Contact Info
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-base font-semibold text-charcoal-700 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-charcoal-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1.5" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-charcoal-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1.5" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-charcoal-700 mb-1">
                  Default Category
                </label>
                <select
                  value={defaultCategoryId}
                  onChange={(e) => setDefaultCategoryId(e.target.value)}
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
              <div>
                <label className="block text-base font-semibold text-charcoal-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base resize-none"
                />
              </div>
              {userCanWrite && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-lg min-h-[44px] disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Changes
                </button>
              )}
            </div>
          </div>

          {/* Spending Summary Card */}
          <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-charcoal-900 mb-4">
              Spending Summary
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-charcoal-400" />
                <span className="text-base text-charcoal-600">Total Spent</span>
                <span className="ml-auto text-xl font-bold text-charcoal-900 tabular-nums">
                  {formatCurrency(vendor.totalSpent)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-charcoal-400" />
                <span className="text-base text-charcoal-600">Invoices</span>
                <span className="ml-auto text-xl font-bold text-charcoal-900">
                  {vendor.invoiceCount}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-charcoal-400" />
                <span className="text-base text-charcoal-600">First Invoice</span>
                <span className="ml-auto text-base text-charcoal-700">
                  {formatDate(vendor.firstInvoiceDate)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-charcoal-400" />
                <span className="text-base text-charcoal-600">Last Invoice</span>
                <span className="ml-auto text-base text-charcoal-700">
                  {formatDate(vendor.lastInvoiceDate)}
                </span>
              </div>
            </div>

            {/* Category Breakdown Bars */}
            {vendor.categoryBreakdown.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-charcoal-700 mb-3">
                  By Category
                </h3>
                <div className="space-y-3">
                  {vendor.categoryBreakdown.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-charcoal-700">
                          {cat.name}
                        </span>
                        <span className="text-charcoal-600 tabular-nums">
                          {formatCurrency(cat.amount)}
                        </span>
                      </div>
                      <div className="h-3 bg-charcoal-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all"
                          style={{
                            width: `${maxCategoryAmount > 0 ? (cat.amount / maxCategoryAmount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Delete Vendor — only for users with write access */}
          {userCanWrite && (
          <div className="bg-white rounded-2xl border border-danger-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-danger-700 mb-2">
              Delete Vendor
            </h2>
            <p className="text-base text-charcoal-600 mb-4">
              This will remove the vendor record. Invoices will not be deleted
              but will no longer be linked to this vendor.
            </p>
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-base font-semibold text-danger-700">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-danger-600 text-white rounded-2xl font-semibold hover:bg-danger-700 transition-colors text-lg min-h-[44px] disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-5 py-3 bg-charcoal-100 text-charcoal-900 rounded-2xl font-semibold hover:bg-charcoal-200 transition-colors text-lg min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-danger-100 text-danger-700 rounded-2xl font-semibold hover:bg-danger-200 transition-colors text-base min-h-[44px]"
              >
                <Trash2 className="w-5 h-5" />
                Delete This Vendor
              </button>
            )}
          </div>
          )}
        </div>

        {/* Right Column: Invoice History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-charcoal-200">
              <h2 className="text-xl font-bold text-charcoal-900">
                Invoice History
              </h2>
              <p className="text-base text-charcoal-600 mt-1">
                {vendor.invoiceCount} invoice
                {vendor.invoiceCount !== 1 ? "s" : ""} totaling{" "}
                {formatCurrency(vendor.totalSpent)}
              </p>
            </div>

            {vendor.invoices.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-charcoal-300 mx-auto mb-4" />
                <p className="text-lg text-charcoal-600">
                  No invoices found for this vendor.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-charcoal-200 bg-cream-50">
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
                      <th className="py-3 px-4 text-left text-sm font-semibold text-charcoal-600 uppercase tracking-wide">
                        Project
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendor.invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        onClick={() => router.push(`/invoices/${inv.id}`)}
                        className="border-b border-charcoal-100 hover:bg-cream-50 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-4">
                          <span className="text-base font-semibold text-charcoal-900">
                            {inv.invoiceNumber || "—"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-base text-charcoal-600">
                            {formatDate(inv.invoiceDate)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-lg font-semibold text-charcoal-900 tabular-nums">
                            {inv.totalAmount !== null
                              ? formatCurrency(inv.totalAmount)
                              : "—"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={inv.status} size="sm" />
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-base text-charcoal-600">
                            {inv.projectName}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
