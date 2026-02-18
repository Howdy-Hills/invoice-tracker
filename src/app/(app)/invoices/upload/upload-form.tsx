"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  Loader2,
  Check,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  Sparkles,
} from "lucide-react";
import { extractTextFromPdf, parseInvoiceText } from "@/lib/pdf-parser";
import { categorizeLineItem } from "@/lib/keyword-categorizer";
import { saveInvoice } from "@/actions/invoices";
import { hasAiKey, aiParseInvoice, aiSuggestCategory } from "@/actions/parse-invoice";
import { useRouter } from "next/navigation";

interface BudgetCategory {
  id: string;
  name: string;
}

interface UploadFormProps {
  projectId: string;
  projectName: string;
  categories: BudgetCategory[];
}

interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number | null;
  amount: number;
  categoryId: string;
  isTax: boolean;
}

export function UploadForm({
  projectId,
  projectName,
  categories,
}: UploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "review">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseMethod, setParseMethod] = useState<string>("pdf_js");
  const [aiAvailable, setAiAvailable] = useState(false);

  const [rawText, setRawText] = useState("");
  const [showRawText, setShowRawText] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [vendorName, setVendorName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [applyAllCategoryId, setApplyAllCategoryId] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<{
    categoryName: string | null;
    confidence: number;
    reason: string;
  } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Check if AI is available on mount
  useEffect(() => {
    hasAiKey().then(setAiAvailable);
  }, []);

  // Drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/pdf") {
      setFile(files[0]);
      setError(null);
    } else {
      setError("Please upload a PDF file");
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0 && files[0].type === "application/pdf") {
      setFile(files[0]);
      setError(null);
    } else {
      setError("Please upload a PDF file");
    }
  };

  // Parse invoice
  const handleParse = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Always extract raw text with pdf.js (client-side)
      const pdfText = await extractTextFromPdf(file);
      setRawText(pdfText);

      let parsed: {
        vendorName: string | null;
        invoiceNumber: string | null;
        invoiceDate: string | null;
        totalAmount: number | null;
        taxAmount: number | null;
        lineItems: { description: string; quantity: number; unitPrice: number | null; amount: number }[];
        confidence: number;
        method: string;
      };

      // Step 2: Try AI parsing if available
      if (aiAvailable) {
        const aiResult = await aiParseInvoice(pdfText);
        if (aiResult.success && aiResult.data) {
          parsed = {
            ...aiResult.data,
            confidence: 0.9, // AI parsing is high confidence
            method: "pdf_js_plus_ai",
          };
        } else {
          // Fallback to regex
          const regexResult = parseInvoiceText(pdfText);
          parsed = {
            vendorName: regexResult.vendorName,
            invoiceNumber: regexResult.invoiceNumber,
            invoiceDate: regexResult.invoiceDate,
            totalAmount: regexResult.totalAmount,
            taxAmount: regexResult.taxAmount,
            lineItems: regexResult.lineItems.map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              amount: li.amount,
            })),
            confidence: regexResult.confidence,
            method: "pdf_js",
          };
          // Show AI error as warning, not blocking
          if (aiResult.errors) {
            setError(aiResult.errors.general);
          }
        }
      } else {
        // No AI key — use regex parser
        const regexResult = parseInvoiceText(pdfText);
        parsed = {
          vendorName: regexResult.vendorName,
          invoiceNumber: regexResult.invoiceNumber,
          invoiceDate: regexResult.invoiceDate,
          totalAmount: regexResult.totalAmount,
          taxAmount: regexResult.taxAmount,
          lineItems: regexResult.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            amount: li.amount,
          })),
          confidence: regexResult.confidence,
          method: "pdf_js",
        };
      }

      setParseMethod(parsed.method);
      setConfidence(parsed.confidence);

      // Populate form fields
      setVendorName(parsed.vendorName || "");
      setInvoiceNumber(parsed.invoiceNumber || "");
      setInvoiceDate(parsed.invoiceDate || "");
      setTotalAmount(parsed.totalAmount?.toString() || "");
      setTaxAmount(parsed.taxAmount?.toString() || "0");

      // Build line items with keyword categorization
      const categoryNames = categories.map((c) => c.name);
      const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

      const items: LineItem[] = parsed.lineItems.map((li, i) => {
        // Try keyword categorization
        const match = categorizeLineItem(li.description, categoryNames);
        const catId = match ? categoryMap.get(match.categoryName) || "" : "";

        return {
          id: `line-${Date.now()}-${i}`,
          description: li.description,
          qty: li.quantity || 1,
          unitPrice: li.unitPrice,
          amount: li.amount,
          categoryId: catId,
          isTax: false,
        };
      });

      setLineItems(items);
      setStep("review");

      // Ask AI to suggest an overall category (non-blocking)
      if (aiAvailable && parsed.lineItems.length > 0 && categoryNames.length > 0) {
        setIsSuggesting(true);
        aiSuggestCategory({
          vendorName: parsed.vendorName || "",
          lineDescriptions: parsed.lineItems.map((li) => li.description),
          categoryNames,
        })
          .then((suggestion) => {
            setAiSuggestion(suggestion);
            // Pre-select the suggestion in the Apply to All dropdown
            if (suggestion.categoryName) {
              const suggestedId = categoryMap.get(suggestion.categoryName) || "";
              if (suggestedId) {
                setApplyAllCategoryId(suggestedId);
              }
            }
          })
          .catch(() => {})
          .finally(() => setIsSuggesting(false));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse PDF"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update line item
  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        // Auto-calc amount from qty * unitPrice
        if (
          ("qty" in updates || "unitPrice" in updates) &&
          updated.unitPrice !== null
        ) {
          updated.amount =
            Math.round(updated.qty * updated.unitPrice * 100) / 100;
        }
        return updated;
      })
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        description: "",
        qty: 1,
        unitPrice: null,
        amount: 0,
        categoryId: "",
        isTax: false,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const applyAllCategories = () => {
    if (!applyAllCategoryId) return;
    setLineItems((prev) =>
      prev.map((item) => ({ ...item, categoryId: applyAllCategoryId }))
    );
    setApplyAllCategoryId("");
  };

  // Save invoice
  const handleSave = async () => {
    if (!vendorName.trim()) {
      setError("Vendor name is required");
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("vendorName", vendorName);
      formData.append("invoiceNumber", invoiceNumber);
      if (invoiceDate) formData.append("invoiceDate", invoiceDate);
      if (totalAmount) formData.append("totalAmount", totalAmount);
      formData.append("taxAmount", taxAmount || "0");
      formData.append("parseMethod", parseMethod);
      formData.append("parseConfidence", confidence.toString());
      if (notes) formData.append("notes", notes);
      if (file) formData.append("pdfFile", file);

      formData.append(
        "lineItems",
        JSON.stringify(
          lineItems.map((li) => ({
            description: li.description,
            quantity: li.qty,
            unitPrice: li.unitPrice,
            amount: li.amount,
            categoryId: li.categoryId || null,
            categoryConfidence: null,
            categorySuggestion: null,
            isTax: li.isTax,
          }))
        )
      );

      const result = await saveInvoice(formData);
      if (result.errors) {
        setError(result.errors.general);
      } else if (result.invoiceId) {
        router.push(`/invoices/${result.invoiceId}`);
      } else {
        router.push("/invoices");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save invoice"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confidenceColor =
    confidence > 0.7
      ? "bg-success-500"
      : confidence > 0.3
        ? "bg-warning-500"
        : "bg-danger-500";

  const confidenceLabel =
    confidence > 0.7 ? "High" : confidence > 0.3 ? "Medium" : "Low";

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-charcoal-900 mb-2">
          Upload Invoice
        </h1>
        <p className="text-lg text-charcoal-600">
          Project:{" "}
          <span className="font-semibold text-brand-600">{projectName}</span>
        </p>
        {aiAvailable && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-brand-100 text-brand-700 rounded-lg text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            AI-powered parsing enabled
          </div>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between mb-8 lg:mb-10">
        <div className="flex-1 flex items-center">
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-full text-xl font-bold ${
              step === "upload"
                ? "bg-brand-600 text-white"
                : "bg-brand-100 text-brand-600"
            }`}
          >
            1
          </div>
          <div
            className={`flex-1 h-1 mx-4 rounded-full ${
              step === "review" ? "bg-brand-600" : "bg-cream-300"
            }`}
          />
        </div>
        <div
          className={`flex items-center justify-center w-16 h-16 rounded-full text-xl font-bold ${
            step === "review"
              ? "bg-brand-600 text-white"
              : "bg-cream-300 text-charcoal-500"
          }`}
        >
          2
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-8 p-6 bg-danger-100 border-2 border-danger-200 rounded-2xl flex items-start gap-4">
          <X className="w-8 h-8 text-danger-600 flex-shrink-0 mt-1" />
          <p className="text-lg font-semibold text-danger-600">{error}</p>
        </div>
      )}

      {/* STEP 1: Upload */}
      {step === "upload" && (
        <div className="space-y-6">
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-4 border-dashed rounded-2xl p-12 text-center transition-all ${
              isDragging
                ? "border-brand-600 bg-brand-50"
                : "border-cream-400 bg-cream-50 hover:bg-cream-100"
            }`}
          >
            <Upload className="w-20 h-20 mx-auto mb-6 text-brand-600" />
            <h2 className="text-3xl font-bold text-charcoal-900 mb-3">
              Drag and drop your PDF
            </h2>
            <p className="text-xl text-charcoal-600 mb-8">
              or click the button below to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-block px-12 py-4 bg-brand-600 hover:bg-brand-700 text-white text-xl font-bold rounded-xl transition-colors"
            >
              Browse Files
            </button>
          </div>

          {file && (
            <div className="p-6 bg-cream-100 border-2 border-brand-300 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FileText className="w-10 h-10 text-brand-600" />
                <div>
                  <p className="text-xl font-semibold text-charcoal-900">
                    {file.name}
                  </p>
                  <p className="text-base text-charcoal-600">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="p-3 hover:bg-cream-200 rounded-xl transition-colors"
              >
                <X className="w-8 h-8 text-charcoal-600" />
              </button>
            </div>
          )}

          <button
            onClick={handleParse}
            disabled={!file || isLoading}
            className="w-full py-4 px-8 bg-brand-600 hover:bg-brand-700 disabled:bg-cream-300 disabled:cursor-not-allowed text-white text-2xl font-bold rounded-xl transition-colors flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                {aiAvailable ? "Parsing with AI..." : "Parsing..."}
              </>
            ) : (
              <>
                {aiAvailable && <Sparkles className="w-6 h-6" />}
                {aiAvailable ? "Parse with AI" : "Parse Invoice"}
              </>
            )}
          </button>
        </div>
      )}

      {/* STEP 2: Review */}
      {step === "review" && (
        <div className="space-y-8">
          {/* Confidence + method */}
          <div className="p-6 bg-cream-100 rounded-2xl border-2 border-brand-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-charcoal-900">
                  Parse Confidence
                </p>
                {parseMethod === "pdf_js_plus_ai" && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-100 text-brand-700 rounded-lg text-sm font-semibold">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </span>
                )}
              </div>
              <span className="text-2xl font-bold text-charcoal-900">
                {Math.round(confidence * 100)}%
              </span>
            </div>
            <div className="w-full bg-cream-300 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${confidenceColor}`}
                style={{ width: `${Math.min(confidence * 100, 100)}%` }}
              />
            </div>
            <p className="mt-3 text-base text-charcoal-600">
              {confidenceLabel} confidence
              {parseMethod === "pdf_js_plus_ai"
                ? " — Parsed with Gemini AI"
                : " — Parsed with basic text extraction"}
            </p>
          </div>

          {/* Invoice Details */}
          <div className="bg-white rounded-2xl border-2 border-cream-300 p-8 space-y-6">
            <h3 className="text-2xl font-bold text-charcoal-900">
              Invoice Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-semibold text-charcoal-900 mb-2">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-cream-300 rounded-xl focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-charcoal-900 mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-cream-300 rounded-xl focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                />
              </div>
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
              <div>
                <label className="block text-lg font-semibold text-charcoal-900 mb-2">
                  Total Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-cream-300 rounded-xl focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-charcoal-900 mb-2">
                  Tax Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-cream-300 rounded-xl focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-lg font-semibold text-charcoal-900 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 text-lg border-2 border-cream-300 rounded-xl focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-2xl border-2 border-cream-300 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-charcoal-900">
                Line Items ({lineItems.length})
              </h3>
            </div>

            {/* Apply to All bar */}
            {lineItems.length > 0 && categories.length > 0 && (
              <div className="mb-6 p-4 bg-cream-50 border border-cream-300 rounded-xl space-y-3">
                {/* AI suggestion banner */}
                {isSuggesting && (
                  <div className="flex items-center gap-2 text-base text-charcoal-600">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                    AI is suggesting a category...
                  </div>
                )}
                {aiSuggestion && !isSuggesting && aiSuggestion.categoryName && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-100 text-brand-700 rounded-lg text-sm font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Suggested
                    </span>
                    <span className="text-base font-semibold text-charcoal-900">
                      {aiSuggestion.categoryName}
                    </span>
                    {aiSuggestion.reason && (
                      <span className="text-sm text-charcoal-500">
                        — {aiSuggestion.reason}
                      </span>
                    )}
                  </div>
                )}
                {aiSuggestion && !isSuggesting && !aiSuggestion.categoryName && (
                  <div className="flex items-center gap-2 text-base text-charcoal-500">
                    <Sparkles className="w-4 h-4 text-charcoal-400" />
                    {aiSuggestion.reason || "AI couldn\u2019t determine a category \u2014 please select one manually"}
                  </div>
                )}

                {/* Dropdown + button row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <label className="text-base font-semibold text-charcoal-700 whitespace-nowrap">
                    Apply to all:
                  </label>
                  <select
                    value={applyAllCategoryId}
                    onChange={(e) => setApplyAllCategoryId(e.target.value)}
                    className="flex-1 px-4 py-3 text-base border-2 border-cream-300 rounded-xl focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 bg-white"
                  >
                    <option value="">Select a category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={applyAllCategories}
                    disabled={!applyAllCategoryId}
                    className="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-cream-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-base transition-colors whitespace-nowrap"
                  >
                    Apply to All
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-cream-300">
                    <th className="text-left py-4 px-4 font-bold text-charcoal-900">
                      Description
                    </th>
                    <th className="text-left py-4 px-4 font-bold text-charcoal-900 w-24">
                      Qty
                    </th>
                    <th className="text-left py-4 px-4 font-bold text-charcoal-900 w-32">
                      Unit Price
                    </th>
                    <th className="text-left py-4 px-4 font-bold text-charcoal-900 w-32">
                      Amount
                    </th>
                    <th className="text-left py-4 px-4 font-bold text-charcoal-900 w-48">
                      Category
                    </th>
                    <th className="w-16" />
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-cream-200 hover:bg-cream-50"
                    >
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(item.id, {
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-base border border-cream-300 rounded-lg focus:outline-none focus:border-brand-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.01"
                          value={item.qty}
                          onChange={(e) =>
                            updateLineItem(item.id, {
                              qty: parseFloat(e.target.value) || 1,
                            })
                          }
                          className="w-full px-3 py-2 text-base border border-cream-300 rounded-lg focus:outline-none focus:border-brand-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice ?? ""}
                          onChange={(e) =>
                            updateLineItem(item.id, {
                              unitPrice: e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            })
                          }
                          className="w-full px-3 py-2 text-base border border-cream-300 rounded-lg focus:outline-none focus:border-brand-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) =>
                            updateLineItem(item.id, {
                              amount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 text-base border border-cream-300 rounded-lg focus:outline-none focus:border-brand-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={item.categoryId}
                          onChange={(e) =>
                            updateLineItem(item.id, {
                              categoryId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-base border border-cream-300 rounded-lg focus:outline-none focus:border-brand-600"
                        >
                          <option value="">Select...</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="p-2 hover:bg-danger-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-danger-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {lineItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-charcoal-400 text-lg"
                      >
                        No line items extracted. Add them manually below.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={addLineItem}
              className="flex items-center gap-2 px-6 py-3 bg-brand-100 hover:bg-brand-200 text-brand-700 font-bold rounded-xl text-lg transition-colors"
            >
              <Plus className="w-6 h-6" />
              Add Line Item
            </button>
          </div>

          {/* Raw Text */}
          <div className="bg-white rounded-2xl border-2 border-cream-300 overflow-hidden">
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="w-full flex items-center justify-between p-6 hover:bg-cream-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-charcoal-600" />
                <h3 className="text-xl font-bold text-charcoal-900">
                  Raw Extracted Text
                </h3>
              </div>
              {showRawText ? (
                <ChevronUp className="w-6 h-6 text-charcoal-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-charcoal-600" />
              )}
            </button>
            {showRawText && (
              <div className="px-6 pb-6 border-t-2 border-cream-300">
                <pre className="bg-charcoal-50 p-4 rounded-xl text-sm text-charcoal-700 max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                  {rawText}
                </pre>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setStep("upload");
                setFile(null);
                setError(null);
              }}
              className="flex-1 py-4 px-8 bg-cream-300 hover:bg-cream-400 text-charcoal-900 text-xl font-bold rounded-xl transition-colors"
            >
              Upload Different File
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-4 px-8 bg-brand-600 hover:bg-brand-700 disabled:bg-cream-300 disabled:cursor-not-allowed text-white text-xl font-bold rounded-xl transition-colors flex items-center justify-center gap-3"
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
      )}
    </div>
  );
}
