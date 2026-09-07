import "server-only";

import { buildConversationContext } from "../utils/conversation-context";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json, Tables } from "@/types/database";

import { getAIProvider } from "../providers";
import {
  ticketAIAnalysisSchema,
} from "../schemas/ticket-ai-analysis-schema";
import { validateAIProviderResult } from "../utils/validate-ai-provider-result";
import type { TicketAIAnalysis } from "../types";
import { applyAIReviewRules } from "../utils/ai-review-rules";

type GenerateTicketAIAnalysisParams = {
  actorId: string;
  regenerate?: boolean;
  supabase: SupabaseClient<Database>;
  ticketId: string;
};

function toJson(value: unknown): Json {
  try {
    return JSON.parse(JSON.stringify(value ?? null)) as Json;
  } catch {
    return {
      error: "원본 AI 응답을 JSON으로 저장하지 못했습니다.",
    };
  }
}

async function getActivePromptVersion({
  providerName,
  supabase,
}: {
  providerName: string;
  supabase: SupabaseClient<Database>;
}): Promise<Tables<"ai_prompt_versions"> | null> {
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

export async function generateTicketAIAnalysis({
  actorId,
  supabase,
  ticketId,
}: GenerateTicketAIAnalysisParams): Promise<TicketAIAnalysis> {
  const provider = getAIProvider();

  const { data: ticket, error: ticketError } = await supabase
    .from("ticket_workspace")
    .select("id,title,content,category,priority,status,latest_ai_analysis_id")
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError) {
    throw ticketError;
  }

  if (!ticket) {
    throw new Error("문의를 찾을 수 없거나 접근 권한이 없습니다.");
  }

  const { data: messages, error: messagesError } = await supabase
    .from("ticket_replies").select("content,author_role,reply_order")
    .eq("ticket_id", ticketId).eq("is_internal", false)
    .order("reply_order", { ascending: false }).limit(20);
  if (messagesError) throw messagesError;
  const conversation = [...(messages ?? [])].reverse();
  const expectedReplyOrder = messages?.[0]?.reply_order ?? 0;
  const contextTicket = { ...ticket, content: buildConversationContext(ticket.content, conversation) };
  const promptVersion = await getActivePromptVersion({
    providerName: provider.provider,
    supabase,
  });
  if (!promptVersion) {
    throw new Error("활성 AI 프롬프트 버전이 없습니다.");
  }
  const providerResult = await provider.analyzeTicket({
    ticket,
    conversation,
    promptVersion,
  });
  const validatedResult = validateAIProviderResult({
    output: providerResult.output,
    rawResponse: providerResult.rawResponse,
    ticket: contextTicket,
  });
  const analysisOutput = ticketAIAnalysisSchema.parse(applyAIReviewRules({
    analysis: validatedResult.output,
    ticket: contextTicket,
    validationFailed: validatedResult.validationStatus === "fallback",
  }));

  const { data, error } = await supabase.rpc("support_ticket_command", {
    p_ticket_id: ticket.id,
    p_action: "save_analysis",
    p_payload: {
      actorId,
      expectedReplyOrder,
      expectedAnalysisId: ticket.latest_ai_analysis_id,
      analysis: {
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
      },
    },
  });
  if (error) throw error;
  return data as unknown as TicketAIAnalysis;
}
