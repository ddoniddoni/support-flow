import type { Tables } from "@/types/database";

import type { TicketAIAnalysisOutput } from "../schemas/ticket-ai-analysis-schema";

export type AIProviderName = "mock" | "openai";

export type AnalyzeTicketProviderInput = {
  ticket: Pick<
    Tables<"tickets">,
    "id" | "title" | "content" | "category" | "priority" | "status"
  >;
  conversation?: Array<Pick<Tables<"ticket_replies">, "content" | "author_role" | "reply_order">>;
  promptVersion: Pick<
    Tables<"ai_prompt_versions">,
    "id" | "name" | "version" | "prompt_text"
  > | null;
};

export type AnalyzeTicketProviderResult = {
  output: unknown;
  rawResponse: unknown;
};

export type AIProvider = {
  provider: AIProviderName;
  model: string | null;
  analyzeTicket: (
    input: AnalyzeTicketProviderInput,
  ) => Promise<AnalyzeTicketProviderResult>;
};

export type ValidatedAIProviderResult = {
  output: TicketAIAnalysisOutput;
  rawResponse: unknown;
  validationStatus: "valid" | "fallback";
  validationError: string | null;
};
