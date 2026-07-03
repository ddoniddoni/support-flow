import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Json, Tables } from "@/types/database";
import type { AIReviewDecision, TicketPriority, TicketStatus } from "@/types/domain";

import type { TicketAIAnalysis } from "../types";

type SupportProfile = Pick<Tables<"profiles">, "id" | "role">;

export type CorrectAIAnalysisInput = {
  summary: string;
  reason: string;
  replyDraft: string | null;
  suggestedPriority: TicketPriority | null;
  suggestedStatus: TicketStatus | null;
};

export type ReviewAIAnalysisInput = {
  analysisId: string;
  ticketId: string;
  profile: SupportProfile;
  decision: Extract<AIReviewDecision, "approved" | "corrected" | "rejected">;
  correction?: CorrectAIAnalysisInput;
  note?: string | null;
};

export type SendAIAnalysisToReviewInput = {
  analysisId: string;
  ticketId: string;
  profile: SupportProfile;
  note?: string | null;
};

function toJson(value: unknown): Json {
  try {
    return JSON.parse(JSON.stringify(value ?? null)) as Json;
  } catch {
    return {
      error: "Unable to serialize review payload.",
    };
  }
}

function getLogAction(decision: ReviewAIAnalysisInput["decision"]) {
  if (decision === "approved") {
    return "ai_analysis_approved";
  }

  if (decision === "corrected") {
    return "ai_analysis_corrected";
  }

  return "ai_analysis_rejected";
}

async function getCurrentAnalysis(analysisId: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("ticket_ai_analyses")
    .select("*")
    .eq("id", analysisId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("AI analysis not found or access denied.");
  }

  return data;
}

async function updateTicketAIFields(analysis: TicketAIAnalysis) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("tickets")
    .update({
      latest_ai_analysis_id: analysis.id,
      ai_needs_review: analysis.needs_review,
      ai_sentiment: analysis.sentiment,
      ai_urgency: analysis.urgency,
      ai_confidence: analysis.confidence,
    })
    .eq("id", analysis.ticket_id);

  if (error) {
    throw error;
  }
}

async function insertTicketLog({
  ticketId,
  actorId,
  action,
  beforeValue,
  afterValue,
}: {
  ticketId: string;
  actorId: string;
  action: string;
  beforeValue: string | null;
  afterValue: string | null;
}) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("ticket_logs").insert({
    ticket_id: ticketId,
    actor_id: actorId,
    action,
    before_value: beforeValue,
    after_value: afterValue,
  });

  if (error) {
    throw error;
  }
}

export async function reviewAIAnalysis(
  input: ReviewAIAnalysisInput,
): Promise<TicketAIAnalysis> {
  if (input.profile.role === "customer") {
    throw new Error("Customers cannot review AI analysis.");
  }

  const supabase = createSupabaseBrowserClient();
  const currentAnalysis = await getCurrentAnalysis(input.analysisId);
  const correction = input.correction;
  const updatePayload =
    input.decision === "corrected" && correction
      ? {
          summary: correction.summary,
          reason: correction.reason,
          reply_draft: correction.replyDraft,
          suggested_priority: correction.suggestedPriority,
          suggested_status: correction.suggestedStatus,
          needs_review: false,
          escalation_reason: null,
        }
      : {
          needs_review: false,
          escalation_reason:
            input.decision === "rejected"
              ? (input.note ?? "AI analysis was rejected.")
              : null,
        };

  const { data: updatedAnalysis, error: updateError } = await supabase
    .from("ticket_ai_analyses")
    .update(updatePayload)
    .eq("id", input.analysisId)
    .eq("ticket_id", input.ticketId)
    .select("*")
    .single();

  if (updateError) {
    throw updateError;
  }

  const { error: eventError } = await supabase
    .from("ticket_ai_review_events")
    .insert({
      ticket_ai_analysis_id: input.analysisId,
      ticket_id: input.ticketId,
      reviewer_id: input.profile.id,
      decision: input.decision,
      before_value: toJson(currentAnalysis),
      after_value: toJson(updatedAnalysis),
      note: input.note ?? null,
    });

  if (eventError) {
    throw eventError;
  }

  await updateTicketAIFields(updatedAnalysis);
  await insertTicketLog({
    ticketId: input.ticketId,
    actorId: input.profile.id,
    action: getLogAction(input.decision),
    beforeValue: currentAnalysis.id,
    afterValue: updatedAnalysis.id,
  });

  return updatedAnalysis;
}

export async function sendAIAnalysisToReview(
  input: SendAIAnalysisToReviewInput,
): Promise<TicketAIAnalysis> {
  if (input.profile.role === "customer") {
    throw new Error("Customers cannot send AI analysis to review.");
  }

  const supabase = createSupabaseBrowserClient();
  const currentAnalysis = await getCurrentAnalysis(input.analysisId);
  const { data: updatedAnalysis, error: updateError } = await supabase
    .from("ticket_ai_analyses")
    .update({
      needs_review: true,
      escalation_reason: input.note ?? "Sent to human review from ticket detail.",
    })
    .eq("id", input.analysisId)
    .eq("ticket_id", input.ticketId)
    .select("*")
    .single();

  if (updateError) {
    throw updateError;
  }

  await updateTicketAIFields(updatedAnalysis);
  await insertTicketLog({
    ticketId: input.ticketId,
    actorId: input.profile.id,
    action: "ai_analysis_sent_to_review",
    beforeValue: currentAnalysis.id,
    afterValue: updatedAnalysis.id,
  });

  return updatedAnalysis;
}
