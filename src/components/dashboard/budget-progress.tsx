interface BudgetProgressProps {
  budgeted: number;
  spent: number;
  showLabel?: boolean;
}

export function BudgetProgress({
  budgeted,
  spent,
  showLabel = true,
}: BudgetProgressProps) {
  if (budgeted <= 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-4 rounded-full bg-charcoal-100" />
        {showLabel && (
          <span className="text-sm text-charcoal-400 whitespace-nowrap">
            No budget
          </span>
        )}
      </div>
    );
  }

  const percent = (spent / budgeted) * 100;
  const widthPercent = Math.min(percent, 100);
  const isOver = percent > 100;

  let barColor = "bg-success-500"; // green < 75%
  if (percent >= 90) {
    barColor = "bg-danger-500";
  } else if (percent >= 75) {
    barColor = "bg-warning-500";
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-4 rounded-full bg-charcoal-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={`text-sm font-semibold whitespace-nowrap ${
            isOver ? "text-danger-600" : "text-charcoal-600"
          }`}
        >
          {Math.round(percent)}%
          {isOver && (
            <span className="ml-1 px-1.5 py-0.5 bg-danger-100 text-danger-600 text-xs rounded-md font-bold">
              OVER
            </span>
          )}
        </span>
      )}
    </div>
  );
}
