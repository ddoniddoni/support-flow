import { collectPages } from "@/lib/data/pagination";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/database";
import type { Tables } from "@/types/database";
import { type AISentiment, type AIUrgency } from "@/types/domain";
import type { SupabaseClient } from "@supabase/supabase-js";

type DashboardProfile = Pick<Tables<"profiles">, "id" | "role">;
export type DashboardTicketPerson = Pick<
  Tables<"profiles">,
  "email" | "id" | "name"
>;
export type DashboardTicket = Pick<
  Tables<"tickets">,
  | "id"
  | "title"
  | "ticket_number"
  | "status"
  | "priority"
  | "category"
  | "ai_needs_review"
  | "ai_sentiment"
  | "ai_urgency"
  | "ai_confidence"
  | "created_at"
  | "updated_at"
> & {
  content?: string;
  customer: DashboardTicketPerson | null;
  assignee: DashboardTicketPerson | null;
  ai_needs_review: boolean;
  ai_sentiment: AISentiment | null;
  ai_urgency: AIUrgency | null;
  ai_confidence: number | null;
};
type DashboardSupabaseClient = SupabaseClient<Database>;

export type DistributionItem = {
  key: string;
  label: string;
  count: number;
  percentage: number;
};

export type AssigneeWorkloadItem = {
  key: string;
  assigneeId: string | null;
  label: string;
  email: string | null;
  answerPendingCount: number;
  urgentCount: number;
  needsReviewCount: number;
};

export type DashboardStats = {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  urgentTickets: number;
  createdToday: number;
  activeTickets: number;
  highUrgencyTickets: number;
  negativeSentimentTickets: number;
  reviewRequiredTickets: number;
  unassignedActiveTickets: number;
  statusDistribution: DistributionItem[];
  categoryDistribution: DistributionItem[];
  assigneeWorkload: AssigneeWorkloadItem[];
  recentTickets: DashboardTicket[];
};

const dashboardStatusKeys = ["answer_pending", "resolved", "closed"] as const;
const dashboardStatusLabels: Record<
  (typeof dashboardStatusKeys)[number],
  string
> = {
  answer_pending: "답변 대기",
  resolved: "답변 완료",
  closed: "종료",
};

const categoryLabels: Record<string, string> = {
  account: "계정",
  billing: "결제",
  technical: "기술 지원",
  product: "제품 문의",
  other: "기타",
};

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function buildDistribution(
  tickets: DashboardTicket[],
  keys: readonly string[],
  getKey: (ticket: DashboardTicket) => string,
  getLabel: (key: string) => string,
) {
  const total = tickets.length;

  return keys.map((key) => {
    const count = tickets.filter((ticket) => getKey(ticket) === key).length;

    return {
      key,
      label: getLabel(key),
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
    };
  });
}

function getCategoryKeys(tickets: DashboardTicket[]) {
  const knownKeys = ["account", "billing", "technical", "product", "other"];
  const dynamicKeys = tickets
    .map((ticket) => ticket.category)
    .filter((category) => !knownKeys.includes(category));

  return [...knownKeys, ...Array.from(new Set(dynamicKeys))];
}

function getDashboardStatusKey(ticket: DashboardTicket) {
  if (ticket.status === "resolved" || ticket.status === "closed") {
    return ticket.status;
  }

  return "answer_pending";
}

function buildAssigneeWorkload(tickets: DashboardTicket[]) {
  const workload = new Map<string, AssigneeWorkloadItem>();

  tickets.forEach((ticket) => {
    const assigneeId = ticket.assignee?.id ?? null;
    const key = assigneeId ?? "unassigned";
    const current = workload.get(key) ?? {
      key,
      assigneeId,
      label: ticket.assignee?.name ?? "담당자 필요",
      email: ticket.assignee?.email ?? null,
      answerPendingCount: 0,
      urgentCount: 0,
      needsReviewCount: 0,
    };

    current.answerPendingCount += 1;
    current.urgentCount += ticket.priority === "urgent" ? 1 : 0;
    current.needsReviewCount += ticket.ai_needs_review ? 1 : 0;
    workload.set(key, current);
  });

  return Array.from(workload.values()).sort((a, b) => {
    if (a.assigneeId === null && b.assigneeId !== null) {
      return -1;
    }

    if (a.assigneeId !== null && b.assigneeId === null) {
      return 1;
    }

    return b.answerPendingCount - a.answerPendingCount;
  });
}

