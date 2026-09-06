import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Tables } from "@/types/database";
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

export async function reviewAIAnalysis(input: ReviewAIAnalysisInput): Promise<TicketAIAnalysis> {
  const { data, error } = await createSupabaseBrowserClient().rpc("support_ticket_command", {
    p_ticket_id: input.ticketId,
    p_action: "review",
    p_payload: {
      analysisId: input.analysisId,
      decision: input.decision,
      correction: input.correction ? { ...input.correction } : null,
      note: input.note ?? null,
    },
  });
  if (error) throw error;
  return data as unknown as TicketAIAnalysis;
}

export async function sendAIAnalysisToReview(input: SendAIAnalysisToReviewInput): Promise<TicketAIAnalysis> {
  const { data, error } = await createSupabaseBrowserClient().rpc("support_ticket_command", {
    p_ticket_id: input.ticketId,
    p_action: "request_review",
    p_payload: { analysisId: input.analysisId, note: input.note ?? null },
  });
  if (error) throw error;
  return data as unknown as TicketAIAnalysis;
}
