import { getCurrentUser } from "@/lib/auth";
import { getVendorDetail } from "@/queries/vendors";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { VendorDetailClient } from "./vendor-detail-client";

interface VendorPageProps {
  params: Promise<{ id: string }>;
}

export default async function VendorPage({ params }: VendorPageProps) {
  const { id } = await params;
  const { orgId } = await getCurrentUser();

  const vendor = await getVendorDetail(orgId, id);
  if (!vendor) notFound();

  // Get categories for default category dropdown
  const categories = await prisma.budgetCategory.findMany({
    where: { orgId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-8 h-8 text-brand-600" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900">
            {vendor.name}
          </h1>
          {vendor.email && (
            <p className="text-xl text-charcoal-600 mt-1">{vendor.email}</p>
          )}
        </div>
      </div>

      <VendorDetailClient
        vendor={vendor}
        categories={categories}
      />
    </div>
  );
}
