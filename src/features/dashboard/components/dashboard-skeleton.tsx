import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="grid gap-5" role="status" aria-label="문의 처리 현황을 불러오는 중">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-4 w-24" /><Skeleton className="mt-3 h-10 w-16" /><Skeleton className="mt-2 h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-6 w-40" />
          <div className="mt-5 grid gap-3">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-20 w-full" />)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5"><Skeleton className="h-5 w-28" /><Skeleton className="mt-4 h-32 w-full" /></div>
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}
