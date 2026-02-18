"use client";

import { useState } from "react";
import {
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  updateInvoice,
  updateLineItemCategory,
  deleteInvoice,
} from "@/actions/invoices";
import {
  categorizeInvoiceItems,
  acceptSuggestion,
} from "@/actions/categorize";
import { useRouter } from "next/navigation";

interface BudgetCategory {
  id: string;
  name: string;
  budgetedAmount: number;
}

interface InvoiceDetailClientProps {
  invoiceId: string;
  currentStatus?: string;
  lineItemId?: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categorySuggestion?: string | null;
  categoryConfidence?: number | null;
  budgetCategories?: BudgetCategory[];
  showCategoryUI?: boolean;
  showAutoCategorize?: boolean;
  currentNotes?: string | null;
  showNotesEditor?: boolean;
  showDeleteButton?: boolean;
}

export function InvoiceDetailClient({
  invoiceId,
  currentStatus,
  lineItemId,
  categoryId,
  categoryName,
  categorySuggestion,
  categoryConfidence,
  budgetCategories = [],
  showCategoryUI = false,
  showAutoCategorize = false,
  currentNotes,
  showNotesEditor = false,
  showDeleteButton = false,
}: InvoiceDetailClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [notes, setNotes] = useState(currentNotes || "");
  const [selectedCategory, setSelectedCategory] = useState(categoryId);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
  };

  // ===== Status Change Handler =====
  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("status", newStatus);

    const result = await updateInvoice(invoiceId, formData);

    setIsLoading(false);
    if (result.errors) {
      setError(result.errors.general || "Failed to update status");
      clearMessages();
    } else {
      setSuccess("Status updated successfully");
      setIsEditingStatus(false);
      clearMessages();
    }
  };

  // ===== Notes Editor Handler =====
  const handleSaveNotes = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("notes", notes);

    const result = await updateInvoice(invoiceId, formData);

    setIsLoading(false);
    if (result.errors) {
      setError(result.errors.general || "Failed to save notes");
      clearMessages();
    } else {
      setSuccess("Notes saved successfully");
      setIsEditingNotes(false);
      clearMessages();
    }
  };

  // ===== Category Assignment Handler =====
  const handleAssignCategory = async (catId: string | null) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await updateLineItemCategory(lineItemId!, catId);

    setIsLoading(false);
    if (result.errors) {
      setError(result.errors.general || "Failed to update category");
      clearMessages();
    } else {
      setSuccess("Category assigned successfully");
      setSelectedCategory(catId);
      setShowCategoryDropdown(false);
      clearMessages();
    }
  };

  // ===== Accept Suggestion Handler =====
  const handleAcceptSuggestion = async (catId: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await acceptSuggestion(lineItemId!, catId);

    setIsLoading(false);
    if (result.errors) {
      setError(result.errors.general || "Failed to accept suggestion");
      clearMessages();
    } else {
      setSuccess("Suggestion accepted");
      setSelectedCategory(catId);
      clearMessages();
    }
  };

  // ===== Reject Suggestion Handler =====
  const handleRejectSuggestion = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Reject by updating the category to null (clearing suggestion)
    const result = await updateLineItemCategory(lineItemId!, null);

    setIsLoading(false);
    if (result.errors) {
      setError(result.errors.general || "Failed to reject suggestion");
      clearMessages();
    } else {
      setSuccess("Suggestion rejected");
      setSelectedCategory(null);
      clearMessages();
    }
  };

  // ===== Auto-Categorize Handler =====
  const handleAutoCategorize = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await categorizeInvoiceItems(invoiceId);

    setIsLoading(false);
    if (result.errors) {
      setError(result.errors.general || "Failed to run auto-categorize");
      clearMessages();
    } else {
      setSuccess("Auto-categorization complete");
      clearMessages();
    }
  };

  // ===== Delete Invoice Handler =====
  const handleDeleteInvoice = async () => {
    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    const result = await deleteInvoice(invoiceId);

    setIsDeleting(false);
    if (result.errors) {
      setError(result.errors.general || "Failed to delete invoice");
      clearMessages();
    } else {
      router.push("/invoices");
    }
  };

  // ===== Status Change Dropdown =====
  if (isEditingStatus && currentStatus) {
    return (
      <div className="space-y-3">
        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isLoading}
          className="w-full px-4 py-3 rounded-xl border-2 border-brand-200 bg-white text-lg font-semibold text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
        </select>
        <button
          onClick={() => setIsEditingStatus(false)}
          disabled={isLoading}
          className="w-full px-4 py-3 rounded-xl bg-charcoal-100 text-charcoal-900 hover:bg-charcoal-200 transition-colors font-semibold text-lg h-11 disabled:opacity-50"
        >
          Done
        </button>
      </div>
    );
  }

  // ===== Status Display with Edit Button =====
  if (currentStatus) {
    return (
      <div className="flex gap-3">
        <button
          onClick={() => setIsEditingStatus(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors font-semibold text-base h-11"
        >
          <Pencil className="w-5 h-5" />
          Edit Status
        </button>
      </div>
    );
  }

  // ===== Delete Button =====
  if (showDeleteButton) {
    if (showDeleteConfirm) {
      return (
        <div className="flex gap-3 flex-col">
          <p className="text-base text-charcoal-700 font-semibold">
            Delete this invoice? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteInvoice}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold text-base h-11 disabled:opacity-50 inline-flex items-center justify-center gap-2"
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
              disabled={isDeleting}
              className="flex-1 px-4 py-2 rounded-xl bg-charcoal-100 text-charcoal-900 hover:bg-charcoal-200 transition-colors font-semibold text-base h-11 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-semibold text-base h-11"
      >
        <Trash2 className="w-5 h-5" />
        Delete
      </button>
    );
  }

  // ===== Auto-Categorize Button =====
  if (showAutoCategorize) {
    return (
      <button
        onClick={handleAutoCategorize}
        disabled={isLoading}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 text-white hover:bg-brand-700 transition-colors font-semibold text-lg h-11 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
        Run Auto-Categorize
      </button>
    );
  }

  // ===== Notes Editor =====
  if (showNotesEditor) {
    if (isEditingNotes) {
      return (
        <div className="space-y-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl border-2 border-brand-200 bg-white text-lg text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium resize-none"
            rows={6}
            placeholder="Add notes about this invoice..."
          />
          <div className="flex gap-3">
            <button
              onClick={handleSaveNotes}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors font-semibold text-lg h-11 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              Save
            </button>
            <button
              onClick={() => {
                setIsEditingNotes(false);
                setNotes(currentNotes || "");
              }}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-charcoal-100 text-charcoal-900 hover:bg-charcoal-200 transition-colors font-semibold text-lg h-11 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {notes ? (
          <p className="text-lg text-charcoal-900 bg-cream-50 rounded-xl p-4 border border-charcoal-100">
            {notes}
          </p>
        ) : (
          <p className="text-lg text-charcoal-500 italic">No notes yet</p>
        )}
        <button
          onClick={() => setIsEditingNotes(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-brand-600 text-white hover:bg-brand-700 transition-colors font-semibold text-lg h-11"
        >
          <Pencil className="w-5 h-5" />
          Edit Notes
        </button>
      </div>
    );
  }

  // ===== Category UI =====
  if (showCategoryUI && lineItemId) {
    // Has assigned category - show it with option to change
    if (categoryId && categoryName) {
      return (
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-success-100 text-success-700 font-semibold text-base">
              {categoryName}
            </span>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="px-2 py-1 rounded-lg text-charcoal-600 hover:text-charcoal-900 transition-colors"
              title="Change category"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          {showCategoryDropdown && (
            <select
              value={selectedCategory || ""}
              onChange={(e) => {
                handleAssignCategory(e.target.value || null);
              }}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg border-2 border-brand-200 bg-white text-base font-medium text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">No Category</option>
              {budgetCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>
      );
    }

    // Has suggestion - show with accept/reject buttons
    if (categorySuggestion) {
      const suggestedCategory = budgetCategories.find(
        (c) => c.name === categorySuggestion
      );
      const confidencePercent =
        categoryConfidence != null
          ? Math.round(categoryConfidence * 100)
          : 0;

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-warning-100 text-warning-700 font-semibold text-base">
              {categorySuggestion}
            </span>
            <span className="text-sm text-charcoal-600">
              {confidencePercent}%
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                suggestedCategory &&
                handleAcceptSuggestion(suggestedCategory.id)
              }
              disabled={isLoading || !suggestedCategory}
              className="flex-1 px-2 py-1 rounded-lg bg-success-100 text-success-700 hover:bg-success-200 transition-colors font-semibold text-sm h-9 disabled:opacity-50 inline-flex items-center justify-center gap-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Accept
            </button>
            <button
              onClick={handleRejectSuggestion}
              disabled={isLoading}
              className="flex-1 px-2 py-1 rounded-lg bg-charcoal-100 text-charcoal-700 hover:bg-charcoal-200 transition-colors font-semibold text-sm h-9 disabled:opacity-50 inline-flex items-center justify-center gap-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              Reject
            </button>
          </div>
        </div>
      );
    }

    // No category, no suggestion - show dropdown to assign
    if (showCategoryDropdown) {
      return (
        <select
          value={selectedCategory || ""}
          onChange={(e) => {
            handleAssignCategory(e.target.value || null);
          }}
          disabled={isLoading}
          className="w-full px-3 py-2 rounded-lg border-2 border-brand-200 bg-white text-base font-medium text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Select Category</option>
          {budgetCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      );
    }

    return (
      <button
        onClick={() => setShowCategoryDropdown(true)}
        className="px-3 py-1 rounded-lg bg-charcoal-100 text-charcoal-700 hover:bg-charcoal-200 transition-colors font-semibold text-sm"
      >
        Uncategorized
      </button>
    );
  }

  // ===== Error/Success Messages =====
  if (error) {
    return (
      <div className="px-4 py-3 rounded-xl bg-red-100 text-red-700 font-semibold text-base border border-red-200">
        {error}
      </div>
    );
  }

  if (success) {
    return (
      <div className="px-4 py-3 rounded-xl bg-success-100 text-success-700 font-semibold text-base border border-success-200">
        {success}
      </div>
    );
  }

  return null;
}
