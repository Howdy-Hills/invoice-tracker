import { getCurrentUser } from "@/lib/auth";
import { getSelectedProjectId } from "@/lib/project-context";
import { getProject } from "@/queries/projects";
import { ManualEntryForm } from "./manual-entry-form";
import { redirect } from "next/navigation";

export default async function ManualEntryPage() {
  const { orgId } = await getCurrentUser();
  const projectId = await getSelectedProjectId();
  if (!projectId) redirect("/invoices");
  const project = await getProject(orgId, projectId);
  if (!project) redirect("/invoices");

  return (
    <div className="max-w-6xl mx-auto">
      <ManualEntryForm
        projectId={project.id}
        projectName={project.name}
        categories={project.budgetCategories || []}
      />
    </div>
  );
}
