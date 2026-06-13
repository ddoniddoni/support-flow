import { EmptyState } from "@/components/common/empty-state";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <EmptyState
        title="Admin route scaffolded"
        description="Admin-only workflows will include all-ticket visibility, assignment, priority changes, user management, and operational logs."
      />
    </main>
  );
}
