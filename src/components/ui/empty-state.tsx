import { type LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-charcoal-200 p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-charcoal-50 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-charcoal-400" />
      </div>
      <h3 className="text-xl font-semibold text-charcoal-900 mb-2">{title}</h3>
      <p className="text-lg text-charcoal-500 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-lg"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-lg"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
