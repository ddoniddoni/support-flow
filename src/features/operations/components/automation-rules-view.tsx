import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export function AutomationRulesView({ enabled, threshold }: { enabled: boolean; threshold: number }) {
  const rules = [
    { name: "문의 접수 시 자동 분석", trigger: "고객이 새 문의를 등록하면 실행", action: "문의 유형·감정·긴급도를 분류하고 요약과 답변 초안을 만듭니다.", status: enabled ? "사용 중" : "꺼짐" },
    { name: "위험 신호 검토", trigger: "환불·해지·보안·개인정보·법적 분쟁 등 위험 신호 감지", action: "최신 분석을 AI 검토 큐에 표시합니다. 우선순위와 담당자는 자동 변경하지 않습니다.", status: "분석 시 적용" },
    { name: "낮은 신뢰도 검토", trigger: `분석 신뢰도 ${Math.round(threshold * 100)}% 미만 또는 분석 형식 검증 실패`, action: "사람이 분석 내용을 확인하고 수정할 수 있도록 검토 대상으로 표시합니다.", status: "분석 시 적용" },
    { name: "고객 답변 완료", trigger: "상담원이 고객 공개 답변을 제출", action: "답변 대기 문의를 답변 완료로 변경하고 활동 이력을 함께 저장합니다. 내부 메모는 상태를 변경하지 않습니다.", status: "사용 중" },
  ];
  return <div className="mx-auto grid max-w-[1600px] gap-4 px-3 py-4 sm:px-4 lg:px-6">
    <div><h1 className="text-xl font-semibold">자동화</h1><p className="mt-1 text-sm text-muted-foreground">현재 적용되는 업무 규칙입니다. AI 초안은 상담원이 검토하고 제출해야 고객에게 전달됩니다.</p></div>
    {!enabled ? <p role="status" className="rounded-lg border bg-muted/40 p-4 text-sm">접수 시 자동 분석이 꺼져 있습니다. 상담원은 문의 상세에서 분석을 직접 실행할 수 있습니다.</p> : null}
    <div className="grid gap-4 lg:grid-cols-2">{rules.map(rule => <section key={rule.name} className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3"><h2 className="font-semibold">{rule.name}</h2><Badge variant="secondary">{rule.status}</Badge></div>
      <p className="mt-4 text-sm font-medium">{rule.trigger}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{rule.action}</p>
    </section>)}</div>
    <div><Link href="/tickets/ai-review" className={buttonVariants({ variant: "outline" })}>AI 검토 큐 보기</Link></div>
  </div>;
}
