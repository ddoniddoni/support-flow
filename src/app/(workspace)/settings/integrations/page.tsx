import { redirect } from "next/navigation";

import { requireServerProfile } from "@/features/auth/api/server-auth";
import { IntegrationsSettingsView } from "@/features/operations/components/operations-mock-views";

export default async function IntegrationsPage() {
  const profile = await requireServerProfile();

  if (profile.role === "customer") {
    redirect("/tickets");
  }

  return <IntegrationsSettingsView profile={profile} />;
}
