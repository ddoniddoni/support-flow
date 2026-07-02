import type { Tables } from "@/types/database";

import type { TicketAIAnalysisOutput } from "../schemas/ticket-ai-analysis-schema";

export type TicketAIAnalysis = Tables<"ticket_ai_analyses">;
export type AIPromptVersion = Tables<"ai_prompt_versions">;
export type TicketAIReviewEvent = Tables<"ticket_ai_review_events">;

export type ValidatedTicketAIAnalysis = TicketAIAnalysisOutput;
