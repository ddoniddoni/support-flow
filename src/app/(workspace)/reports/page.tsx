import { redirect } from "next/navigation";

import { requireServerProfile } from "@/features/auth/api/server-auth";
import { ReportsView } from "@/features/operations/components/operations-mock-views";

export default async function ReportsPage() {
  const profile = await requireServerProfile();

  if (profile.role === "customer") {
    redirect("/tickets");
  }

  return <ReportsView profile={profile} />;
}
