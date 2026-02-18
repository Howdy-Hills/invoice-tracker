"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Loader2,
  Check,
  X,
  Pencil,
} from "lucide-react";
import {
  addLineItem,
  updateLineItem,
  deleteLineItem,
  updateLineItemCategory,
} from "@/actions/invoices";
import {
  acceptSuggestion,
} from "@/actions/categorize";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number | null;
  amount: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryConfidence: number | null;
  categorySuggestion: string | null;
  isTax: boolean;
}

interface BudgetCategory {
  id: string;
  name: string;
  budgetedAmount: number;
}

interface LineItemsManagerProps {
  invoiceId: string;
  lineItems: LineItem[];
  budgetCategories: BudgetCategory[];
  taxAmount: number;
  totalAmount: number | null;
}

function formatCurrency(amount: number | null) {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function LineItemsManager({
  invoiceId,
  lineItems,
  budgetCategories,
  taxAmount,
  totalAmount,
}: LineItemsManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<LineItem>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addingLoading, setAddingLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [categoryEditId, setCategoryEditId] = useState<string | null>(null);

  const lineItemsTotal = lineItems
    .filter((li) => !li.isTax)
    .reduce((sum, li) => sum + li.amount, 0);

  function startEdit(item: LineItem) {
    setEditingId(item.id);
    setEditData({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
    });
  }

  async function saveEdit(itemId: string) {
    setSavingId(itemId);
    const fd = new FormData();
    if (editData.description !== undefined)
      fd.set("description", editData.description);
    if (editData.quantity !== undefined)
      fd.set("quantity", String(editData.quantity));
    if (editData.unitPrice !== undefined && editData.unitPrice !== null)
      fd.set("unitPrice", String(editData.unitPrice));
    if (editData.amount !== undefined)
      fd.set("amount", String(editData.amount));

    await updateLineItem(itemId, fd);
    setSavingId(null);
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(itemId: string) {
    setDeletingId(itemId);
    await deleteLineItem(itemId);
    setDeletingId(null);
    setConfirmDeleteId(null);
    router.refresh();
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddingLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    await addLineItem(invoiceId, fd);
    setAddingLoading(false);
    setIsAdding(false);
    router.refresh();
  }

  async function handleCategoryChange(lineItemId: string, catId: string | null) {
    setSavingId(lineItemId);
    await updateLineItemCategory(lineItemId, catId);
    setSavingId(null);
    setCategoryEditId(null);
    router.refresh();
  }

  async function handleAcceptSuggestion(lineItemId: string, catId: string) {
    setSavingId(lineItemId);
    await acceptSuggestion(lineItemId, catId);
    setSavingId(null);
    router.refresh();
  }

  async function handleRejectSuggestion(lineItemId: string) {
    setSavingId(lineItemId);
    await updateLineItemCategory(lineItemId, null);
    setSavingId(null);
    router.refresh();
  }

  return (
    <div>
      {/* Line Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-charcoal-100">
              <th className="text-left py-4 px-4 text-base font-semibold text-charcoal-900">
                Description
              </th>
              <th className="text-right py-4 px-4 text-base font-semibold text-charcoal-900 w-20">
                Qty
              </th>
              <th className="text-right py-4 px-4 text-base font-semibold text-charcoal-900 w-28">
                Unit Price
              </th>
              <th className="text-right py-4 px-4 text-base font-semibold text-charcoal-900 w-28">
                Amount
              </th>
              <th className="text-left py-4 px-4 text-base font-semibold text-charcoal-900 w-48">
                Category
              </th>
              <th className="py-4 px-2 w-20" />
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => (
              <tr
                key={item.id}
                className="border-b border-charcoal-100 hover:bg-cream-50 transition-colors"
              >
                {editingId === item.id ? (
                  /* Editing mode */
                  <>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={editData.description || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, description: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-brand-300 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
                        autoFocus
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={editData.quantity || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            quantity: parseFloat(e.target.value) || 0,
                          })
                        }
                        step="0.001"
                        className="w-full px-2 py-2 rounded-lg border border-brand-300 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base text-right"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={editData.unitPrice ?? ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            unitPrice: e.target.value
                              ? parseFloat(e.target.value)
                              : null,
                          })
                        }
                        step="0.01"
                        className="w-full px-2 py-2 rounded-lg border border-brand-300 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base text-right"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={editData.amount || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        step="0.01"
                        className="w-full px-2 py-2 rounded-lg border border-brand-300 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base text-right"
                      />
                    </td>
                    <td className="py-3 px-4" />
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => saveEdit(item.id)}
                          disabled={savingId === item.id}
                          className="p-1.5 rounded-lg hover:bg-success-50 text-success-600 transition-colors"
                        >
                          {savingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  /* Display mode */
                  <>
                    <td className="py-4 px-4">
                      <p className="text-lg text-charcoal-900 font-medium">
                        {item.description}
                      </p>
                      {item.isTax && (
                        <p className="text-base text-charcoal-600 mt-1">
                          (Tax)
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-lg text-charcoal-900 font-medium">
                        {item.quantity}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-lg text-charcoal-900 font-medium">
                        {formatCurrency(item.unitPrice)}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-lg font-bold text-charcoal-900">
                        {formatCurrency(item.amount)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      {/* Category UI */}
                      {categoryEditId === item.id ? (
                        <select
                          value={item.categoryId || ""}
                          onChange={(e) =>
                            handleCategoryChange(
                              item.id,
                              e.target.value || null
                            )
                          }
                          disabled={savingId === item.id}
                          className="w-full px-3 py-2 rounded-lg border-2 border-brand-200 bg-white text-base font-medium text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          autoFocus
                          onBlur={() => setCategoryEditId(null)}
                        >
                          <option value="">No Category</option>
                          {budgetCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      ) : item.categoryId && item.categoryName ? (
                        <div className="inline-flex items-center gap-2">
                          <span className="px-3 py-1 rounded-lg bg-success-100 text-success-700 font-semibold text-sm">
                            {item.categoryName}
                          </span>
                          <button
                            onClick={() => setCategoryEditId(item.id)}
                            className="p-1 rounded text-charcoal-400 hover:text-charcoal-700 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : item.categorySuggestion ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 rounded-lg bg-warning-100 text-warning-700 font-semibold text-sm">
                              {item.categorySuggestion}
                            </span>
                            {item.categoryConfidence !== null && (
                              <span className="text-xs text-charcoal-500">
                                {Math.round(item.categoryConfidence * 100)}%
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {(() => {
                              const suggested = budgetCategories.find(
                                (c) => c.name === item.categorySuggestion
                              );
                              return suggested ? (
                                <button
                                  onClick={() =>
                                    handleAcceptSuggestion(
                                      item.id,
                                      suggested.id
                                    )
                                  }
                                  disabled={savingId === item.id}
                                  className="px-2 py-0.5 rounded bg-success-100 text-success-700 hover:bg-success-200 text-xs font-semibold"
                                >
                                  Accept
                                </button>
                              ) : null;
                            })()}
                            <button
                              onClick={() => handleRejectSuggestion(item.id)}
                              disabled={savingId === item.id}
                              className="px-2 py-0.5 rounded bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200 text-xs font-semibold"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCategoryEditId(item.id)}
                          className="px-3 py-1 rounded-lg bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200 transition-colors font-semibold text-sm"
                        >
                          Uncategorized
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-cream-200 text-charcoal-400 hover:text-charcoal-700 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === item.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="p-1.5 rounded-lg bg-danger-50 text-danger-600 hover:bg-danger-100 transition-colors"
                              title="Confirm delete"
                            >
                              {deletingId === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-1.5 rounded-lg hover:bg-cream-200 text-charcoal-500 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-1.5 rounded-lg hover:bg-danger-50 text-charcoal-400 hover:text-danger-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Line Item */}
      {isAdding ? (
        <form onSubmit={handleAdd} className="mt-4 p-4 bg-cream-50 rounded-xl border border-charcoal-100">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-charcoal-600 mb-1">
                Description
              </label>
              <input
                name="description"
                type="text"
                required
                autoFocus
                placeholder="Item description"
                className="w-full px-3 py-2.5 rounded-lg border border-charcoal-200 bg-white text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal-600 mb-1">
                Qty
              </label>
              <input
                name="quantity"
                type="number"
                step="0.001"
                defaultValue="1"
                className="w-full px-3 py-2.5 rounded-lg border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal-600 mb-1">
                Amount
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-lg border border-charcoal-200 bg-white text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addingLoading}
                className="px-4 py-2.5 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors min-h-[44px] text-sm"
              >
                {addingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add"
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-2.5 rounded-lg text-charcoal-500 hover:bg-cream-200 transition-colors min-h-[44px] text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-brand-600 hover:bg-brand-50 font-medium transition-colors min-h-[44px] text-base"
        >
          <Plus className="w-5 h-5" />
          Add Line Item
        </button>
      )}

      {/* Totals */}
      <div className="border-t-2 border-charcoal-100 pt-6 mt-6">
        <div className="space-y-4">
          <div className="flex justify-end items-center gap-8">
            <span className="text-lg font-semibold text-charcoal-600">
              Subtotal:
            </span>
            <span className="text-lg font-semibold text-charcoal-900 w-40 text-right">
              {formatCurrency(lineItemsTotal)}
            </span>
          </div>
          {taxAmount > 0 && (
            <div className="flex justify-end items-center gap-8">
              <span className="text-lg font-semibold text-charcoal-600">
                Tax:
              </span>
              <span className="text-lg font-semibold text-charcoal-900 w-40 text-right">
                {formatCurrency(taxAmount)}
              </span>
            </div>
          )}
          <div className="flex justify-end items-center gap-8 pt-4 border-t border-charcoal-100">
            <span className="text-xl font-bold text-charcoal-900">Total:</span>
            <span className="text-2xl font-bold text-brand-600 w-40 text-right">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
