import { EmptyState } from "@/components/common/empty-state";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <EmptyState
        title="Signup route scaffolded"
        description="Signup will collect name, email, and password while role creation remains controlled through seed data or admin flows."
      />
    </main>
  );
}
