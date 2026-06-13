import { EmptyState } from "@/components/common/empty-state";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <EmptyState
        title="Login route scaffolded"
        description="Email/password auth will connect through Supabase with validation, error messaging, and loading button state."
      />
    </main>
  );
}
