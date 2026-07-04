import { redirect } from "next/navigation";

import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { requireServerProfile } from "@/features/auth/api/server-auth";
import { ReportsView } from "@/features/operations/components/operations-mock-views";

export default async function ReportsPage() {
  const profile = await requireServerProfile();

  if (profile.role === "customer") {
    redirect("/tickets");
  }

  return (
    <main className="min-h-screen bg-background sf-workspace-main">
      <WorkspaceHeader profile={profile} />
      <ReportsView profile={profile} />
    </main>
  );
}
