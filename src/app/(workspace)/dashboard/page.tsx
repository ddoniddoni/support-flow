import { redirect } from "next/navigation";

import { requireServerProfile } from "@/features/auth/api/server-auth";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export default async function DashboardPage() {
  const profile = await requireServerProfile();

  if (profile.role === "customer") {
    redirect("/tickets");
  }

  return <DashboardView profile={profile} />;
}
