import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Tables } from "@/types/database";

import type { TicketAIAnalysis } from "../types";

type SupportProfile = Pick<Tables<"profiles">, "id" | "role">;

export type AnalyzeTicketInput = {
  ticketId: string;
  profile: SupportProfile;
  regenerate?: boolean;
};

export async function analyzeTicket({
  ticketId,
  profile,
  regenerate = false,
}: AnalyzeTicketInput): Promise<TicketAIAnalysis> {
  if (profile.role === "customer") {
    throw new Error("고객 계정은 AI 분석을 실행할 수 없습니다.");
  }

  const response = await fetch(`/api/tickets/${ticketId}/analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ regenerate }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message ?? "AI 분석에 실패했습니다.");
  return payload.analysis as TicketAIAnalysis;
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
