import type { TicketPriority } from "@/types/domain";

import type { TicketAIAnalysisOutput } from "../schemas/ticket-ai-analysis-schema";
import type { AIProvider } from "./ai-provider";

const billingTerms = [
  "charge",
  "payment",
  "invoice",
  "billing",
  "paid",
  "결제",
  "청구",
  "영수증",
  "인보이스",
  "카드",
  "카드 승인",
  "결제 실패",
  "이중 결제",
  "두 번 결제",
  "두번 결제",
  "요금",
  "구독",
  "플랜",
  "청구서",
  "세금계산서",
  "미납",
];
const refundTerms = [
  "refund",
  "chargeback",
  "money back",
  "환불",
  "환급",
  "취소 요청",
  "결제 취소",
  "환불 요청",
  "환불해주세요",
  "돈 돌려",
  "돈을 돌려",
  "부분 환불",
];
const technicalTerms = [
  "bug",
  "error",
  "crash",
  "broken",
  "fail",
  "failed",
  "버그",
  "오류",
  "에러",
  "장애",
  "고장",
  "안 됩니다",
  "안돼요",
  "안 돼요",
  "작동하지",
  "멈춤",
  "크래시",
  "접속 안",
  "접속이 안",
  "로그인이 안",
  "화면이 안",
  "저장이 안",
  "업로드",
  "다운로드",
  "로딩",
  "느려요",
  "느립니다",
];
const accountTerms = [
  "login",
  "password",
  "account",
  "profile",
  "signin",
  "로그인",
  "비밀번호",
  "계정",
  "프로필",
  "인증",
  "회원",
  "멤버",
  "초대",
  "권한",
  "이메일 변경",
  "인증번호",
  "2단계",
];
const productTerms = [
  "기능",
  "기능 요청",
  "개선",
  "추가해",
  "추가 요청",
  "지원하나요",
  "가능한가요",
  "한도",
  "제한",
  "연동",
  "업그레이드",
  "다운그레이드",
];
const shippingTerms = [
  "shipping",
  "delivery",
  "package",
  "shipment",
  "배송",
  "배달",
  "택배",
  "출고",
];
const negativeTerms = [
  "angry",
  "terrible",
  "complaint",
  "lawsuit",
  "legal",
  "cancel",
  "unacceptable",
  "frustrated",
  "화가",
  "화나요",
  "화납니다",
  "열받",
  "짜증",
  "최악",
  "불만",
  "불쾌",
  "실망",
  "취소",
  "해지",
  "탈퇴",
  "그만 쓸",
  "고소",
  "법적",
  "말도 안",
  "너무합니다",
];
const positiveTerms = [
  "thanks",
  "thank you",
  "great",
  "helpful",
  "love",
  "감사",
  "감사합니다",
  "고마워",
  "고맙",
  "좋아요",
  "좋았습니다",
  "잘 해결",
  "만족",
  "훌륭",
  "친절",
];
const criticalTerms = [
  "lawsuit",
  "legal",
  "security",
  "privacy",
  "breach",
  "fraud",
  "고소",
  "법적",
  "소송",
  "보안",
  "개인정보",
  "유출",
  "해킹",
  "사기",
  "도용",
  "개인 정보",
  "정보 유출",
  "계정 탈취",
];
const urgentTerms = [
  "urgent",
  "immediately",
  "asap",
  "급합니다",
  "긴급",
  "바로",
  "즉시",
  "빨리",
  "빠르게",
  "오늘 안에",
  "지금",
  "당장",
  "업무 중단",
  "사용 불가",
  "막혔",
];

const categoryLabels: Record<TicketAIAnalysisOutput["category"], string> = {
  technical: "기술 지원",
  billing: "결제",
  account: "계정",
  product: "제품",
  shipping: "배송",
  refund: "환불",
  complaint: "불만",
  other: "기타",
};

const intentLabels: Record<TicketAIAnalysisOutput["intent"], string> = {
  question: "문의",
  complaint: "불만",
  refund_request: "환불 요청",
  bug_report: "오류 신고",
  account_help: "계정 지원",
  billing_issue: "결제 문제",
  cancellation_request: "해지 요청",
  feature_request: "기능 요청",
  praise: "긍정 피드백",
  other: "기타",
};