export async function getDashboardStats(
  profile: DashboardProfile,
  supabase: DashboardSupabaseClient = createSupabaseBrowserClient(),
): Promise<DashboardStats> {
  let query = supabase
    .from("ticket_workspace")
    .select(
      `
        id,
        title,
        ticket_number,
        status,
        priority,
        category,
        ai_needs_review,
        ai_sentiment,
        ai_urgency,
        ai_confidence,
        created_at,
        updated_at,
        customer,
        assignee
      `,
    );

  if (profile.role === "customer") {
    query = query.eq("customer_id", profile.id);
  }

  if (profile.role === "agent") {
    query = query.eq("assignee_id", profile.id);
  }

  if (profile.role === "customer") {
    query = query.order("updated_at", {
      ascending: false,
    });
  } else {
    query = query
      .order("ai_needs_review", { ascending: false })
      .order("ai_urgency_rank", { ascending: false })
      .order("priority_rank", { ascending: false })
      .order("ai_confidence", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: true });
  }

  query = query.order("id", { ascending: false });
  const tickets = await collectPages<DashboardTicket>((from, to) =>
    query.range(from, to),
  );
  const activeTickets = tickets.filter(
    (ticket) => ticket.status !== "resolved" && ticket.status !== "closed",
  );
  const recent = activeTickets.slice(0, 5);
  // Fetch message previews only for the visible queue, not for every aggregated ticket.
  const previews = recent.length ? await supabase.from("ticket_workspace").select("id,content").in("id", recent.map(ticket => ticket.id)) : {data: [], error: null};
  if (previews.error) throw previews.error;
  const contents = new Map((previews.data ?? []).map(ticket => [ticket.id, ticket.content]));
  const todayStart = getTodayStart();

  return {
    totalTickets: tickets.length,
    openTickets: tickets.filter((ticket) => ticket.status === "open").length,
    inProgressTickets: tickets.filter(
      (ticket) => ticket.status === "in_progress",
    ).length,
    resolvedTickets: tickets.filter((ticket) => ticket.status === "resolved")
      .length,
    closedTickets: tickets.filter((ticket) => ticket.status === "closed")
      .length,
    urgentTickets: tickets.filter((ticket) => ticket.priority === "urgent")
      .length,
    createdToday: tickets.filter(
      (ticket) => new Date(ticket.created_at) >= todayStart,
    ).length,
    activeTickets: activeTickets.length,
    highUrgencyTickets: activeTickets.filter(
      (ticket) =>
        ticket.ai_urgency === "high" || ticket.ai_urgency === "critical",
    ).length,
    negativeSentimentTickets: activeTickets.filter(
      (ticket) => ticket.ai_sentiment === "negative",
    ).length,
    reviewRequiredTickets: activeTickets.filter(
      (ticket) => ticket.ai_needs_review,
    ).length,
    unassignedActiveTickets: activeTickets.filter(
      (ticket) => !ticket.assignee,
    ).length,
    statusDistribution: buildDistribution(
      tickets,
      dashboardStatusKeys,
      getDashboardStatusKey,
      (key) =>
        dashboardStatusLabels[key as (typeof dashboardStatusKeys)[number]],
    ),
    categoryDistribution: buildDistribution(
      tickets,
      getCategoryKeys(tickets),
      (ticket) => ticket.category,
      (key) => categoryLabels[key] ?? key,
    ),
    assigneeWorkload: buildAssigneeWorkload(activeTickets),
    recentTickets: recent.map(ticket => ({...ticket, content: contents.get(ticket.id)?.slice(0, 180)})),
  };
}
