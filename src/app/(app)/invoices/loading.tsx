import { PageHeaderSkeleton, Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function InvoicesLoading() {
  return (
    <div className="max-w-6xl">
      <PageHeaderSkeleton />

      {/* Action buttons */}
      <div className="flex gap-4 mb-8">
        <Skeleton className="h-11 w-44 rounded-2xl" />
        <Skeleton className="h-11 w-44 rounded-2xl" />
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-3 flex-wrap">
        <Skeleton className="h-10 w-20 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
        <div className="ml-auto flex gap-3">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}
