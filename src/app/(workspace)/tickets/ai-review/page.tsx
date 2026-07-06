import { requireServerProfile } from "@/features/auth/api/server-auth";
import { AIReviewQueueView } from "@/features/ai/components/ai-review-queue-view";

export default async function AIReviewQueuePage() {
  const profile = await requireServerProfile();

  return <AIReviewQueueView profile={profile} />;
}
