import { getCurrentUser } from "@/lib/auth";
import { getSelectedProjectId } from "@/lib/project-context";
import { prisma } from "@/lib/prisma";
import { Download } from "lucide-react";
import { ExportsPageClient } from "./exports-client";

export default async function ExportsPage() {
  const { orgId } = await getCurrentUser();
  const projectId = await getSelectedProjectId();

  let projectName: string | null = null;

  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId },
      select: { name: true },
    });
    projectName = project?.name ?? null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
          <Download className="w-8 h-8 text-brand-600" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900">
            Export Reports
          </h1>
          <p className="text-xl text-charcoal-600 mt-1">
            Download formatted Excel spreadsheets
          </p>
        </div>
      </div>

      {!projectId ? (
        <div className="bg-cream-50 rounded-2xl border-2 border-warning-200 p-8">
          <div className="text-center">
            <p className="text-xl text-charcoal-700 font-semibold mb-2">
              Please select a project first
            </p>
            <p className="text-lg text-charcoal-600">
              Choose a project from the sidebar to export reports.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-lg text-charcoal-600 mb-8">
            Project:{" "}
            <span className="font-semibold text-charcoal-900">
              {projectName}
            </span>
          </p>
          <ExportsPageClient projectId={projectId} />
        </div>
      )}
    </div>
  );
}
