import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="w-full">
      <PageHeaderSkeleton />

      <Skeleton className="h-11 w-44 rounded-2xl mb-8" />

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-charcoal-100 p-6 flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
