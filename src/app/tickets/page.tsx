import { EmptyState, EmptyStateAction } from "@/components/common/empty-state";

export default function TicketsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <EmptyState
        title="Ticket table route scaffolded"
        description="This page is reserved for URL-based search, filters, sort, pagination, table skeletons, and role-aware row actions."
        action={<EmptyStateAction href="/tickets/new">Create ticket</EmptyStateAction>}
      />
    </main>
  );
}
