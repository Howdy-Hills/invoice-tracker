import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ExportsLoading() {
  return (
    <div className="max-w-4xl">
      <PageHeaderSkeleton />

      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-charcoal-100 p-6">
            <Skeleton className="h-6 w-40 mb-3" />
            <Skeleton className="h-4 w-72 mb-4" />
            <Skeleton className="h-11 w-44 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
