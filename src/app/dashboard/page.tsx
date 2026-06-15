import { requireServerProfile } from "@/features/auth/api/server-auth";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export default async function DashboardPage() {
  const profile = await requireServerProfile();

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <DashboardView profile={profile} />
    </main>
  );
}
