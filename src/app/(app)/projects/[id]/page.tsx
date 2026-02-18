import { getCurrentUser } from "@/lib/auth";
import { getProject, getTemplates } from "@/queries/projects";
import { notFound } from "next/navigation";
import { ProjectHeader } from "./project-header";
import { BudgetTable } from "@/components/projects/budget-table";
import { BudgetActions } from "@/components/projects/budget-actions";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await getCurrentUser();
  const [project, templates] = await Promise.all([
    getProject(orgId, id),
    getTemplates(orgId),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="max-w-5xl space-y-8">
      <ProjectHeader project={project} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-charcoal-900">
            Budget Categories
          </h2>
        </div>

        <BudgetActions
          projectId={project.id}
          categoryCount={project.budgetCategories.length}
          templates={templates}
        />

        <BudgetTable
          projectId={project.id}
          categories={project.budgetCategories}
        />
      </div>
    </div>
  );
}
