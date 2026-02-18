import { getCurrentUser } from "@/lib/auth";
import { getSelectedProjectId } from "@/lib/project-context";
import { getProject } from "@/queries/projects";
import { UploadForm } from "./upload-form";
import { redirect } from "next/navigation";

export default async function UploadPage() {
  const { orgId } = await getCurrentUser();
  const projectId = await getSelectedProjectId();

  if (!projectId) {
    redirect("/invoices");
  }

  const project = await getProject(orgId, projectId);

  if (!project) {
    redirect("/invoices");
  }

  return (
    <div className="w-full">
      <UploadForm
        projectId={project.id}
        projectName={project.name}
        categories={project.budgetCategories || []}
      />
    </div>
  );
}
