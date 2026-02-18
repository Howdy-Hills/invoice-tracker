"use client";

import { signOut } from "@/actions/auth";
import { Menu, LogOut } from "lucide-react";
import { ProjectSelector } from "./project-selector";

interface Project {
  id: string;
  name: string;
  status: string;
}

interface HeaderProps {
  orgName: string;
  onMenuClick: () => void;
  projects: Project[];
  selectedProjectId: string | null;
}

export function Header({
  orgName,
  onMenuClick,
  projects,
  selectedProjectId,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-charcoal-100">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: hamburger + org name + project selector */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 rounded-xl hover:bg-cream-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-charcoal-700" />
          </button>
          <h2 className="text-lg font-semibold text-charcoal-800 truncate">
            {orgName}
          </h2>
          <div className="hidden sm:block h-6 w-px bg-charcoal-200" />
          <div className="hidden sm:block">
            <ProjectSelector
              projects={projects}
              selectedProjectId={selectedProjectId}
            />
          </div>
        </div>

        {/* Right: sign out */}
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-charcoal-600 hover:text-charcoal-900 hover:bg-cream-200 transition-colors text-sm font-medium min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
