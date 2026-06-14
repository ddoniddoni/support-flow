import { requireServerProfile } from "@/features/auth/api/server-auth";
import { TicketListView } from "@/features/tickets/components/ticket-list-view";

type TicketsPageProps = {
  searchParams: Promise<{
    created?: string;
  }>;
};

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const profile = await requireServerProfile();
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <TicketListView profile={profile} createdTicketId={params.created} />
    </main>
  );
}
