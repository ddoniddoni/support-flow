import { redirect } from "next/navigation";

import { requireServerProfile } from "@/features/auth/api/server-auth";
import { AutomationRulesView } from "@/features/operations/components/operations-mock-views";

export default async function AutomationsPage() {
  const profile = await requireServerProfile();

  if (profile.role === "customer") {
    redirect("/tickets");
  }

  return <AutomationRulesView profile={profile} />;
}
