import Link from "next/link";

import { EmptyState, EmptyStateAction } from "@/components/common/empty-state";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { requireServerProfile } from "@/features/auth/api/server-auth";

export default async function DashboardPage() {
  const profile = await requireServerProfile();

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">로그인 계정</p>
          <h1 className="text-xl font-semibold text-zinc-950">{profile.name}</h1>
        </div>
        <LogoutButton />
      </div>
      <EmptyState
        title="대시보드 데이터 연결 준비 완료"
        description="전체 문의 수, 긴급 문의 현황, 상태별 분포, 카테고리별 분포를 Supabase 데이터로 보여줄 예정입니다."
        action={
          <EmptyStateAction href="/tickets">문의 내역 보기</EmptyStateAction>
        }
      />
      <Link className="mt-4 inline-block text-sm text-zinc-500" href="/">
        홈으로 돌아가기
      </Link>
    </main>
  );
}
