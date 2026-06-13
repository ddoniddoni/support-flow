import { EmptyState } from "@/components/common/empty-state";

export default function NewTicketPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <EmptyState
        title="문의 등록 화면 준비 중"
        description="React Hook Form과 Zod로 입력값을 검증하고, 제출 중 버튼 비활성화와 성공/오류 피드백을 제공할 예정입니다."
      />
    </main>
  );
}
