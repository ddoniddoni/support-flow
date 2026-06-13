import { EmptyState } from "@/components/common/empty-state";
import { requireServerRole } from "@/features/auth/api/server-auth";

export default async function AdminPage() {
  await requireServerRole(["admin"]);

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <EmptyState
        title="관리자 화면 준비 중"
        description="전체 문의 조회, 상담원 배정, 우선순위 변경, 사용자 관리, 운영 로그 확인 기능을 연결할 예정입니다."
      />
    </main>
  );
}
