import Link from "next/link";

import { EmptyState, EmptyStateAction } from "@/components/common/empty-state";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6">
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
