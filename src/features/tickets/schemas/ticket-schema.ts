import { z } from "zod";

import { ticketPriorities, ticketStatuses } from "@/types/domain";

export const ticketStatusSchema = z.enum(ticketStatuses);
export const ticketPrioritySchema = z.enum(ticketPriorities);

export const createTicketSchema = z.object({
  title: z.string().min(5, "제목은 5자 이상 입력해 주세요."),
  content: z.string().min(20, "문의 내용은 20자 이상 입력해 주세요."),
  category: z.string().min(1, "문의 유형을 선택해 주세요."),
  priority: ticketPrioritySchema.default("medium"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
