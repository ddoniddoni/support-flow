import { EmptyState, EmptyStateAction } from "@/components/common/empty-state";

export default function TicketsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <EmptyState
        title="문의 내역 화면 준비 중"
        description="검색, 필터, 정렬, 페이지네이션을 URL과 연동하고 역할에 맞는 문의 처리 액션을 제공할 예정입니다."
        action={<EmptyStateAction href="/tickets/new">문의 등록</EmptyStateAction>}
      />
    </main>
  );
}
