"use client";

import { useState } from "react";
import { TableProperties, BarChart3 } from "lucide-react";
import { BudgetTable } from "@/components/dashboard/budget-table";
import { BudgetVsActualChart } from "@/components/dashboard/spending-charts";
import type { DashboardData } from "@/queries/dashboard";

interface DashboardViewToggleProps {
  categories: DashboardData["categories"];
  totalBudget: number;
  totalSpent: number;
  totalUncategorized: number;
  spendingByMonth: DashboardData["spendingByMonth"];
}

export function DashboardViewToggle({
  categories,
  totalBudget,
  totalSpent,
  totalUncategorized,
}: DashboardViewToggleProps) {
  const [view, setView] = useState<"table" | "chart">("table");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-charcoal-900">
          Budget vs. Actual
        </h2>
        <div className="flex bg-charcoal-100 rounded-xl p-1">
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-colors ${
              view === "table"
                ? "bg-white text-charcoal-900 shadow-sm"
                : "text-charcoal-500 hover:text-charcoal-700"
            }`}
          >
            <TableProperties className="w-5 h-5" />
            Table
          </button>
          <button
            onClick={() => setView("chart")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-colors ${
              view === "chart"
                ? "bg-white text-charcoal-900 shadow-sm"
                : "text-charcoal-500 hover:text-charcoal-700"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Chart
          </button>
        </div>
      </div>

      {view === "table" ? (
        <BudgetTable
          categories={categories}
          totalBudget={totalBudget}
          totalSpent={totalSpent}
          totalUncategorized={totalUncategorized}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
          <BudgetVsActualChart categories={categories} />
        </div>
      )}
    </div>
  );
}
