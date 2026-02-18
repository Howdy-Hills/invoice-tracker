"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Loader2, Check } from "lucide-react";
import { saveInvoice } from "@/actions/invoices";
import { useRouter } from "next/navigation";

interface BudgetCategory {
  id: string;
  name: string;
  budgetedAmount: number;
}

interface ManualEntryFormProps {
  projectId: string;
  projectName: string;
  categories: BudgetCategory[];
}

interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
  categoryId: string;
  isTaxable: boolean;
}

export function ManualEntryForm({
  projectId,
  projectName,
  categories,
}: ManualEntryFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [vendorName, setVendorName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Add a new line item
  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: "",
      qty: 1,
      unitPrice: 0,
      amount: 0,
      categoryId: categories.length > 0 ? categories[0].id : "",
      isTaxable: false,
    };
    setLineItems([...lineItems, newItem]);
  };

  // Update a line item
  const updateLineItem = (
    id: string,
    updates: Partial<LineItem>
  ) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, ...updates };

        // Auto-calculate amount if qty or unitPrice changed
        if (updates.qty !== undefined || updates.unitPrice !== undefined) {
          updated.amount = updated.qty * updated.unitPrice;
        }

        return updated;
      })
    );
  };

  // Remove a line item
  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  // Handle form submission
  const handleSaveInvoice = async () => {
    // Validation
    if (!vendorName.trim()) {
      setError("Vendor name is required.");
      return;
    }

    if (lineItems.length === 0) {
      setError("Add at least one line item.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("vendorName", vendorName);
      formData.append("invoiceNumber", invoiceNumber);
      formData.append("invoiceDate", invoiceDate);
      formData.append("totalAmount", totalAmount);
      formData.append("taxAmount", taxAmount);
      formData.append("parseMethod", "manual");
      formData.append("notes", notes);

      // Convert line items to the format expected by saveInvoice
      const lineItemsData = lineItems.map((item) => ({
        description: item.description || "Item",
        quantity: item.qty,
        unitPrice: item.unitPrice,
        amount: item.amount,
        categoryId: item.categoryId || null,
        categoryConfidence: null,
        categorySuggestion: null,
        isTax: item.isTaxable,
      }));

      formData.append("lineItems", JSON.stringify(lineItemsData));

      const result = await saveInvoice(formData);

      if (!result.success) {
        setError(result.errors?.general || "Failed to save invoice.");
        setIsSaving(false);
        return;
      }

      // Success - redirect to invoice detail page
      router.push(`/invoices/${result.invoiceId}`);
    } catch (err) {
      console.error("Error saving invoice:", err);
      setError("An unexpected error occurred.");
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-lg font-semibold text-brand-600 hover:text-brand-700 transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
        Back to Invoices
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-charcoal-900 mb-2">
          New Invoice — Manual Entry
        </h1>
        <p className="text-xl text-charcoal-600">
          Project: <span className="font-semibold text-charcoal-900">{projectName}</span>
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-6 bg-danger-50 border-2 border-danger-200 rounded-2xl">
          <p className="text-lg font-semibold text-danger-700">{error}</p>
        </div>
      )}

      {/* Invoice Details */}
      <div className="bg-white rounded-2xl border-2 border-cream-300 p-8 space-y-6">
        <h2 className="text-2xl font-bold text-charcoal-900">Invoice Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vendor Name */}
          <div>
            <label className="block text-lg font-semibold text-charcoal-900 mb-2">
              Vendor Name <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g., Smith Construction"
              className="w-full px-4 py-3 text-lg border-2 border-cream-300 rounded-xl focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block text-lg font-semibold text-charcoal-900 mb-2">
              Invoice Number
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g., INV-2024-001"
              className="w-full px-4 py-3 text-lg border-2 border-cream-300 rounded-xl focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-lg font-semibold text-charcoal-900 mb-2">
              Invoice Date
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-cream-300 rounded-xl focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Total Amount */}
          <div>
            <label className="block text-lg font-semibold text-charcoal-900 mb-2">
              Total Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-lg font-semibold text-charcoal-600">
                $
              </span>
              <input
                type="text"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 text-lg border-2 border-cream-300 rounded-xl focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          {/* Tax Amount */}
          <div>
            <label className="block text-lg font-semibold text-charcoal-900 mb-2">
              Tax Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-lg font-semibold text-charcoal-600">
                $
              </span>
              <input
                type="text"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 text-lg border-2 border-cream-300 rounded-xl focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-lg font-semibold text-charcoal-900 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Additional notes about this invoice..."
            className="w-full px-4 py-3 text-lg border-2 border-cream-300 rounded-xl focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 resize-none"
          />
        </div>
      </div>

      {/* Line Items Section */}
      <div className="bg-white rounded-2xl border-2 border-cream-300 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-charcoal-900">Line Items</h2>
          <button
            onClick={addLineItem}
            className="flex items-center gap-2 px-6 py-3 bg-brand-100 hover:bg-brand-200 text-brand-700 font-bold rounded-xl text-lg transition-colors h-12"
          >
            <Plus className="w-6 h-6" />
            Add Line Item
          </button>
        </div>

        {lineItems.length === 0 ? (
          <p className="text-lg text-charcoal-600 py-8 text-center">
            No line items yet. Click "Add Line Item" to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-cream-300">
                  <th className="text-left py-4 px-4 font-bold text-charcoal-900 text-lg">
                    Description
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-charcoal-900 text-lg">
                    Qty
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-charcoal-900 text-lg">
                    Unit Price
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-charcoal-900 text-lg">
                    Amount
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-charcoal-900 text-lg">
                    Category
                  </th>
                  <th className="text-center py-4 px-4 font-bold text-charcoal-900 text-lg">
                    Tax
                  </th>
                  <th className="text-center py-4 px-4 font-bold text-charcoal-900 text-lg">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-cream-300 hover:bg-cream-50"
                  >
                    <td className="py-4 px-4">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(item.id, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Item description"
                        className="w-full px-3 py-2 text-base border border-cream-300 rounded-lg focus:outline-none focus:border-brand-600"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="number"
                        step="0.01"
                        value={item.qty}
                        onChange={(e) =>
                          updateLineItem(item.id, {
                            qty: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20 px-3 py-2 text-base border border-cream-300 rounded-lg focus:outline-none focus:border-brand-600"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(item.id, {
                            unitPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-24 px-3 py-2 text-base border border-cream-300 rounded-lg focus:outline-none focus:border-brand-600"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-24 px-3 py-2 text-base font-semibold text-charcoal-900 bg-cream-50 rounded-lg">
                        ${item.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={item.categoryId}
                        onChange={(e) =>
                          updateLineItem(item.id, {
                            categoryId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-base border border-cream-300 rounded-lg focus:outline-none focus:border-brand-600"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={item.isTaxable}
                        onChange={(e) =>
                          updateLineItem(item.id, {
                            isTaxable: e.target.checked,
                          })
                        }
                        className="w-6 h-6 cursor-pointer accent-brand-600"
                      />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => removeLineItem(item.id)}
                        className="inline-flex items-center justify-center w-12 h-12 hover:bg-danger-50 rounded-xl transition-colors"
                        title="Remove line item"
                      >
                        <Trash2 className="w-6 h-6 text-danger-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => router.back()}
          className="flex-1 py-4 px-8 bg-cream-300 hover:bg-cream-200 text-charcoal-900 text-xl font-bold rounded-xl transition-colors h-12 flex items-center justify-center"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveInvoice}
          disabled={isSaving}
          className="flex-1 py-4 px-8 bg-brand-600 hover:bg-brand-700 disabled:bg-cream-300 disabled:cursor-not-allowed text-white text-xl font-bold rounded-xl transition-colors flex items-center justify-center gap-3 h-12"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-6 h-6" />
              Save Invoice
            </>
          )}
        </button>
      </div>
    </div>
  );
}
