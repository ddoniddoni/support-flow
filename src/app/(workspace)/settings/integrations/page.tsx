import { requireServerRole } from "@/features/auth/api/server-auth";
import { IntegrationStatusView } from "@/features/operations/components/integration-status-view";
import { hasSupabaseEnv } from "@/lib/env";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/service-role";

export default async function IntegrationsPage() {
  await requireServerRole(["admin"]);
  const provider = process.env.AI_PROVIDER?.trim() || "mock";
  return <IntegrationStatusView databaseConfigured={hasSupabaseEnv()}
    autoAnalysisEnabled={hasSupabaseServiceRoleKey() && provider === "mock"} provider={provider} />;
}
