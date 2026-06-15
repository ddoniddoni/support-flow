import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-6xl">
        <DashboardSkeleton />
      </div>
    </main>
  );
}
