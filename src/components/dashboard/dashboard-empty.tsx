import Link from "next/link";
import { LayoutDashboard, FolderPlus } from "lucide-react";

export function DashboardEmpty() {
  return (
    <div className="max-w-2xl mx-auto mt-12">
      <div className="bg-cream-50 rounded-2xl border-2 border-dashed border-brand-200 p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-6">
          <LayoutDashboard className="w-8 h-8 text-brand-600" />
        </div>
        <h2 className="text-2xl font-bold text-charcoal-900 mb-3">
          Select a project to view your dashboard
        </h2>
        <p className="text-lg text-charcoal-500 mb-8">
          Choose a project from the dropdown in the header, or create a new one
          to get started.
        </p>
        <Link
          href="/projects"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-lg h-12"
        >
          <FolderPlus className="w-5 h-5" />
          Create a New Project
        </Link>
      </div>
    </div>
  );
}
