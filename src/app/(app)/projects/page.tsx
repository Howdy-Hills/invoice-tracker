import { getCurrentUser } from "@/lib/auth";
import { getProjects } from "@/queries/projects";
import { ProjectCard } from "@/components/projects/project-card";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { FolderKanban } from "lucide-react";

export default async function ProjectsPage() {
  const { orgId } = await getCurrentUser();
  const projects = await getProjects(orgId);

  const activeProjects = projects.filter((p) => p.status !== "archived");
  const archivedProjects = projects.filter((p) => p.status === "archived");

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
            <FolderKanban className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-charcoal-900">Projects</h1>
            <p className="text-charcoal-500">
              Manage your construction projects
            </p>
          </div>
        </div>
        <CreateProjectDialog />
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-charcoal-400" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal-700 mb-2">
            No projects yet
          </h3>
          <p className="text-charcoal-500 max-w-md mx-auto">
            Create your first project to start tracking invoices and managing
            budgets.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeProjects.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {activeProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          {archivedProjects.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-charcoal-400 uppercase tracking-wide mb-4">
                Archived
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {archivedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
