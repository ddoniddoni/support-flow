import { Suspense } from "react";
import { requireServerRole } from "@/features/auth/api/server-auth";
import { TemplateManagement } from "@/features/reply-templates/template-management";
export default async function TemplatesPage() {
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
      <TemplateManagement profileId={profile.id} />
    </Suspense>
  );
}
