import { normalizePagination } from "@/lib/data/pagination";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Tables } from "@/types/database";
import type { AISentiment, AIUrgency } from "@/types/domain";

type SupportProfile = Pick<Tables<"profiles">, "id" | "role">;

export type AIReviewQueueFilters = {
  search?: string;
  sentiment?: AISentiment | "all";
  urgency?: AIUrgency | "all";
  page?: number;
  pageSize?: number;
};

export type AIReviewQueueTicket = Pick<
  Tables<"tickets">,
  "id" | "title" | "ticket_number" | "status" | "priority" | "assignee_id"
> & {
  customer: Pick<Tables<"profiles">, "name" | "email"> | null;
  assignee: Pick<Tables<"profiles">, "name" | "email"> | null;
};

export type AIReviewQueueItem = Omit<Tables<"ticket_ai_analyses">, "raw_response"> & {
  ticket: AIReviewQueueTicket | null;
};

export type AIReviewQueueResult = {
  items: AIReviewQueueItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

const defaultPageSize = 10;

export async function listAIReviewQueue({
  profile,
  filters,
}: {
  profile: SupportProfile;
  filters: AIReviewQueueFilters;
}): Promise<AIReviewQueueResult> {
  if (profile.role === "customer") {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: filters.pageSize ?? defaultPageSize,
      pageCount: 1,
    };
  }

  const supabase = createSupabaseBrowserClient();
  const { page, pageSize } = normalizePagination(filters.page, filters.pageSize ?? defaultPageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("ticket_workspace")
    .select("*", { count: "exact" })
    .eq("ai_needs_review", true);

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  if (filters.sentiment && filters.sentiment !== "all") {
    query = query.eq("ai_sentiment", filters.sentiment);
  }

  if (filters.urgency && filters.urgency !== "all") {
    query = query.eq("ai_urgency", filters.urgency);
  }

  const { data, error, count } = await query
    .order("ai_urgency_rank", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  return {
    items: (data ?? []).flatMap((ticket) => ticket.ai_analysis ? [{
      ...ticket.ai_analysis,
      ticket: { id: ticket.id, title: ticket.title, ticket_number: ticket.ticket_number,
        status: ticket.status, priority: ticket.priority, assignee_id: ticket.assignee_id,
        customer: ticket.customer, assignee: ticket.assignee },
    }] : []),
    total: count ?? 0,
    page,
    pageSize,
    pageCount: Math.max(Math.ceil((count ?? 0) / pageSize), 1),
  };
}
