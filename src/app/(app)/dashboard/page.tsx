import { getCurrentUser } from "@/lib/auth";
import { getSelectedProjectId } from "@/lib/project-context";
import { getDashboardData } from "@/queries/dashboard";
import { DashboardEmpty } from "@/components/dashboard/dashboard-empty";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SpendingCharts } from "@/components/dashboard/spending-charts";
import { VendorSummary } from "@/components/dashboard/vendor-summary";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { DashboardViewToggle } from "./dashboard-view-toggle";
import { ExportButtons } from "@/components/exports/export-buttons";
import { OnboardingBanner } from "@/components/dashboard/onboarding-banner";
import { LayoutDashboard } from "lucide-react";

export default async function DashboardPage() {
  const { orgId } = await getCurrentUser();
  const projectId = await getSelectedProjectId();

  if (!projectId) {
    return (
      <div className="max-w-6xl">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-8 h-8 text-brand-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-charcoal-900">Dashboard</h1>
            <p className="text-xl text-charcoal-600 mt-1">
              Overview of your project budget and spending
            </p>
          </div>
        </div>
        <DashboardEmpty />
      </div>
    );
  }

  const data = await getDashboardData(orgId, projectId);

  if (!data) {
    return (
      <div className="max-w-6xl">
        <div className="bg-danger-100 rounded-2xl border border-danger-200 p-8 text-center">
          <p className="text-lg text-danger-600 font-semibold">
            Project not found. Please select a different project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
          <LayoutDashboard className="w-8 h-8 text-brand-600" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900">Dashboard</h1>
          <p className="text-xl text-charcoal-600 mt-1">
            {data.project.name}
            {data.project.clientName && (
              <span className="text-charcoal-400">
                {" "}
                — {data.project.clientName}
              </span>
            )}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {data.project.status !== "active" && (
            <span className="px-4 py-2 rounded-xl bg-charcoal-100 text-charcoal-600 text-base font-semibold">
              {data.project.status.charAt(0).toUpperCase() +
                data.project.status.slice(1)}
            </span>
          )}
          <ExportButtons projectId={projectId} />
        </div>
      </div>

      {/* Onboarding Banner */}
      <OnboardingBanner
        hasInvoices={data.summary.invoiceCount > 0}
        hasCategories={data.categories.length > 0}
      />

      {/* Stats Cards */}
      <StatsCards summary={data.summary} />

      {/* Budget vs. Actual — Table/Chart toggle */}
      <DashboardViewToggle
        categories={data.categories}
        totalBudget={data.summary.totalBudget}
        totalSpent={data.summary.totalSpent}
        totalUncategorized={data.summary.totalUncategorized}
        spendingByMonth={data.spendingByMonth}
      />

      {/* Charts */}
      <SpendingCharts
        categories={data.categories}
        spendingByMonth={data.spendingByMonth}
      />

      {/* Bottom two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VendorSummary vendors={data.vendors} />
        <RecentInvoices invoices={data.recentInvoices} />
      </div>
    </div>
  );
}
