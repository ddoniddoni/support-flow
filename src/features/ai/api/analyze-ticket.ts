import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Tables } from "@/types/database";

import type { TicketAIAnalysis } from "../types";
import { generateTicketAIAnalysis } from "./generate-ticket-ai-analysis";

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
    throw new Error("Customers cannot run AI ticket analysis.");
  }

  const supabase = createSupabaseBrowserClient();
  return generateTicketAIAnalysis({
    actorId: profile.id,
    regenerate,
    supabase,
    ticketId,
  });
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
