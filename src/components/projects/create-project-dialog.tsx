"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/actions/projects";
import { Plus, Loader2, X } from "lucide-react";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await createProject(formData);
    if (result.success && result.projectId) {
      setOpen(false);
      router.push(`/projects/${result.projectId}`);
    } else if (result.errors) {
      setError(result.errors.general);
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors min-h-[48px] text-base"
      >
        <Plus className="w-5 h-5" />
        New Project
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-charcoal-900">
            Create New Project
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg hover:bg-cream-200 transition-colors"
          >
            <X className="w-5 h-5 text-charcoal-500" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Project Name *
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder='e.g., "Smith Kitchen Renovation"'
              className="w-full px-4 py-3 rounded-xl border border-charcoal-200 bg-cream-50 text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Client Name
            </label>
            <input
              name="clientName"
              type="text"
              placeholder="e.g., John Smith"
              className="w-full px-4 py-3 rounded-xl border border-charcoal-200 bg-cream-50 text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Optional project details..."
              className="w-full px-4 py-3 rounded-xl border border-charcoal-200 bg-cream-50 text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-base resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-3 px-4 rounded-xl border border-charcoal-200 text-charcoal-700 font-medium hover:bg-cream-100 transition-colors min-h-[48px] text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px] text-base"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Create Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
