import { redirect } from "next/navigation";

import { requireServerProfile } from "@/features/auth/api/server-auth";
import { FlowBoardView } from "@/features/operations/components/flow-board-view";

export default async function FlowBoardPage() {
  const profile = await requireServerProfile();

  if (profile.role === "customer") {
    redirect("/tickets");
  }

  return <FlowBoardView profile={profile} />;
}
