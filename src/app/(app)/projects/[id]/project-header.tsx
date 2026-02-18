"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProject, archiveProject, deleteProject } from "@/actions/projects";
import { PROJECT_STATUSES } from "@/lib/constants";
import {
  ArrowLeft,
  Pencil,
  Check,
  X,
  Loader2,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";

interface ProjectHeaderProps {
  project: {
    id: string;
    name: string;
    clientName: string | null;
    description: string | null;
    status: string;
  };
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const statusConfig = PROJECT_STATUSES.find(
    (s) => s.value === project.status
  ) ?? { label: project.status, color: "bg-charcoal-100 text-charcoal-600" };

  async function handleSave(formData: FormData) {
    setSaving(true);
    setError(null);
    const result = await updateProject(project.id, formData);
    if (result.errors) setError(result.errors.general);
    else setEditing(false);
    setSaving(false);
  }

  async function handleStatusChange(newStatus: string) {
    const fd = new FormData();
    fd.set("status", newStatus);
    await updateProject(project.id, fd);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteProject(project.id);
    if (result.errors) {
      setError(result.errors.general);
      setDeleting(false);
    } else {
      router.push("/projects");
    }
  }

  async function handleArchive() {
    await archiveProject(project.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-charcoal-500 hover:text-charcoal-700 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        All Projects
      </Link>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {editing ? (
        <form
          action={handleSave}
          className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Project Name
            </label>
            <input
              name="name"
              type="text"
              defaultValue={project.name}
              required
              className="w-full px-4 py-3 rounded-xl border border-charcoal-200 bg-cream-50 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Client Name
            </label>
            <input
              name="clientName"
              type="text"
              defaultValue={project.clientName ?? ""}
              className="w-full px-4 py-3 rounded-xl border border-charcoal-200 bg-cream-50 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={project.description ?? ""}
              className="w-full px-4 py-3 rounded-xl border border-charcoal-200 bg-cream-50 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors min-h-[44px] text-sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-charcoal-200 text-charcoal-600 hover:bg-cream-100 transition-colors min-h-[44px] text-sm"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-charcoal-900">
                  {project.name}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}
                >
                  {statusConfig.label}
                </span>
              </div>
              {project.clientName && (
                <div className="flex items-center gap-2 text-charcoal-500">
                  <User className="w-4 h-4" />
                  {project.clientName}
                </div>
              )}
              {project.description && (
                <p className="text-charcoal-600 mt-2">{project.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-charcoal-600 hover:bg-cream-200 transition-colors min-h-[44px] text-sm font-medium"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>

              {/* Status dropdown */}
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-2 rounded-xl border border-charcoal-200 text-charcoal-700 bg-white text-sm min-h-[44px] cursor-pointer"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Danger zone */}
          <div className="mt-6 pt-4 border-t border-charcoal-100 flex items-center gap-3">
            {project.status !== "archived" && (
              <button
                onClick={handleArchive}
                className="text-charcoal-500 hover:text-charcoal-700 text-sm font-medium transition-colors"
              >
                Archive Project
              </button>
            )}
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-danger-600 text-sm">
                  Delete permanently?
                </span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 bg-danger-600 text-white rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors"
                >
                  {deleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg text-charcoal-500 hover:bg-cream-200 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-danger-500 hover:text-danger-700 text-sm font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Project
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
