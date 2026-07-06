import { requireServerRole } from "@/features/auth/api/server-auth";
import { AgentManagementView } from "@/features/admin/components/agent-management-view";

export default async function AdminAgentsPage() {
  const profile = await requireServerRole(["admin"]);

  return <AgentManagementView profile={profile} />;
}
