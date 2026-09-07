import { normalizePagination } from "@/lib/data/pagination";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Tables } from "@/types/database";
import type {
  AISentiment,
  AIUrgency,
  TicketPriority,
  TicketStatus,
} from "@/types/domain";

import type {
  CreateTicketInput,
  TicketReplyInput,
} from "../schemas/ticket-schema";
import type { TicketDetailData, TicketSortOption } from "../types";

const ticketSelectQuery = "*";

export async function createTicket(input: CreateTicketInput & { requestId: string; attachmentIds?: string[] }) {
  const response = await fetch("/api/tickets", {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload = (await response.json().catch(() => null)) as {
    aiTriageStatus?: "completed" | "failed" | "skipped";
    id?: string;
    message?: string;
  } | null;

  if (!response.ok || !payload?.id) {
    throw new Error(payload?.message ?? "문의를 등록하지 못했습니다.");
  }

  return {
    aiTriageStatus: payload.aiTriageStatus ?? "skipped",
    id: payload.id,
  };
}

export type TicketListFilters = {
  search?: string;
  status?: TicketStatus | "all" | "answer_pending";
  priority?: TicketPriority | "all";
  assignee?: string | "all" | "unassigned";
  category?: string;
  aiNeedsReview?: "all" | "yes" | "no";
  aiSentiment?: AISentiment | "all";
  aiUrgency?: AIUrgency | "all";
  sort?: TicketSortOption;
  page?: number;
  pageSize?: number;
};

type ListTicketsParams = {
  profile: Pick<Tables<"profiles">, "id" | "role">;
  filters: TicketListFilters;
};

export type TicketActionInput = {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
};

export type AgentOption = Pick<Tables<"profiles">, "id" | "email" | "name">;

export type CreateTicketReplyInput = TicketReplyInput & {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
  isInternal: boolean;
  source?: "manual" | "ai_draft";
  requestId: string;
  attachmentIds?: string[];
};

const defaultPageSize = 10;

export async function listTickets({ profile, filters }: ListTicketsParams) {
  const supabase = createSupabaseBrowserClient();
  const { page, pageSize } = normalizePagination(filters.page, filters.pageSize ?? defaultPageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("ticket_workspace").select(ticketSelectQuery, {
    count: "exact",
  });

  if (profile.role === "customer") {
    query = query.eq("customer_id", profile.id);
  }

  if (profile.role === "agent") {
    query = query.eq("assignee_id", profile.id);
  }

  if (profile.role === "admin" && filters.assignee && filters.assignee !== "all") {
    query =
      filters.assignee === "unassigned"
        ? query.is("assignee_id", null)
        : query.eq("assignee_id", filters.assignee);
  }

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  if (filters.status === "answer_pending") {
    query = query.in("status", ["open", "in_progress"]);
  } else if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority);
  }

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  if (filters.aiNeedsReview && filters.aiNeedsReview !== "all") {
    query = query.eq("ai_needs_review", filters.aiNeedsReview === "yes");
  }

  if (filters.aiSentiment && filters.aiSentiment !== "all") {
    query = query.eq("ai_sentiment", filters.aiSentiment);
  }

  if (filters.aiUrgency && filters.aiUrgency !== "all") {
    query = query.eq("ai_urgency", filters.aiUrgency);
  }

  if (filters.sort === "priority_first") {
    query = query
      .order("ai_needs_review", { ascending: false })
      .order("ai_urgency_rank", { ascending: false })
      .order("priority_rank", { ascending: false })
      .order("ai_confidence", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: true });
  } else if (filters.sort === "created_asc") {
    query = query.order("created_at", { ascending: true });
  } else if (filters.sort === "updated_desc") {
    query = query.order("updated_at", { ascending: false });
  } else if (filters.sort === "title_asc") {
    query = query.order("title", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.order("id", { ascending: false }).range(from, to);

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

export async function getTicketDetail({
  ticketId,
  profile,
}: {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
}): Promise<TicketDetailData> {
  const supabase = createSupabaseBrowserClient();

  let ticketQuery = supabase
    .from("ticket_workspace")
    .select(ticketSelectQuery)
    .eq("id", ticketId);

  if (profile.role === "customer") {
    ticketQuery = ticketQuery.eq("customer_id", profile.id);
  }

  if (profile.role === "agent") {
    ticketQuery = ticketQuery.eq("assignee_id", profile.id);
  }

  const { data: ticket, error: ticketError } = await ticketQuery.maybeSingle();

  if (ticketError) {
    throw ticketError;
  }

  if (!ticket) {
    return {
      ticket: null,
      replies: [],
      internalNotes: [],
      logs: [],
      attachments: [],
    };
  }

  let repliesQuery = supabase
    .from("ticket_replies")
    .select("*, author:profiles!ticket_replies_author_id_fkey(email,name,role)")
    .eq("ticket_id", ticketId)
    .order("reply_order", { ascending: true });

  if (profile.role === "customer") {
    repliesQuery = repliesQuery.eq("is_internal", false);
  }

  const { data: replies, error: repliesError } = await repliesQuery;

  if (repliesError) {
    throw repliesError;
  }

  const { data: logs, error: logsError } =
    profile.role === "customer"
      ? { data: [], error: null }
      : await supabase
          .from("ticket_logs")
          .select("*")
          .eq("ticket_id", ticketId)
          .order("created_at", { ascending: false });

  if (logsError) {
    throw logsError;
  }

  const { data: attachments, error: attachmentError } = await supabase.from("ticket_attachments")
    .select("id,name,mime_type,size,reply_id,is_internal").eq("ticket_id",ticketId).order("created_at");
  if (attachmentError) throw attachmentError;
  return {
    attachments: attachments ?? [],
    ticket,
    replies: (replies ?? []).filter((reply) => !reply.is_internal),
    internalNotes:
      profile.role === "customer"
        ? []
        : (replies ?? []).filter((reply) => reply.is_internal),
    logs: logs ?? [],
  };
}

export async function listAssignableAgents(): Promise<AgentOption[]> {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,name")
    .eq("role", "agent")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateTicketAction(input: TicketActionInput) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("support_ticket_command", {
    p_ticket_id: input.ticketId,
    p_action: "update",
    p_payload: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
    },
  });
  if (error) throw error;
  return data;
}

export async function createTicketReply(input: CreateTicketReplyInput) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("support_ticket_command", {
    p_ticket_id: input.ticketId,
    p_action: "reply",
    p_payload: {
      requestId: input.requestId,
      attachmentIds: input.attachmentIds ?? [],
      content: input.content,
      isInternal: input.isInternal,
      source: input.source ?? "manual",
    },
  });
  if (error) throw error;
  return data;
}
