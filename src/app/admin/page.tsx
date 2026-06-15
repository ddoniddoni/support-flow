import { EmptyState, EmptyStateAction } from "@/components/common/empty-state";
import { requireServerRole } from "@/features/auth/api/server-auth";

export default async function AdminPage() {
  await requireServerRole(["admin"]);

  return (
    <main className="min-h-screen bg-zinc-100 p-6">
      <div className="mx-auto max-w-6xl">
        <EmptyState
          title="관리자 전용 기능은 운영 현황과 문의 상세에서 제공됩니다"
          description="전체 문의 조회, 담당자 배정, 우선순위 변경, 상태 변경, 활동 로그 확인은 현재 문의 목록과 상세 화면에서 사용할 수 있습니다."
          action={<EmptyStateAction href="/tickets">문의 목록 보기</EmptyStateAction>}
        />
      </div>
    </main>
  );
}
