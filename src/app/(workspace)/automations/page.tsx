import { requireServerRole } from "@/features/auth/api/server-auth";
import { getAIConfidenceReviewThreshold } from "@/features/ai/utils/ai-review-rules";
import { AutomationRulesView } from "@/features/operations/components/automation-rules-view";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/service-role";

export default async function AutomationsPage() {
  await requireServerRole(["admin", "agent"]);
  return <AutomationRulesView enabled={hasSupabaseServiceRoleKey() && (!process.env.AI_PROVIDER || process.env.AI_PROVIDER === "mock")}
    threshold={getAIConfidenceReviewThreshold()} />;
}
