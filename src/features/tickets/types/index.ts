import type { Tables } from "@/types/database";

export type TicketListItem = Tables<"tickets">;
export type TicketDetail = Tables<"tickets">;
export type TicketReplyItem = Tables<"ticket_replies">;
export type TicketLogItem = Tables<"ticket_logs">;

export type TicketSortOption =
  | "created_desc"
  | "created_asc"
  | "updated_desc"
  | "title_asc";

export type TicketDetailData = {
  ticket: TicketDetail | null;
  replies: TicketReplyItem[];
  internalNotes: TicketReplyItem[];
  logs: TicketLogItem[];
};
