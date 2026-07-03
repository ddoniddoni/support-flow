import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { requireServerProfile } from "@/features/auth/api/server-auth";
import { AIReviewQueueView } from "@/features/ai/components/ai-review-queue-view";

export default async function AIReviewQueuePage() {
  const profile = await requireServerProfile();

  return (
    <main className="min-h-screen bg-muted/40">
      <WorkspaceHeader profile={profile} />
      <AIReviewQueueView profile={profile} />
    </main>
  );
}
