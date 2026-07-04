import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/database";
import type { Tables } from "@/types/database";
import { type AISentiment, type AIUrgency } from "@/types/domain";
import type { SupabaseClient } from "@supabase/supabase-js";

type DashboardProfile = Pick<Tables<"profiles">, "id" | "role">;
export type DashboardTicketPerson = Pick<Tables<"profiles">, "email" | "name">;
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

export type DashboardStats = {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  urgentTickets: number;
  createdToday: number;
  statusDistribution: DistributionItem[];
  categoryDistribution: DistributionItem[];
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

export async function getDashboardStats(
  profile: DashboardProfile,
  supabase: DashboardSupabaseClient = createSupabaseBrowserClient(),
): Promise<DashboardStats> {
  let query = supabase
    .from("tickets")
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
        customer:profiles!tickets_customer_id_fkey(email,name),
        assignee:profiles!tickets_assignee_id_fkey(email,name)
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
      .order("ai_urgency", { ascending: true, nullsFirst: false })
      .order("ai_confidence", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const tickets = (data ?? []) as DashboardTicket[];
  const activeTickets = tickets.filter(
    (ticket) => ticket.status !== "resolved" && ticket.status !== "closed",
  );
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
    recentTickets: activeTickets.slice(0, 5),
  };
}