const urgencyLabels: Record<TicketAIAnalysisOutput["urgency"], string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  critical: "긴급 검토",
};

const sentimentLabels: Record<TicketAIAnalysisOutput["sentiment"], string> = {
  positive: "긍정",
  neutral: "중립",
  negative: "부정",
};

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function getMockCategory(
  normalizedText: string,
  ticketCategory: string,
): TicketAIAnalysisOutput["category"] {
  if (includesAny(normalizedText, refundTerms)) {
    return "refund";
  }

  if (includesAny(normalizedText, billingTerms)) {
    return "billing";
  }

  if (includesAny(normalizedText, technicalTerms)) {
    return "technical";
  }

  if (includesAny(normalizedText, accountTerms)) {
    return "account";
  }

  if (includesAny(normalizedText, productTerms)) {
    return "product";
  }

  if (includesAny(normalizedText, shippingTerms)) {
    return "shipping";
  }

  if (includesAny(normalizedText, negativeTerms)) {
    return "complaint";
  }

  if (
    ticketCategory === "account" ||
    ticketCategory === "billing" ||
    ticketCategory === "technical" ||
    ticketCategory === "product"
  ) {
    return ticketCategory;
  }

  return "other";
}

function getMockIntent(
  normalizedText: string,
): TicketAIAnalysisOutput["intent"] {
  if (includesAny(normalizedText, refundTerms)) {
    return "refund_request";
  }

  if (includesAny(normalizedText, billingTerms)) {
    return "billing_issue";
  }

  if (includesAny(normalizedText, technicalTerms)) {
    return "bug_report";
  }

  if (includesAny(normalizedText, accountTerms)) {
    return "account_help";
  }

  if (
    normalizedText.includes("cancel") ||
    normalizedText.includes("취소") ||
    normalizedText.includes("해지") ||
    normalizedText.includes("탈퇴")
  ) {
    return "cancellation_request";
  }

  if (includesAny(normalizedText, productTerms)) {
    return "feature_request";
  }

  if (includesAny(normalizedText, positiveTerms)) {
    return "praise";
  }

  if (includesAny(normalizedText, negativeTerms)) {
    return "complaint";
  }

  return "question";
}

function getMockSentiment(
  normalizedText: string,
): TicketAIAnalysisOutput["sentiment"] {
  if (includesAny(normalizedText, negativeTerms)) {
    return "negative";
  }

  if (includesAny(normalizedText, positiveTerms)) {
    return "positive";
  }

  return "neutral";
}

function getMockUrgency(
  normalizedText: string,
): TicketAIAnalysisOutput["urgency"] {
  if (includesAny(normalizedText, criticalTerms)) {
    return "critical";
  }

  if (
    includesAny(normalizedText, urgentTerms) ||
    includesAny(normalizedText, negativeTerms)
  ) {
    return "high";
  }

  if (
    includesAny(normalizedText, technicalTerms) ||
    includesAny(normalizedText, refundTerms)
  ) {
    return "medium";
  }

  return "low";
}

function getSuggestedPriority(
  urgency: TicketAIAnalysisOutput["urgency"],
  currentPriority: TicketPriority,
): TicketAIAnalysisOutput["suggestedPriority"] {
  if (urgency === "critical") {
    return "urgent";
  }

  if (urgency === "high") {
    return "high";
  }

  if (urgency === "medium" && currentPriority === "low") {
    return "medium";
  }

  return currentPriority;
}

function buildTags(
  category: TicketAIAnalysisOutput["category"],
  intent: TicketAIAnalysisOutput["intent"],
  urgency: TicketAIAnalysisOutput["urgency"],
  normalizedText: string,
) {
  return [
    categoryLabels[category],
    intentLabels[intent],
    urgency === "critical" || urgency === "high" ? "검토 필요" : null,
    normalizedText.includes("vip") || normalizedText.includes("중요 고객")
      ? "VIP"
      : null,
    normalizedText.includes("again") ||
    normalizedText.includes("또") ||
    normalizedText.includes("계속") ||
    normalizedText.includes("반복")
      ? "반복 문의"
      : null,
  ].filter((tag): tag is string => Boolean(tag)).slice(0, 8);
}

