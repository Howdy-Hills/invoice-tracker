import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-4xl">
      <PageHeaderSkeleton />

      {/* Org name section */}
      <div className="bg-white rounded-2xl border border-charcoal-100 p-6 mb-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-11 w-72 rounded-xl" />
      </div>

      {/* Members section */}
      <div className="bg-white rounded-2xl border border-charcoal-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-6 w-16 rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
