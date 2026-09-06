import type { Tables } from "@/types/database";
import type { ValidatedAIProviderResult } from "../providers/ai-provider";
import { ticketAIAnalysisSchema, type TicketAIAnalysisOutput } from "../schemas/ticket-ai-analysis-schema";
import { isAICategory } from "./ai-review-rules";

type TicketForAnalysis = Pick<
  Tables<"tickets">,
  | "id"
  | "title"
  | "content"
  | "category"
  | "priority"
  | "status"
  | "latest_ai_analysis_id"
>;

const fallbackSummaryMaxLength = 500;
const fallbackReasonMaxLength = 700;

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength - 1).trimEnd();
}

function parseUnknownAIOutput(output: unknown) {
  if (typeof output !== "string") {
    return output;
  }

  return JSON.parse(output) as unknown;
}

function createFallbackAnalysis({
  ticket,
  validationError,
}: {
  ticket: TicketForAnalysis;
  validationError: string;
}): TicketAIAnalysisOutput {
  const category = isAICategory(ticket.category) ? ticket.category : "other";

  return {
    category,
    sentiment: "neutral",
    urgency: "medium",
    intent: "other",
    suggestedPriority: ticket.priority,
    suggestedStatus: ticket.status,
    suggestedAssigneeRole: "지원 담당자",
    tags: ["검토 필요"],
    summary: truncate(
      `${ticket.title}: ${ticket.content}`,
      fallbackSummaryMaxLength,
    ),
    reason: truncate(
      `AI 응답 형식을 검증하지 못해 기본 분석값을 사용했습니다. ${validationError}`,
      fallbackReasonMaxLength,
    ),
    replyDraft: null,
    confidence: 0,
    needsReview: true,
    escalationReason: "AI 응답 형식을 검증하지 못했습니다.",
  };
}

export function validateAIProviderResult({
  output,
  rawResponse,
  ticket,
}: {
  output: unknown;
  rawResponse: unknown;
  ticket: TicketForAnalysis;
}): ValidatedAIProviderResult {
  try {
    const parsedOutput = parseUnknownAIOutput(output);
    const validationResult = ticketAIAnalysisSchema.safeParse(parsedOutput);

    if (validationResult.success) {
      return {
        output: validationResult.data,
        rawResponse,
        validationStatus: "valid",
        validationError: null,
      };
    }

    const validationError = validationResult.error.message;

    return {
      output: createFallbackAnalysis({ ticket, validationError }),
      rawResponse,
      validationStatus: "fallback",
      validationError,
    };
  } catch (error) {
    const validationError =
      error instanceof Error ? error.message : "AI provider 응답 형식 오류";

    return {
      output: createFallbackAnalysis({ ticket, validationError }),
      rawResponse,
      validationStatus: "fallback",
      validationError,
    };
  }
}
