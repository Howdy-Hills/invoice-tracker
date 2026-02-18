import Link from "next/link";
import { FolderKanban, ChevronRight, User, Layers } from "lucide-react";
import { PROJECT_STATUSES } from "@/lib/constants";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    clientName: string | null;
    status: string;
    categoryCount: number;
    createdAt: Date;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusConfig = PROJECT_STATUSES.find(
    (s) => s.value === project.status
  ) ?? { label: project.status, color: "bg-charcoal-100 text-charcoal-600" };

  const isArchived = project.status === "archived";

  return (
    <Link href={`/projects/${project.id}`}>
      <div
        className={`bg-white rounded-2xl border border-charcoal-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all p-6 cursor-pointer group ${
          isArchived ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                isArchived ? "bg-charcoal-100" : "bg-brand-100"
              }`}
            >
              <FolderKanban
                className={`w-5 h-5 ${
                  isArchived ? "text-charcoal-500" : "text-brand-600"
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-charcoal-900 text-lg group-hover:text-brand-600 transition-colors">
                {project.name}
              </h3>
              {project.clientName && (
                <div className="flex items-center gap-1.5 text-charcoal-500 text-sm mt-0.5">
                  <User className="w-3.5 h-3.5" />
                  {project.clientName}
                </div>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-charcoal-300 group-hover:text-brand-500 transition-colors mt-1" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
            <div className="flex items-center gap-1.5 text-charcoal-400 text-sm">
              <Layers className="w-3.5 h-3.5" />
              {project.categoryCount} categories
            </div>
          </div>
          <span className="text-charcoal-400 text-xs">
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