function getSummaryText({
  category,
  intent,
  sentiment,
  ticketTitle,
  urgency,
}: {
  category: TicketAIAnalysisOutput["category"];
  intent: TicketAIAnalysisOutput["intent"];
  sentiment: TicketAIAnalysisOutput["sentiment"];
  ticketTitle: string;
  urgency: TicketAIAnalysisOutput["urgency"];
}) {
  return `${ticketTitle} 문의는 ${categoryLabels[category]} 영역의 ${intentLabels[intent]}로 분류됩니다. 감정은 ${sentimentLabels[sentiment]}, 긴급도는 ${urgencyLabels[urgency]}입니다.`;
}

function getReasonText({
  category,
  confidence,
  intent,
  sentiment,
  urgency,
}: {
  category: TicketAIAnalysisOutput["category"];
  confidence: number;
  intent: TicketAIAnalysisOutput["intent"];
  sentiment: TicketAIAnalysisOutput["sentiment"];
  urgency: TicketAIAnalysisOutput["urgency"];
}) {
  return `AI가 제목과 본문에서 ${categoryLabels[category]} / ${intentLabels[intent]} 관련 표현을 감지했습니다. 감정은 ${sentimentLabels[sentiment]}, 긴급도는 ${urgencyLabels[urgency]}로 판단했으며 신뢰도는 ${Math.round(confidence * 100)}%입니다.`;
}

function getReplyDraftText(
  sentiment: TicketAIAnalysisOutput["sentiment"],
  category: TicketAIAnalysisOutput["category"],
) {
  if (sentiment === "negative") {
    return `문의 주셔서 감사합니다. 이용 중 불편을 겪으신 점 먼저 확인했습니다. ${categoryLabels[category]} 관련 내용을 우선 검토한 뒤, 확인되는 원인과 다음 조치 방법을 바로 안내드리겠습니다.`;
  }

  return `문의 주셔서 감사합니다. 남겨주신 내용을 확인했으며, ${categoryLabels[category]} 담당 기준에 따라 필요한 정보를 검토해 다음 단계로 안내드리겠습니다.`;
}

export function createMockAIProvider(): AIProvider {
  return {
    provider: "mock",
    model: "mock-ticket-triage-v1",
    async analyzeTicket({ ticket, promptVersion }) {
      const normalizedText = `${ticket.title} ${ticket.content}`.toLowerCase();
      const category = getMockCategory(normalizedText, ticket.category);
      const intent = getMockIntent(normalizedText);
      const sentiment = getMockSentiment(normalizedText);
      const urgency = getMockUrgency(normalizedText);
      const suggestedPriority = getSuggestedPriority(urgency, ticket.priority);
      const confidence =
        urgency === "critical" || sentiment === "negative"
          ? 0.68
          : category === "other"
            ? 0.72
            : 0.86;

      const output: TicketAIAnalysisOutput = {
        category,
        sentiment,
        urgency,
        intent,
        suggestedPriority,
        suggestedStatus:
          ticket.status === "in_progress" ? "open" : ticket.status,
        suggestedAssigneeRole:
          category === "billing" || category === "refund"
            ? "결제 담당자"
            : "지원 담당자",
        tags: buildTags(category, intent, urgency, normalizedText),
        summary: getSummaryText({
          category,
          intent,
          sentiment,
          ticketTitle: ticket.title,
          urgency,
        }),
        reason: getReasonText({
          category,
          confidence,
          intent,
          sentiment,
          urgency,
        }),
        replyDraft: getReplyDraftText(sentiment, category),
        confidence,
        needsReview: confidence < 0.7 || urgency === "critical",
        escalationReason:
          confidence < 0.7 || urgency === "critical"
            ? "신뢰도가 낮거나 긴급 검토가 필요한 문의로 감지되었습니다."
            : null,
      };

      return {
        output,
        rawResponse: {
          provider: "mock",
          model: "mock-ticket-triage-v1",
          promptVersion,
          matchedTextLength: normalizedText.length,
          output,
        },
      };
    },
  };
}
