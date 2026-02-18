"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ToastProvider } from "@/components/ui/toast";

interface Project {
  id: string;
  name: string;
  status: string;
}

interface AppShellProps {
  orgName: string;
  projects: Project[];
  selectedProjectId: string | null;
  children: React.ReactNode;
}

export function AppShell({
  orgName,
  projects,
  selectedProjectId,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-cream-50">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          <Header
            orgName={orgName}
            onMenuClick={() => setSidebarOpen(true)}
            projects={projects}
            selectedProjectId={selectedProjectId}
          />
          <main className="flex-1 p-6 md:p-8 lg:px-10 xl:px-12">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
