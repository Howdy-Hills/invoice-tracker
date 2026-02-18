import { PageHeaderSkeleton, Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function VendorsLoading() {
  return (
    <div className="max-w-6xl">
      <PageHeaderSkeleton />

      <div className="flex gap-4 mb-8">
        <Skeleton className="h-11 w-40 rounded-2xl" />
      </div>

      <div className="mb-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
      </div>

      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
