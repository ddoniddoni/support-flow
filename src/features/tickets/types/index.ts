import type { Tables } from "@/types/database";

export type TicketListItem = Tables<"tickets">;

export type TicketSortOption =
  | "created_desc"
  | "created_asc"
  | "updated_desc"
  | "title_asc";
