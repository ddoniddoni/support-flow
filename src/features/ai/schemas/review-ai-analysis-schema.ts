import { z } from "zod";

import { ticketPriorities, ticketStatuses } from "@/types/domain";

export const correctAIAnalysisSchema = z.object({
  summary: z.string().trim().min(1).max(500),
  reason: z.string().trim().min(1).max(700),
  replyDraft: z.string().trim().max(2000).optional(),
  suggestedPriority: z.enum(ticketPriorities).or(z.literal("none")),
  suggestedStatus: z.enum(ticketStatuses).or(z.literal("none")),
  note: z.string().trim().max(500).optional(),
});

export type CorrectAIAnalysisFormInput = z.infer<
  typeof correctAIAnalysisSchema
>;
