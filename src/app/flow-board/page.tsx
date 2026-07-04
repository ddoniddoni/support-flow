import { redirect } from "next/navigation";

import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { requireServerProfile } from "@/features/auth/api/server-auth";
import { FlowBoardView } from "@/features/operations/components/operations-mock-views";

export default async function FlowBoardPage() {
  const profile = await requireServerProfile();

  if (profile.role === "customer") {
    redirect("/tickets");
  }

  return (
    <main className="min-h-screen bg-background sf-workspace-main">
      <WorkspaceHeader profile={profile} />
      <FlowBoardView profile={profile} />
    </main>
  );
}
