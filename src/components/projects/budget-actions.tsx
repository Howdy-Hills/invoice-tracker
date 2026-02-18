"use client";

import { useState } from "react";
import { loadDefaultBudget, saveAsTemplate, loadTemplate } from "@/actions/categories";
import { Loader2, HardHat, Save, FileDown } from "lucide-react";

interface Template {
  id: string;
  name: string;
  _count: { items: number };
}

interface BudgetActionsProps {
  projectId: string;
  categoryCount: number;
  templates: Template[];
}

export function BudgetActions({
  projectId,
  categoryCount,
  templates,
}: BudgetActionsProps) {
  const [loadingDefault, setLoadingDefault] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handleLoadDefault() {
    if (
      categoryCount > 0 &&
      !confirm(
        "This will add 19 construction categories. Existing categories will be kept. Continue?"
      )
    ) {
      return;
    }

    setLoadingDefault(true);
    setError(null);
    const result = await loadDefaultBudget(projectId);
    if (result.errors) setError(result.errors.general);
    else showSuccess("Default construction budget loaded!");
    setLoadingDefault(false);
  }

  async function handleSaveTemplate(formData: FormData) {
    setSavingTemplate(true);
    setError(null);
    const name = formData.get("templateName") as string;
    const result = await saveAsTemplate(projectId, name);
    if (result.errors) setError(result.errors.general);
    else {
      showSuccess(`Template "${name}" saved!`);
      setShowSaveDialog(false);
    }
    setSavingTemplate(false);
  }

  async function handleLoadTemplate(templateId: string) {
    setLoadingTemplate(templateId);
    setError(null);
    const result = await loadTemplate(projectId, templateId);
    if (result.errors) setError(result.errors.general);
    else showSuccess("Template loaded!");
    setLoadingTemplate(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Load Default Budget */}
        <button
          onClick={handleLoadDefault}
          disabled={loadingDefault}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-brand-200 text-brand-700 hover:bg-brand-50 font-medium transition-colors min-h-[44px] text-sm"
        >
          {loadingDefault ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <HardHat className="w-4 h-4" />
          )}
          Load Default Construction Budget
        </button>

        {/* Save as Template */}
        {categoryCount > 0 && (
          <>
            {showSaveDialog ? (
              <form
                action={handleSaveTemplate}
                className="flex items-center gap-2"
              >
                <input
                  name="templateName"
                  type="text"
                  required
                  placeholder="Template name..."
                  autoFocus
                  className="px-3 py-2.5 rounded-lg border border-charcoal-200 bg-cream-50 text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm w-48"
                />
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="px-3 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-sm min-h-[44px]"
                >
                  {savingTemplate ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveDialog(false)}
                  className="px-3 py-2.5 rounded-lg text-charcoal-500 hover:bg-cream-200 transition-colors text-sm min-h-[44px]"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-charcoal-200 text-charcoal-700 hover:bg-cream-100 font-medium transition-colors min-h-[44px] text-sm"
              >
                <Save className="w-4 h-4" />
                Save as Template
              </button>
            )}
          </>
        )}

        {/* Load from Template */}
        {templates.length > 0 && (
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-charcoal-200 text-charcoal-700 hover:bg-cream-100 font-medium transition-colors min-h-[44px] text-sm">
              <FileDown className="w-4 h-4" />
              Load from Template
            </button>
            <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl border border-charcoal-200 shadow-lg z-20 hidden group-focus-within:block group-hover:block">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleLoadTemplate(t.id)}
                  disabled={loadingTemplate === t.id}
                  className="w-full text-left px-4 py-3 hover:bg-cream-50 transition-colors flex items-center justify-between first:rounded-t-xl last:rounded-b-xl text-sm"
                >
                  <span className="font-medium text-charcoal-900">
                    {t.name}
                  </span>
                  <span className="text-charcoal-400 text-xs">
                    {loadingTemplate === t.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      `${t._count.items} categories`
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-2 rounded-xl text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-2 rounded-xl text-sm">
          {successMsg}
        </div>
      )}
    </div>
  );
}
