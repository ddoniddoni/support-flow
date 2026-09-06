import type { Tables } from "@/types/database";
import { aiCategories } from "@/types/domain";

import type { TicketAIAnalysisOutput } from "../schemas/ticket-ai-analysis-schema";

const defaultReviewThreshold = 0.7;

const riskTerms = [
  "lawsuit",
  "legal",
  "attorney",
  "lawyer",
  "refund",
  "chargeback",
  "payment dispute",
  "dispute",
  "cancel",
  "cancellation",
  "security",
  "privacy",
  "data breach",
  "breach",
  "fraud",
  "angry",
  "terrible",
  "complaint",
  "again",
  "still broken",
  "환불",
  "환급",
  "취소",
  "해지",
  "탈퇴",
  "결제 취소",
  "청구",
  "이중 결제",
  "두 번 결제",
  "두번 결제",
  "돈 돌려",
  "결제 실패",
  "결제 분쟁",
  "고소",
  "법적",
  "소송",
  "보안",
  "개인정보",
  "유출",
  "해킹",
  "도용",
  "사기",
  "화가",
  "짜증",
  "열받",
  "불만",
  "최악",
  "또",
  "반복",
  "계속 안",
  "업무 중단",
  "사용 불가",
] as const;

export function getAIConfidenceReviewThreshold() {
  const rawValue = process.env.AI_CONFIDENCE_REVIEW_THRESHOLD?.trim();
  if (!rawValue) return defaultReviewThreshold;
  const configuredValue = Number(rawValue);

  if (Number.isFinite(configuredValue) && configuredValue >= 0 && configuredValue <= 1) {
    return configuredValue;
  }

  return defaultReviewThreshold;
}

export function getTicketRiskSignals(ticketText: string) {
  const normalizedText = ticketText.toLowerCase();

  return riskTerms.filter((term) => normalizedText.includes(term));
}

export function isAICategory(value: string): value is TicketAIAnalysisOutput["category"] {
  return aiCategories.some((category) => category === value);
}

export function applyAIReviewRules({
  analysis,
  ticket,
  validationFailed,
}: {
  analysis: TicketAIAnalysisOutput;
  ticket: Pick<Tables<"tickets">, "title" | "content">;
  validationFailed: boolean;
}): TicketAIAnalysisOutput {
  const threshold = getAIConfidenceReviewThreshold();
  const riskSignals = getTicketRiskSignals(`${ticket.title} ${ticket.content}`);
  const reviewReasons = [
    analysis.confidence < threshold
      ? `신뢰도 ${analysis.confidence.toFixed(2)}가 기준값 ${threshold.toFixed(2)}보다 낮습니다.`
      : null,
    analysis.urgency === "critical"
      ? "긴급 검토 수준의 문의라 상담원 확인이 필요합니다."
      : null,
    riskSignals.length ? `위험 신호 감지: ${riskSignals.join(", ")}.` : null,
    validationFailed
      ? "AI 응답 검증에 실패해 기본 분석값을 사용했습니다."
      : null,
    analysis.sentiment === "negative" && analysis.suggestedPriority === "urgent"
      ? "부정 감정과 긴급 우선순위가 함께 감지되어 상담원 확인이 필요합니다."
      : null,
  ].filter((reason): reason is string => Boolean(reason));

  if (!reviewReasons.length) {
    return {
      ...analysis,
      needsReview: analysis.needsReview,
      escalationReason: analysis.needsReview
        ? (analysis.escalationReason ?? "AI 제공자가 검토 필요로 표시했습니다.")
        : analysis.escalationReason,
    };
  }

  return {
    ...analysis,
    needsReview: true,
    escalationReason: reviewReasons.join(" ").slice(0, 500),
  };
}
