import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { requireServerProfile } from "@/features/auth/api/server-auth";
import { TicketDetailView } from "@/features/tickets/components/ticket-detail-view";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireServerProfile();
  const { id } = await params;

  return (
    <main className="min-h-screen bg-zinc-100 p-6">
      <WorkspaceHeader profile={profile} />
      <TicketDetailView ticketId={id} profile={profile} />
    </main>
  );
}
