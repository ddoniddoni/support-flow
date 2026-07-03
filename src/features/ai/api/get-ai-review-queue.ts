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

export type AIReviewQueueItem = Tables<"ticket_ai_analyses"> & {
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

const reviewQueueSelect = `
  *,
  ticket:tickets!ticket_ai_analyses_ticket_id_fkey(
    id,
    title,
    ticket_number,
    status,
    priority,
    assignee_id,
    customer:profiles!tickets_customer_id_fkey(name,email),
    assignee:profiles!tickets_assignee_id_fkey(name,email)
  )
`;

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
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = filters.pageSize ?? defaultPageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("ticket_ai_analyses")
    .select(reviewQueueSelect, { count: "exact" })
    .eq("needs_review", true);

  if (filters.search) {
    const search = `%${filters.search}%`;
    query = query.or(`summary.ilike.${search},reason.ilike.${search}`);
  }

  if (filters.sentiment && filters.sentiment !== "all") {
    query = query.eq("sentiment", filters.sentiment);
  }

  if (filters.urgency && filters.urgency !== "all") {
    query = query.eq("urgency", filters.urgency);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  return {
    items: (data ?? []) as AIReviewQueueItem[],
    total: count ?? 0,
    page,
    pageSize,
    pageCount: Math.max(Math.ceil((count ?? 0) / pageSize), 1),
  };
}
