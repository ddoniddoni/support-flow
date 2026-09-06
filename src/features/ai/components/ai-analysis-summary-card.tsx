import { Badge } from "@/components/ui/badge";
import type { TicketAIAnalysis } from "@/features/ai/types";
import { HeartPulse, Siren, Gauge } from "lucide-react";
import { SignalCard } from "@/components/common/signal-card";
import type { AISentiment, AIUrgency, TicketPriority, TicketStatus } from "@/types/domain";

import { formatAIVisibleText } from "../utils/ai-display-text";

const sentimentLabels: Record<AISentiment, string> = {
  positive: "긍정",
  neutral: "중립",
  negative: "부정",
};

const urgencyLabels: Record<AIUrgency, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  critical: "긴급 검토",
};

const priorityLabels: Record<TicketPriority, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
};

const statusLabels: Record<TicketStatus, string> = {
  open: "답변 대기",
  in_progress: "답변 대기",
  resolved: "답변 완료",
  closed: "종료",
};

const categoryLabels: Record<string, string> = {
  technical: "기술 지원",
  billing: "결제",
  account: "계정",
  product: "제품",
  shipping: "배송",
  refund: "환불",
  complaint: "불만",
  other: "기타",
};

const intentLabels: Record<string, string> = {
  question: "문의",
  complaint: "불만",
  refund_request: "환불 요청",
  "refund-request": "환불 요청",
  bug_report: "오류 신고",
  "bug-report": "오류 신고",
  account_help: "계정 지원",
  "account-help": "계정 지원",
  billing_issue: "결제 문제",
  "billing-issue": "결제 문제",
  cancellation_request: "해지 요청",
  "cancellation-request": "해지 요청",
  feature_request: "기능 요청",
  "feature-request": "기능 요청",
  praise: "긍정 피드백",
  other: "기타",
};

const tagLabels: Record<string, string> = {
  technical: "기술 지원",
  billing: "결제",
  account: "계정",
  product: "제품",
  shipping: "배송",
  refund: "환불",
  complaint: "불만",
  other: "기타",
  question: "문의",
  "refund-request": "환불 요청",
  "bug-report": "오류 신고",
  "account-help": "계정 지원",
  "billing-issue": "결제 문제",
  "cancellation-request": "해지 요청",
  "feature-request": "기능 요청",
  "priority-review": "검토 필요",
  "repeat-contact": "반복 문의",
  "needs-human-review": "검토 필요",
  vip: "VIP",
};

function formatCategory(value: string) {
  return categoryLabels[value] ?? value;
}

function formatIntent(value: string) {
  return intentLabels[value] ?? value;
}

function formatTag(value: string) {
  return tagLabels[value] ?? value;
}

export function AIAnalysisSummaryCard({
  analysis,
}: {
  analysis: TicketAIAnalysis;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3" aria-label="AI 분석 지표">
        <SignalCard label="고객 감정 · AI 추정" value={sentimentLabels[analysis.sentiment]} icon={HeartPulse} tone={analysis.sentiment === "negative" ? "danger" : analysis.sentiment === "positive" ? "success" : "neutral"} description={analysis.sentiment === "negative" ? "불편한 점을 먼저 확인해 주세요" : "고객 원문과 함께 확인해 주세요"} />
        <SignalCard label="긴급도 · AI 추정" value={urgencyLabels[analysis.urgency]} icon={Siren} tone={analysis.urgency === "critical" ? "danger" : analysis.urgency === "high" ? "warning" : "neutral"} description="실제 우선순위와는 별도인 제안입니다" />
        <SignalCard label="분석 신뢰도" value={`${Math.round(analysis.confidence * 100)}%`} icon={Gauge} tone={analysis.needs_review ? "warning" : "neutral"} description={analysis.needs_review ? "상담원의 검토가 필요합니다" : "고객 원문과 대조해 판단해 주세요"} />
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-semibold text-foreground">
          핵심 요약
        </p>
        <p className="max-w-[72ch] whitespace-pre-wrap break-words text-base leading-7 text-foreground">{analysis.summary}</p>
      </div>

      <details className="border-t border-border pt-3">
        <summary className="cursor-pointer rounded text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">판단 근거와 분류 상세</summary>
        <div className="mt-3 grid gap-4">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-foreground">
          판단 근거
        </p>
        <p className="max-w-[72ch] whitespace-pre-wrap break-words text-[15px] leading-7 text-muted-foreground">
          {formatAIVisibleText(analysis.reason)}
        </p>
      </div>

      <div className="grid gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">분류</span>
          <span className="font-medium text-foreground">
            {formatCategory(analysis.category)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">의도</span>
          <span className="font-medium text-foreground">
            {formatIntent(analysis.intent)}
          </span>
        </div>
        {analysis.suggested_priority ? (
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">제안 우선순위</span>
            <span className="font-medium text-foreground">
              {priorityLabels[analysis.suggested_priority]}
            </span>
          </div>
        ) : null}
        {analysis.suggested_status ? (
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">제안 답변 상태</span>
            <span className="font-medium text-foreground">
              {statusLabels[analysis.suggested_status]}
            </span>
          </div>
        ) : null}
      </div>

      {analysis.tags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {analysis.tags.map((tag, index) => (
            <Badge key={`${tag}-${index}`} variant="secondary">
              {formatTag(tag)}
            </Badge>
          ))}
        </div>
      ) : null}
        </div>
      </details>
    </div>
  );
}
