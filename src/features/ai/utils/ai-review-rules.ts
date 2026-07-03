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
] as const;

export function getAIConfidenceReviewThreshold() {
  const configuredValue = Number(process.env.AI_CONFIDENCE_REVIEW_THRESHOLD);

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
      ? `Confidence ${analysis.confidence.toFixed(2)} is below ${threshold.toFixed(2)}.`
      : null,
    analysis.urgency === "critical" ? "Critical urgency requires review." : null,
    riskSignals.length ? `Risk signals: ${riskSignals.join(", ")}.` : null,
    validationFailed ? "AI output validation failed and fallback values were used." : null,
    analysis.sentiment === "negative" && analysis.suggestedPriority === "urgent"
      ? "Negative urgent ticket needs human confirmation."
      : null,
  ].filter((reason): reason is string => Boolean(reason));

  if (!reviewReasons.length) {
    return {
      ...analysis,
      needsReview: analysis.needsReview,
      escalationReason: analysis.needsReview
        ? (analysis.escalationReason ?? "AI provider requested review.")
        : analysis.escalationReason,
    };
  }

  return {
    ...analysis,
    needsReview: true,
    escalationReason: reviewReasons.join(" "),
  };
}
