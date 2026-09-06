import type { Tables } from "@/types/database";

import type { TicketAIAnalysisOutput } from "../schemas/ticket-ai-analysis-schema";

export type TicketAIAnalysis = Omit<Tables<"ticket_ai_analyses">, "raw_response">;
export type AIPromptVersion = Tables<"ai_prompt_versions">;
export type TicketAIReviewEvent = Tables<"ticket_ai_review_events">;

export type ValidatedTicketAIAnalysis = TicketAIAnalysisOutput;
