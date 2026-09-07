import type { Tables } from "@/types/database";

export type TicketPerson = Pick<Tables<"profiles">, "email" | "name">;
export type TicketLatestAnalysis = Pick<
  Tables<"ticket_ai_analyses">,
  "intent" | "summary" | "tags"
>;
export type TicketListItem = Tables<"tickets"> & {
  response_remaining_minutes?: number | null;
  ai_review_decision?: Tables<"ticket_ai_analyses">["review_decision"];
  customer: TicketPerson | null;
  assignee: TicketPerson | null;
  latest_ai_analysis: TicketLatestAnalysis | null;
};
export type TicketDetail = TicketListItem;
export type TicketReplyAuthor = Pick<
  Tables<"profiles">,
  "email" | "name" | "role"
>;
export type TicketReplyItem = Tables<"ticket_replies"> & {
  author: TicketReplyAuthor | null;
};
export type TicketLogItem = Tables<"ticket_logs">;

export type TicketSortOption =
  | "priority_first"
  | "created_desc"
  | "created_asc"
  | "updated_desc"
  | "title_asc";

export type TicketDetailData = {
  attachments: import("@/features/attachments/validation").Attachment[];
  ticket: TicketDetail | null;
  replies: TicketReplyItem[];
  internalNotes: TicketReplyItem[];
  logs: TicketLogItem[];
};
