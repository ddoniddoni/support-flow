import Link from "next/link";
import { ArrowRight, MessageSquareText } from "lucide-react";
import { requireServerRole } from "@/features/auth/api/server-auth";
import { CreateTicketForm } from "@/features/tickets/components/create-ticket-form";

export default async function NewTicketPage() {
  await requireServerRole(["customer"]);
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-medium text-primary">SupportFlow 고객센터</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">무엇을 도와드릴까요?</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">이용 중 궁금한 점이나 불편한 점을 남겨 주세요.<br className="hidden sm:block" /> 지원팀이 내용을 확인하고 답변해 드립니다.</p>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section aria-labelledby="inquiry-heading" className="rounded-2xl border border-border bg-card p-5 sm:p-8">
          <h2 id="inquiry-heading" className="text-xl font-semibold">문의 작성</h2>
          <p className="mb-7 mt-2 text-sm leading-6 text-muted-foreground">아래 항목을 모두 작성해 주세요.</p>
          <CreateTicketForm />
        </section>
        <aside aria-label="문의 안내" className="grid gap-7 lg:pt-2">
          <div>
            <MessageSquareText className="mb-3 size-6 text-primary" aria-hidden="true" />
            <h2 className="text-base font-semibold">답변은 어디서 확인하나요?</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">문의가 접수되면 ‘내 문의’에서 진행 상태와 지원팀의 답변을 확인할 수 있습니다.</p>
            <Link href="/tickets" className="mt-3 inline-flex items-center gap-2 rounded text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-ring">내 문의 확인하기 <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
          <div className="border-t border-border pt-6">
            <h2 className="text-sm font-semibold">이렇게 작성해 주세요</h2>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-6 text-muted-foreground"><li>어떤 상황에서 문제가 발생했는지 알려 주세요.</li><li>오류 메시지가 있다면 함께 적어 주세요.</li><li>비밀번호나 카드번호 전체는 입력하지 마세요.</li></ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
