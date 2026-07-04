import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { requireServerRole } from "@/features/auth/api/server-auth";
import { AgentManagementView } from "@/features/admin/components/agent-management-view";

export default async function AdminAgentsPage() {
  const profile = await requireServerRole(["admin"]);

  return (
    <main className="min-h-screen bg-background sf-workspace-main">
      <WorkspaceHeader profile={profile} />
      <AgentManagementView profile={profile} />
    </main>
  );
}
