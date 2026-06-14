import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Tables } from "@/types/database";
import type { TicketPriority, TicketStatus } from "@/types/domain";

import type { CreateTicketInput } from "../schemas/ticket-schema";
import type { TicketSortOption } from "../types";

export async function createTicket(input: CreateTicketInput) {
  const supabase = createSupabaseBrowserClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      title: input.title,
      content: input.content,
      category: input.category,
      priority: input.priority,
      customer_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export type TicketListFilters = {
  search?: string;
  status?: TicketStatus | "all";
  priority?: TicketPriority | "all";
  category?: string;
  sort?: TicketSortOption;
  page?: number;
  pageSize?: number;
};

type ListTicketsParams = {
  profile: Pick<Tables<"profiles">, "id" | "role">;
  filters: TicketListFilters;
};

const defaultPageSize = 10;

function getSortConfig(sort: TicketSortOption = "created_desc") {
  if (sort === "created_asc") {
    return { column: "created_at", ascending: true };
  }

  if (sort === "updated_desc") {
    return { column: "updated_at", ascending: false };
  }

  if (sort === "title_asc") {
    return { column: "title", ascending: true };
  }

  return { column: "created_at", ascending: false };
}

export async function listTickets({ profile, filters }: ListTicketsParams) {
  const supabase = createSupabaseBrowserClient();
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = filters.pageSize ?? defaultPageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sort = getSortConfig(filters.sort);

  let query = supabase.from("tickets").select("*", { count: "exact" });

  if (profile.role === "customer") {
    query = query.eq("customer_id", profile.id);
  }

  if (profile.role === "agent") {
    query = query.eq("assignee_id", profile.id);
  }

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority);
  }

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  const { data, error, count } = await query
    .order(sort.column, { ascending: sort.ascending })
    .range(from, to);

  if (error) {
    throw error;
  }

  return {
    tickets: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    pageCount: Math.max(Math.ceil((count ?? 0) / pageSize), 1),
  };
}
