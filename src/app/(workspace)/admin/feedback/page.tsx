import { Suspense } from "react";
import { requireServerRole } from "@/features/auth/api/server-auth";
import { FeedbackOverview } from "@/features/feedback/feedback-overview";
export default async function FeedbackPage() {
  const profile = await requireServerRole(["admin"]);
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="m-6 h-48 animate-pulse rounded-xl bg-muted"
          aria-label="화면 불러오는 중"
        />
      }
    >
      <FeedbackOverview profileId={profile.id} />
    </Suspense>
  );
}
