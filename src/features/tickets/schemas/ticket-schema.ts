import { z } from "zod";

import { ticketPriorities, ticketStatuses } from "@/types/domain";

export const ticketStatusSchema = z.enum(ticketStatuses);
export const ticketPrioritySchema = z.enum(ticketPriorities);

export const createTicketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  content: z.string().min(20, "Content must be at least 20 characters."),
  category: z.string().min(1, "Choose a category."),
  priority: ticketPrioritySchema.default("medium"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
