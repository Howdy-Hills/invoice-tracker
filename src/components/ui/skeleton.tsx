import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-charcoal-100",
        className
      )}
    />
  );
}

/** Page header skeleton with icon + title + subtitle */
export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center gap-4 mb-10">
      <Skeleton className="w-16 h-16 rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
    </div>
  );
}

/** Card skeleton for stats / summary cards */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-charcoal-100 p-6", className)}>
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/** Table row skeleton */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-charcoal-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton className={`h-5 ${i === 0 ? "w-32" : i === cols - 1 ? "w-20" : "w-24"}`} />
        </td>
      ))}
    </tr>
  );
}

/** Table skeleton with header + rows */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-charcoal-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-charcoal-100 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
