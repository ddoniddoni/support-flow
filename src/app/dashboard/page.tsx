import Link from "next/link";

import { EmptyState, EmptyStateAction } from "@/components/common/empty-state";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <EmptyState
        title="Dashboard is ready for Supabase data"
        description="The route is scaffolded for ticket totals, urgent queue health, status distribution, and category distribution."
        action={
          <EmptyStateAction href="/tickets">View ticket routes</EmptyStateAction>
        }
      />
      <Link className="mt-4 inline-block text-sm text-zinc-500" href="/">
        Back to overview
      </Link>
    </main>
  );
}
