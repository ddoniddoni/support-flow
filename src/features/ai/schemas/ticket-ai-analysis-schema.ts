import { z } from "zod";

import {
  aiCategories,
  aiIntents,
  aiSentiments,
  aiUrgencies,
  ticketPriorities,
  ticketStatuses,
} from "@/types/domain";

export const ticketAIAnalysisSchema = z.object({
  category: z.enum(aiCategories),
  sentiment: z.enum(aiSentiments),
  urgency: z.enum(aiUrgencies),
  intent: z.enum(aiIntents),
  suggestedPriority: z.enum(ticketPriorities).nullable(),
  suggestedStatus: z.enum(ticketStatuses).nullable(),
  suggestedAssigneeRole: z.string().trim().min(1).max(80).nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(8),
  summary: z.string().trim().min(1).max(500),
  reason: z.string().trim().min(1).max(700),
  replyDraft: z.string().trim().max(2000).nullable(),
  confidence: z.number().min(0).max(1),
  needsReview: z.boolean(),
  escalationReason: z.string().trim().max(500).nullable(),
});

export type TicketAIAnalysisOutput = z.infer<typeof ticketAIAnalysisSchema>;
