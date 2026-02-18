"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import type { DashboardData } from "@/queries/dashboard";

interface SpendingChartsProps {
  categories: DashboardData["categories"];
  spendingByMonth: DashboardData["spendingByMonth"];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-charcoal-200 shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-charcoal-900 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function MonthTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-charcoal-200 shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-charcoal-900 mb-1">{label}</p>
      <p className="text-sm text-brand-600">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export function BudgetVsActualChart({
  categories,
}: {
  categories: DashboardData["categories"];
}) {
  const chartData = categories
    .filter((c) => c.budgeted > 0 || c.spent > 0)
    .map((c) => ({
      name: c.name.length > 14 ? c.name.slice(0, 12) + "..." : c.name,
      fullName: c.name,
      Budgeted: c.budgeted,
      Actual: c.spent,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-charcoal-400">
        No budget data to chart
      </div>
    );
  }

  const useHorizontal = chartData.length > 8;

  if (useHorizontal) {
    return (
      <ResponsiveContainer width="100%" height={chartData.length * 50 + 60}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e2de" />
          <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 13 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="Budgeted" fill="#6b7280" radius={[0, 4, 4, 0]} />
          <Bar dataKey="Actual" fill="#d97706" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e2de" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          angle={-30}
          textAnchor="end"
          height={60}
        />
        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="Budgeted" fill="#6b7280" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Actual" fill="#d97706" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SpendingOverTimeChart({
  spendingByMonth,
}: {
  spendingByMonth: DashboardData["spendingByMonth"];
}) {
  if (!spendingByMonth || spendingByMonth.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-charcoal-400 text-base">
        No date data available yet. Add invoice dates to see spending trends.
      </div>
    );
  }

  const chartData = spendingByMonth.map((item) => ({
    month: item.month,
    Amount: item.amount,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e2de" />
        <XAxis dataKey="month" tick={{ fontSize: 13 }} />
        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<MonthTooltip />} />
        <Area
          type="monotone"
          dataKey="Amount"
          stroke="#d97706"
          fill="#fef3c7"
          strokeWidth={3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SpendingCharts({ categories, spendingByMonth }: SpendingChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
        <h3 className="text-xl font-bold text-charcoal-900 mb-4">
          Budget vs. Actual
        </h3>
        <BudgetVsActualChart categories={categories} />
      </div>
      <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
        <h3 className="text-xl font-bold text-charcoal-900 mb-4">
          Spending Over Time
        </h3>
        <SpendingOverTimeChart spendingByMonth={spendingByMonth} />
      </div>
    </div>
  );
}
