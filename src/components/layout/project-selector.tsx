"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { selectProject } from "@/actions/projects";
import { ChevronDown, FolderKanban, Check } from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string | null;
}

export function ProjectSelector({
  projects,
  selectedProjectId,
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const activeProjects = projects.filter((p) => p.status === "active");
  const selected = projects.find((p) => p.id === selectedProjectId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSelect(projectId: string) {
    await selectProject(projectId);
    setOpen(false);
    router.refresh();
  }

  if (activeProjects.length === 0) {
    return (
      <span className="text-charcoal-400 text-sm italic">No projects yet</span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-cream-200 transition-colors min-h-[44px] max-w-[280px]"
      >
        <FolderKanban className="w-4 h-4 text-brand-500 flex-shrink-0" />
        <span className="text-sm font-medium text-charcoal-700 truncate">
          {selected?.name ?? "Select a Project"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-charcoal-400 flex-shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl border border-charcoal-200 shadow-lg z-50 py-1 max-h-80 overflow-y-auto">
          {activeProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleSelect(project.id)}
              className="w-full text-left px-4 py-3 hover:bg-cream-50 transition-colors flex items-center justify-between"
            >
              <span className="font-medium text-charcoal-900 text-sm truncate">
                {project.name}
              </span>
              {project.id === selectedProjectId && (
                <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
