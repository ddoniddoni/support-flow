import { z } from "zod";

import { ticketPriorities, ticketStatuses } from "@/types/domain";

export const ticketStatusSchema = z.enum(ticketStatuses);
export const ticketPrioritySchema = z.enum(ticketPriorities);

export const ticketCategories = [
  "account",
  "billing",
  "technical",
  "product",
  "other",
] as const;

export const ticketCategorySchema = z.enum(ticketCategories);

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "제목은 5자 이상 입력해 주세요.")
    .max(120, "제목은 120자 이하로 입력해 주세요."),
  content: z
    .string()
    .trim()
    .min(20, "문의 내용은 20자 이상 입력해 주세요.")
    .max(4000, "문의 내용은 4000자 이하로 입력해 주세요."),
  category: ticketCategorySchema,
  priority: ticketPrioritySchema,
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const ticketReplySchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, "내용을 3자 이상 입력해 주세요.")
    .max(4000, "내용은 4000자 이하로 입력해 주세요."),
});

export type TicketReplyInput = z.infer<typeof ticketReplySchema>;
