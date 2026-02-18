import { STATUS_CONFIG, type InvoiceStatus } from "@/lib/constants";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as InvoiceStatus] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    bg: "bg-charcoal-100",
    text: "text-charcoal-700",
    border: "border-charcoal-200",
  };

  const sizeClasses =
    size === "sm"
      ? "px-2.5 py-1 text-sm"
      : "px-4 py-2 text-base";

  return (
    <span
      className={`inline-block rounded-xl border font-semibold ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
}
