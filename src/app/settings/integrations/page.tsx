import { redirect } from "next/navigation";

import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { requireServerProfile } from "@/features/auth/api/server-auth";
import { IntegrationsSettingsView } from "@/features/operations/components/operations-mock-views";

export default async function IntegrationsPage() {
  const profile = await requireServerProfile();

  if (profile.role === "customer") {
    redirect("/tickets");
  }

  return (
    <main className="min-h-screen bg-background sf-workspace-main">
      <WorkspaceHeader profile={profile} />
      <IntegrationsSettingsView profile={profile} />
    </main>
  );
}
