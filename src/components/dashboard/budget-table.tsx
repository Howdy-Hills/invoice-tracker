import { formatCurrency } from "@/lib/format";
import { BudgetProgress } from "./budget-progress";
import { AlertTriangle } from "lucide-react";
import type { DashboardData } from "@/queries/dashboard";

interface BudgetTableProps {
  categories: DashboardData["categories"];
  totalBudget: number;
  totalSpent: number;
  totalUncategorized: number;
}

export function BudgetTable({
  categories,
  totalBudget,
  totalSpent,
  totalUncategorized,
}: BudgetTableProps) {
  if (categories.length === 0) {
    return (
      <div className="bg-cream-50 rounded-2xl border-2 border-dashed border-brand-200 p-8 text-center">
        <p className="text-lg font-semibold text-charcoal-700 mb-2">
          No budget categories set up
        </p>
        <p className="text-base text-charcoal-500">
          Go to your project settings and load default construction categories
          to start tracking.
        </p>
      </div>
    );
  }

  const totalRemaining = totalBudget - totalSpent;
  const totalPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div>
      <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-charcoal-100 bg-cream-50">
                <th className="text-left px-6 py-4 font-semibold text-charcoal-700">
                  Category
                </th>
                <th className="text-right px-6 py-4 font-semibold text-charcoal-700">
                  Budgeted
                </th>
                <th className="text-right px-6 py-4 font-semibold text-charcoal-700">
                  Spent
                </th>
                <th className="text-right px-6 py-4 font-semibold text-charcoal-700">
                  Remaining
                </th>
                <th className="px-6 py-4 font-semibold text-charcoal-700 min-w-[200px]">
                  % Used
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-charcoal-50 hover:bg-cream-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-charcoal-900">
                    {cat.name}
                    {cat.lineItemCount > 0 && (
                      <span className="ml-2 text-sm text-charcoal-400">
                        ({cat.lineItemCount} items)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-charcoal-700 tabular-nums">
                    {formatCurrency(cat.budgeted)}
                  </td>
                  <td className="px-6 py-4 text-right text-charcoal-900 font-semibold tabular-nums">
                    {formatCurrency(cat.spent)}
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-semibold tabular-nums ${
                      cat.remaining < 0 ? "text-danger-600" : "text-charcoal-700"
                    }`}
                  >
                    {cat.remaining < 0 ? "-" : ""}
                    {formatCurrency(Math.abs(cat.remaining))}
                  </td>
                  <td className="px-6 py-4">
                    <BudgetProgress
                      budgeted={cat.budgeted}
                      spent={cat.spent}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-charcoal-50 border-t-2 border-charcoal-200">
                <td className="px-6 py-4 font-bold text-charcoal-900 text-lg">
                  TOTAL
                </td>
                <td className="px-6 py-4 text-right font-bold text-charcoal-900 text-lg tabular-nums">
                  {formatCurrency(totalBudget)}
                </td>
                <td className="px-6 py-4 text-right font-bold text-charcoal-900 text-lg tabular-nums">
                  {formatCurrency(totalSpent)}
                </td>
                <td
                  className={`px-6 py-4 text-right font-bold text-lg tabular-nums ${
                    totalRemaining < 0 ? "text-danger-600" : "text-charcoal-900"
                  }`}
                >
                  {totalRemaining < 0 ? "-" : ""}
                  {formatCurrency(Math.abs(totalRemaining))}
                </td>
                <td className="px-6 py-4">
                  <BudgetProgress
                    budgeted={totalBudget}
                    spent={totalSpent}
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {totalUncategorized > 0 && (
        <div className="mt-4 bg-warning-100 border border-warning-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-warning-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-base font-semibold text-warning-600">
              {formatCurrency(totalUncategorized)} in uncategorized line items
            </p>
            <p className="text-base text-charcoal-600 mt-1">
              Categorize them from the invoice detail page to see accurate
              budget tracking.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
