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
  "이중 결제",
  "두 번 결제",
  "두번 결제",
  "요금",
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
  "작동하지",
  "멈춤",
  "크래시",
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
  "짜증",
  "최악",
  "불만",
  "불쾌",
  "실망",
  "취소",
  "해지",
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
  "고마워",
  "좋아요",
  "좋았습니다",
  "만족",
  "훌륭",
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
];

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

  if (normalizedText.includes("cancel") || normalizedText.includes("취소")) {
    return "cancellation_request";
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

  if (includesAny(normalizedText, technicalTerms) || includesAny(normalizedText, refundTerms)) {
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
    category,
    intent.replace("_", "-"),
    urgency === "critical" || urgency === "high" ? "priority-review" : null,
    normalizedText.includes("vip") || normalizedText.includes("중요 고객")
      ? "vip"
      : null,
    normalizedText.includes("again") || normalizedText.includes("또")
      ? "repeat-contact"
      : null,
  ].filter((tag): tag is string => Boolean(tag)).slice(0, 8);
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
        suggestedAssigneeRole: category === "billing" || category === "refund"
          ? "billing-specialist"
          : "support-agent",
        tags: buildTags(category, intent, urgency, normalizedText),
        summary: `${ticket.title} - ${
          category === "other"
            ? "general support request"
            : `${category} related support request`
        }.`,
        reason: `Mock triage matched ${category}/${intent} signals with ${urgency} urgency and ${sentiment} sentiment.`,
        replyDraft:
          sentiment === "negative"
            ? "Thank you for flagging this. I understand this has been frustrating, and I am going to review the account details before recommending the next step."
            : "Thanks for reaching out. I reviewed the details and will help move this request toward the right next step.",
        confidence,
        needsReview: confidence < 0.7 || urgency === "critical",
        escalationReason:
          confidence < 0.7 || urgency === "critical"
            ? "Mock provider detected low confidence or critical urgency."
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
