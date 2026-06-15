import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Tables } from "@/types/database";
import type { TicketPriority, TicketStatus } from "@/types/domain";

import type {
  CreateTicketInput,
  TicketReplyInput,
} from "../schemas/ticket-schema";
import type { TicketDetailData, TicketSortOption } from "../types";

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

export async function getTicketDetail({
  ticketId,
  profile,
}: {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
}): Promise<TicketDetailData> {
  const supabase = createSupabaseBrowserClient();

  let ticketQuery = supabase.from("tickets").select("*").eq("id", ticketId);

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
    };
  }

  let repliesQuery = supabase
    .from("ticket_replies")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

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

  return {
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

function getActionEntries(input: TicketActionInput) {
  return [
    {
      key: "status",
      value: input.status,
      label: "status",
    },
    {
      key: "priority",
      value: input.priority,
      label: "priority",
    },
    {
      key: "assignee_id",
      value: input.assigneeId,
      label: "assignee",
    },
  ] as const;
}

export async function updateTicketAction(input: TicketActionInput) {
  const supabase = createSupabaseBrowserClient();

  if (input.profile.role === "customer") {
    throw new Error("Customers cannot update ticket operations.");
  }

  if (
    input.profile.role === "agent" &&
    (input.priority || input.assigneeId !== undefined)
  ) {
    throw new Error("Agents can only update ticket status.");
  }

  const { data: currentTicket, error: currentTicketError } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", input.ticketId)
    .maybeSingle();

  if (currentTicketError) {
    throw currentTicketError;
  }

  if (!currentTicket) {
    throw new Error("Ticket not found or access denied.");
  }

  const updates: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assignee_id?: string | null;
  } = {};

  if (input.status && input.status !== currentTicket.status) {
    updates.status = input.status;
  }

  if (input.priority && input.priority !== currentTicket.priority) {
    updates.priority = input.priority;
  }

  if (
    input.assigneeId !== undefined &&
    input.assigneeId !== currentTicket.assignee_id
  ) {
    updates.assignee_id = input.assigneeId;
  }

  if (!Object.keys(updates).length) {
    return currentTicket;
  }

  const { data: updatedTicket, error: updateError } = await supabase
    .from("tickets")
    .update(updates)
    .eq("id", input.ticketId)
    .select("*")
    .single();

  if (updateError) {
    throw updateError;
  }

  const changedLogs = getActionEntries(input)
    .filter(({ key, value }) => key in updates && value !== undefined)
    .map(({ key, value, label }) => ({
      ticket_id: input.ticketId,
      actor_id: input.profile.id,
      action: `${label}_changed`,
      before_value:
        currentTicket[key] === null ? null : String(currentTicket[key]),
      after_value: value === null ? null : String(value),
    }));

  if (changedLogs.length) {
    const { error: logError } = await supabase
      .from("ticket_logs")
      .insert(changedLogs);

    if (logError) {
      throw logError;
    }
  }

  return updatedTicket;
}

export async function createTicketReply(input: CreateTicketReplyInput) {
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

  if (input.profile.role === "customer") {
    throw new Error("Customers cannot create support replies.");
  }

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("id,assignee_id")
    .eq("id", input.ticketId)
    .maybeSingle();

  if (ticketError) {
    throw ticketError;
  }

  if (!ticket) {
    throw new Error("Ticket not found or access denied.");
  }

  const { data, error } = await supabase
    .from("ticket_replies")
    .insert({
      ticket_id: input.ticketId,
      author_id: user.id,
      content: input.content,
      is_internal: input.isInternal,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const { error: logError } = await supabase.from("ticket_logs").insert({
    ticket_id: input.ticketId,
    actor_id: user.id,
    action: input.isInternal ? "internal_note_added" : "reply_added",
    before_value: null,
    after_value: data.id,
  });

  if (logError) {
    console.warn("Failed to create ticket reply log:", logError.message);
  }

  return data;
}
