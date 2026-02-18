import { DollarSign, TrendingUp, Wallet, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { DashboardData } from "@/queries/dashboard";

interface StatsCardsProps {
  summary: DashboardData["summary"];
}

export function StatsCards({ summary }: StatsCardsProps) {
  const remainingColor =
    summary.percentUsed > 80
      ? "text-danger-600"
      : summary.percentUsed > 50
        ? "text-warning-600"
        : "text-success-600";

  const remainingBg =
    summary.percentUsed > 80
      ? "bg-danger-100"
      : summary.percentUsed > 50
        ? "bg-warning-100"
        : "bg-success-100";

  const cards = [
    {
      icon: DollarSign,
      iconBg: "bg-brand-100",
      iconColor: "text-brand-600",
      label: "Total Budget",
      value: formatCurrency(summary.totalBudget),
      subtitle: summary.totalBudget > 0
        ? `across all categories`
        : "No budget set",
      subtitleColor: "text-charcoal-500",
    },
    {
      icon: TrendingUp,
      iconBg: "bg-brand-100",
      iconColor: "text-brand-600",
      label: "Total Spent",
      value: formatCurrency(summary.totalSpent),
      subtitle: summary.totalBudget > 0
        ? `${Math.round(summary.percentUsed)}% of budget`
        : "—",
      subtitleColor: "text-charcoal-500",
    },
    {
      icon: Wallet,
      iconBg: remainingBg,
      iconColor: remainingColor,
      label: "Remaining",
      value: formatCurrency(summary.remaining),
      subtitle: summary.remaining < 0
        ? "Over budget!"
        : summary.totalBudget > 0
          ? `${Math.round(100 - summary.percentUsed)}% left`
          : "—",
      subtitleColor: remainingColor,
    },
    {
      icon: FileText,
      iconBg: "bg-brand-100",
      iconColor: "text-brand-600",
      label: "Invoices",
      value: `${summary.invoiceCount} total`,
      subtitle: summary.pendingCount > 0
        ? `${summary.pendingCount} pending review`
        : "All reviewed",
      subtitleColor: summary.pendingCount > 0
        ? "text-warning-600"
        : "text-success-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}
            >
              <card.icon className={`w-6 h-6 ${card.iconColor}`} />
            </div>
            <p className="text-base font-medium text-charcoal-500">
              {card.label}
            </p>
          </div>
          <p className="text-2xl font-bold text-charcoal-900 mb-1">
            {card.value}
          </p>
          <p className={`text-base ${card.subtitleColor}`}>{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
