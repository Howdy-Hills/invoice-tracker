import { getCurrentUser } from "@/lib/auth";
import { getSelectedProjectId } from "@/lib/project-context";
import { getVendorsWithStats, getDuplicateVendors } from "@/queries/vendors";
import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";
import { VendorListClient } from "./vendor-list-client";

export default async function VendorsPage() {
  const { orgId } = await getCurrentUser();
  const projectId = await getSelectedProjectId();

  const [vendors, duplicateGroups, projects] = await Promise.all([
    getVendorsWithStats(orgId, null),
    getDuplicateVendors(orgId),
    prisma.project.findMany({
      where: { orgId, status: "active" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Get all budget categories across all projects for Add Vendor dialog
  const categories = await prisma.budgetCategory.findMany({
    where: { orgId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Deduplicate category names
  const uniqueCategories = Array.from(
    new Map(categories.map((c) => [c.name, c])).values()
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
          <Users className="w-8 h-8 text-brand-600" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900">
            Vendor Directory
          </h1>
          <p className="text-xl text-charcoal-600 mt-1">
            Manage vendor contacts and view spending
          </p>
        </div>
      </div>

      <VendorListClient
        vendors={vendors}
        duplicateCount={duplicateGroups.length}
        projects={projects}
        categories={uniqueCategories}
        currentProjectId={projectId}
      />
    </div>
  );
}
