import { EmptyState } from "@/components/common/empty-state";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <EmptyState
        title={`Ticket ${id} detail route scaffolded`}
        description="This page is reserved for metadata, replies, internal notes, activity logs, assignment, and status changes."
      />
    </main>
  );
}
