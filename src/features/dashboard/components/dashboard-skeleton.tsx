import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border bg-white p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-8 w-16" />
            <Skeleton className="mt-3 h-4 w-40" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border bg-white p-5">
          <Skeleton className="h-5 w-40" />
          <div className="mt-5 grid gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="grid gap-5">
          <div className="rounded-lg border bg-white p-5">
            <Skeleton className="h-5 w-32" />
            <div className="mt-5 grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-white p-5">
            <Skeleton className="h-5 w-32" />
            <div className="mt-5 grid gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
