import type { Tables } from "@/types/database";

export type TicketPerson = Pick<Tables<"profiles">, "email" | "name">;
export type TicketListItem = Tables<"tickets"> & {
  customer: TicketPerson | null;
  assignee: TicketPerson | null;
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
