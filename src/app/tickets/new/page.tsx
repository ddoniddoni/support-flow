import { EmptyState } from "@/components/common/empty-state";

export default function NewTicketPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <EmptyState
        title="New ticket form route scaffolded"
        description="Build this with React Hook Form, Zod validation, disabled pending submits, and success/error feedback."
      />
    </main>
  );
}
