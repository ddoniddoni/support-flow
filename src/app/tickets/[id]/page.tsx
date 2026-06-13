import { EmptyState } from "@/components/common/empty-state";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <EmptyState
        title={`문의 ${id} 상세 화면 준비 중`}
        description="문의 정보, 고객 답변, 내부 메모, 활동 로그, 담당자 배정, 상태 변경 기능을 연결할 예정입니다."
      />
    </main>
  );
}
