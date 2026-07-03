import type { TicketPriority } from "@/types/domain";

import type { TicketAIAnalysisOutput } from "../schemas/ticket-ai-analysis-schema";
import type { AIProvider } from "./ai-provider";

const billingTerms = ["charge", "payment", "invoice", "billing", "paid"];
const refundTerms = ["refund", "chargeback", "money back"];
const technicalTerms = ["bug", "error", "crash", "broken", "fail", "failed"];
const accountTerms = ["login", "password", "account", "profile", "signin"];
const shippingTerms = ["shipping", "delivery", "package", "shipment"];
const negativeTerms = [
  "angry",
  "terrible",
  "complaint",
  "lawsuit",
  "legal",
  "cancel",
  "unacceptable",
  "frustrated",
];
const positiveTerms = ["thanks", "thank you", "great", "helpful", "love"];
const criticalTerms = ["lawsuit", "legal", "security", "privacy", "breach", "fraud"];

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

  if (normalizedText.includes("cancel")) {
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
    includesAny(normalizedText, ["urgent", "immediately", "asap"]) ||
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
    normalizedText.includes("vip") ? "vip" : null,
    normalizedText.includes("again") ? "repeat-contact" : null,
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
          ticket.status === "open" && urgency !== "low"
            ? "in_progress"
            : ticket.status,
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
