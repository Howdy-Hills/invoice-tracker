import { getCurrentUser, getOrgName } from "@/lib/auth";
import { getProjects } from "@/queries/projects";
import { getSelectedProjectId } from "@/lib/project-context";
import { AppShell } from "./app-shell";
import { RoleProvider } from "@/components/layout/role-context";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { orgId, role } = await getCurrentUser();
  const [orgName, projects, selectedProjectId] = await Promise.all([
    getOrgName(orgId),
    getProjects(orgId),
    getSelectedProjectId(),
  ]);

  const projectsForSelector = projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
  }));

  return (
    <RoleProvider role={role}>
      <AppShell
        orgName={orgName}
        projects={projectsForSelector}
        selectedProjectId={selectedProjectId}
      >
        {children}
      </AppShell>
    </RoleProvider>
  );
}
