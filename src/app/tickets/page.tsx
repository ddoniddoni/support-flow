import { EmptyState, EmptyStateAction } from "@/components/common/empty-state";
import { requireServerProfile } from "@/features/auth/api/server-auth";

type TicketsPageProps = {
  searchParams: Promise<{
    created?: string;
  }>;
};

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  await requireServerProfile();

  const params = await searchParams;
  const createdTicketId = params.created;

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto grid max-w-5xl gap-4">
        {createdTicketId ? (
          <div
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            티켓이 등록되었습니다. 접수 번호: {createdTicketId}
          </div>
        ) : null}

        <EmptyState
          title="문의 내역 화면 준비 중"
          description="검색, 필터, 정렬, 페이지네이션을 URL과 연동하고 역할에 맞는 티켓 처리 액션을 제공할 예정입니다."
          action={<EmptyStateAction href="/tickets/new">문의 등록</EmptyStateAction>}
        />
      </div>
    </main>
  );
}
