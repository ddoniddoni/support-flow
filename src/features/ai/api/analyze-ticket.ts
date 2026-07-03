import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Json, Tables } from "@/types/database";

import {
  ticketAIAnalysisSchema,
  type TicketAIAnalysisOutput,
} from "../schemas/ticket-ai-analysis-schema";
import type { TicketAIAnalysis } from "../types";
import { getAIProvider } from "../providers";
import type { ValidatedAIProviderResult } from "../providers/ai-provider";
import { applyAIReviewRules, isAICategory } from "../utils/ai-review-rules";

type SupportProfile = Pick<Tables<"profiles">, "id" | "role">;

export type AnalyzeTicketInput = {
  ticketId: string;
  profile: SupportProfile;
  regenerate?: boolean;
};

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

function toJson(value: unknown): Json {
  try {
    return JSON.parse(JSON.stringify(value ?? null)) as Json;
  } catch {
    return {
      error: "Unable to serialize raw AI response.",
    };
  }
}

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
    suggestedAssigneeRole: "support-agent",
    tags: ["needs-human-review"],
    summary: truncate(
      `${ticket.title}: ${ticket.content}`,
      fallbackSummaryMaxLength,
    ),
    reason: truncate(
      `AI output could not be validated. ${validationError}`,
      fallbackReasonMaxLength,
    ),
    replyDraft: null,
    confidence: 0,
    needsReview: true,
    escalationReason: "AI output could not be validated.",
  };
}

function validateAIProviderResult({
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
      error instanceof Error ? error.message : "Malformed AI provider output.";

    return {
      output: createFallbackAnalysis({ ticket, validationError }),
      rawResponse,
      validationStatus: "fallback",
      validationError,
    };
  }
}

async function getActivePromptVersion(
  providerName: string,
): Promise<Tables<"ai_prompt_versions"> | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("ai_prompt_versions")
    .select("*")
    .eq("name", "ticket-triage")
    .eq("provider", providerName)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function analyzeTicket({
  ticketId,
  profile,
  regenerate = false,
}: AnalyzeTicketInput): Promise<TicketAIAnalysis> {
  if (profile.role === "customer") {
    throw new Error("Customers cannot run AI ticket analysis.");
  }

  const supabase = createSupabaseBrowserClient();
  const provider = getAIProvider();

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select(
      "id,title,content,category,priority,status,latest_ai_analysis_id",
    )
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError) {
    throw ticketError;
  }

  if (!ticket) {
    throw new Error("Ticket not found or access denied.");
  }

  const promptVersion = await getActivePromptVersion(provider.provider);
  const providerResult = await provider.analyzeTicket({
    ticket,
    promptVersion,
  });
  const validatedResult = validateAIProviderResult({
    output: providerResult.output,
    rawResponse: providerResult.rawResponse,
    ticket,
  });
  const analysisOutput = applyAIReviewRules({
    analysis: validatedResult.output,
    ticket,
    validationFailed: validatedResult.validationStatus === "fallback",
  });

  const { data: analysis, error: analysisError } = await supabase
    .from("ticket_ai_analyses")
    .insert({
      ticket_id: ticket.id,
      prompt_version_id: promptVersion?.id ?? null,
      provider: provider.provider,
      model: provider.model,
      category: analysisOutput.category,
      sentiment: analysisOutput.sentiment,
      urgency: analysisOutput.urgency,
      intent: analysisOutput.intent,
      suggested_priority: analysisOutput.suggestedPriority,
      suggested_status: analysisOutput.suggestedStatus,
      suggested_assignee_role: analysisOutput.suggestedAssigneeRole,
      tags: analysisOutput.tags,
      summary: analysisOutput.summary,
      reason: analysisOutput.reason,
      reply_draft: analysisOutput.replyDraft,
      confidence: analysisOutput.confidence,
      needs_review: analysisOutput.needsReview,
      escalation_reason: analysisOutput.escalationReason,
      raw_response: toJson({
        rawResponse: validatedResult.rawResponse,
        validationError: validatedResult.validationError,
      }),
      validation_status: validatedResult.validationStatus,
      created_by: profile.id,
    })
    .select("*")
    .single();

  if (analysisError) {
    throw analysisError;
  }

  const { error: ticketUpdateError } = await supabase
    .from("tickets")
    .update({
      latest_ai_analysis_id: analysis.id,
      ai_needs_review: analysis.needs_review,
      ai_sentiment: analysis.sentiment,
      ai_urgency: analysis.urgency,
      ai_confidence: analysis.confidence,
    })
    .eq("id", ticket.id);

  if (ticketUpdateError) {
    throw ticketUpdateError;
  }

  const { error: logError } = await supabase.from("ticket_logs").insert({
    ticket_id: ticket.id,
    actor_id: profile.id,
    action: regenerate || ticket.latest_ai_analysis_id
      ? "ai_analysis_regenerated"
      : "ai_analysis_generated",
    before_value: ticket.latest_ai_analysis_id,
    after_value: analysis.id,
  });

  if (logError) {
    throw logError;
  }

  return analysis;
}

export async function getLatestTicketAIAnalysis({
  ticketId,
  profile,
}: {
  ticketId: string;
  profile: SupportProfile;
}): Promise<TicketAIAnalysis | null> {
  if (profile.role === "customer") {
    return null;
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("ticket_ai_analyses")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
