import { redirect } from "next/navigation";

import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { requireServerProfile } from "@/features/auth/api/server-auth";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export default async function DashboardPage() {
  const profile = await requireServerProfile();

  if (profile.role === "customer") {
    redirect("/tickets");
  }

  return (
    <main className="min-h-screen bg-muted/40">
      <WorkspaceHeader profile={profile} />
      <DashboardView profile={profile} />
    </main>
  );
}
