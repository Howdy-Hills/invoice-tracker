"use client";

import { useState, useRef } from "react";
import {
  updateCategory,
  deleteCategory,
  addCategory,
  reorderCategories,
} from "@/actions/categories";
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Loader2,
  Check,
  X,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  budgetedAmount: number;
  sortOrder: number;
}

interface BudgetTableProps {
  projectId: string;
  categories: Category[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function EditableCell({
  value,
  onSave,
  type = "text",
  className = "",
}: {
  value: string;
  onSave: (val: string) => Promise<void>;
  type?: "text" | "currency";
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    if (type === "currency") {
      // Strip formatting for editing
      setEditValue(value.replace(/[$,]/g, ""));
    } else {
      setEditValue(value);
    }
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function save() {
    setSaving(true);
    await onSave(editValue);
    setSaving(false);
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
    setEditValue(value);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type={type === "currency" ? "number" : "text"}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          step={type === "currency" ? "0.01" : undefined}
          min={type === "currency" ? "0" : undefined}
          className="px-3 py-2 rounded-lg border border-brand-300 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base w-full"
          autoFocus
          disabled={saving}
        />
        <button
          onClick={save}
          disabled={saving}
          className="p-1.5 rounded-lg hover:bg-success-50 text-success-600 transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={cancel}
          className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      className={`text-left px-3 py-2 rounded-lg hover:bg-cream-200 transition-colors cursor-text w-full min-h-[44px] flex items-center ${className}`}
    >
      {type === "currency" ? formatCurrency(parseFloat(value) || 0) : value}
    </button>
  );
}

function CategoryRow({
  category,
  projectId,
  isFirst,
  isLast,
  onMove,
  onDelete,
}: {
  category: Category;
  projectId: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (id: string, direction: "up" | "down") => void;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleUpdateName(newName: string) {
    if (!newName.trim()) return;
    const fd = new FormData();
    fd.set("name", newName);
    await updateCategory(category.id, fd);
  }

  async function handleUpdateAmount(newAmount: string) {
    const fd = new FormData();
    fd.set("budgetedAmount", newAmount);
    await updateCategory(category.id, fd);
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteCategory(category.id);
    onDelete(category.id);
    setDeleting(false);
  }

  return (
    <tr className="border-b border-charcoal-100 hover:bg-cream-50 transition-colors">
      {/* Reorder */}
      <td className="py-2 px-2 w-16">
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={() => onMove(category.id, "up")}
            disabled={isFirst}
            className="p-1 rounded hover:bg-cream-200 disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="w-4 h-4 text-charcoal-500" />
          </button>
          <button
            onClick={() => onMove(category.id, "down")}
            disabled={isLast}
            className="p-1 rounded hover:bg-cream-200 disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-charcoal-500" />
          </button>
        </div>
      </td>

      {/* Name */}
      <td className="py-2 px-2">
        <EditableCell
          value={category.name}
          onSave={handleUpdateName}
          className="font-medium text-charcoal-900"
        />
      </td>

      {/* Amount */}
      <td className="py-2 px-2 w-48">
        <EditableCell
          value={String(category.budgetedAmount)}
          onSave={handleUpdateAmount}
          type="currency"
          className="text-charcoal-800 tabular-nums"
        />
      </td>

      {/* Actions */}
      <td className="py-2 px-2 w-16">
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-lg bg-danger-50 text-danger-600 hover:bg-danger-100 transition-colors"
              title="Confirm delete"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="p-2 rounded-lg hover:bg-cream-200 text-charcoal-500 transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-lg hover:bg-danger-50 text-charcoal-400 hover:text-danger-600 transition-colors"
            title="Delete category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </td>
    </tr>
  );
}

function AddCategoryRow({ projectId }: { projectId: string }) {
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    await addCategory(projectId, formData);
    setLoading(false);
    setAdding(false);
  }

  if (!adding) {
    return (
      <tr>
        <td colSpan={4} className="py-3 px-2">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-brand-600 hover:bg-brand-50 font-medium transition-colors min-h-[44px] text-base"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-charcoal-100">
      <td className="py-2 px-2 w-16" />
      <td className="py-2 px-2" colSpan={2}>
        <form action={handleSubmit} className="flex items-center gap-3">
          <input
            name="name"
            type="text"
            required
            placeholder="Category name"
            autoFocus
            className="flex-1 px-3 py-2.5 rounded-lg border border-charcoal-200 bg-cream-50 text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
          />
          <input
            name="budgetedAmount"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0"
            placeholder="$0.00"
            className="w-36 px-3 py-2.5 rounded-lg border border-charcoal-200 bg-cream-50 text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors min-h-[44px] text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="px-3 py-2.5 rounded-lg text-charcoal-500 hover:bg-cream-200 transition-colors min-h-[44px] text-sm"
          >
            Cancel
          </button>
        </form>
      </td>
      <td className="py-2 px-2 w-16" />
    </tr>
  );
}

export function BudgetTable({ projectId, categories }: BudgetTableProps) {
  const [localCategories, setLocalCategories] =
    useState<Category[]>(categories);

  // Keep in sync with server data — compare IDs, names, AND amounts
  const serverKey = JSON.stringify(
    categories.map((c) => ({ id: c.id, n: c.name, a: c.budgetedAmount }))
  );
  const localKey = JSON.stringify(
    localCategories.map((c) => ({ id: c.id, n: c.name, a: c.budgetedAmount }))
  );
  if (serverKey !== localKey) {
    setLocalCategories(categories);
  }

  async function handleMove(id: string, direction: "up" | "down") {
    const idx = localCategories.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= localCategories.length) return;

    const newOrder = [...localCategories];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setLocalCategories(newOrder);

    await reorderCategories(
      projectId,
      newOrder.map((c) => c.id)
    );
  }

  function handleDelete(id: string) {
    setLocalCategories((prev) => prev.filter((c) => c.id !== id));
  }

  const total = localCategories.reduce(
    (sum, cat) => sum + cat.budgetedAmount,
    0
  );

  return (
    <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-charcoal-200 bg-cream-50">
              <th className="py-3 px-2 w-16" />
              <th className="py-3 px-4 text-left text-sm font-semibold text-charcoal-600 uppercase tracking-wide">
                Category
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-charcoal-600 uppercase tracking-wide w-48">
                Budgeted Amount
              </th>
              <th className="py-3 px-2 w-16" />
            </tr>
          </thead>
          <tbody>
            {localCategories.map((cat, i) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                projectId={projectId}
                isFirst={i === 0}
                isLast={i === localCategories.length - 1}
                onMove={handleMove}
                onDelete={handleDelete}
              />
            ))}
            <AddCategoryRow projectId={projectId} />
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-charcoal-200 bg-cream-50">
              <td className="py-4 px-2" />
              <td className="py-4 px-4 font-bold text-charcoal-900 text-lg">
                Total Budget
              </td>
              <td className="py-4 px-4 font-bold text-charcoal-900 text-lg tabular-nums">
                {formatCurrency(total)}
              </td>
              <td className="py-4 px-2" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
