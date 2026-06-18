import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/database";
import type { Tables } from "@/types/database";
import {
  ticketStatuses,
  type TicketStatus,
} from "@/types/domain";
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
  | "created_at"
  | "updated_at"
> & {
  customer: DashboardTicketPerson | null;
  assignee: DashboardTicketPerson | null;
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
  urgentTickets: number;
  createdToday: number;
  statusDistribution: DistributionItem[];
  categoryDistribution: DistributionItem[];
  recentTickets: DashboardTicket[];
};

const statusLabels: Record<TicketStatus, string> = {
  open: "열림",
  in_progress: "진행 중",
  resolved: "해결됨",
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

  const { data, error } = await query.order("updated_at", {
    ascending: false,
  });

  if (error) {
    throw error;
  }

  const tickets = (data ?? []) as DashboardTicket[];
  const todayStart = getTodayStart();

  return {
    totalTickets: tickets.length,
    openTickets: tickets.filter((ticket) => ticket.status === "open").length,
    inProgressTickets: tickets.filter(
      (ticket) => ticket.status === "in_progress",
    ).length,
    resolvedTickets: tickets.filter((ticket) => ticket.status === "resolved")
      .length,
    urgentTickets: tickets.filter((ticket) => ticket.priority === "urgent")
      .length,
    createdToday: tickets.filter(
      (ticket) => new Date(ticket.created_at) >= todayStart,
    ).length,
    statusDistribution: buildDistribution(
      tickets,
      ticketStatuses,
      (ticket) => ticket.status,
      (key) => statusLabels[key as TicketStatus],
    ),
    categoryDistribution: buildDistribution(
      tickets,
      getCategoryKeys(tickets),
      (ticket) => ticket.category,
      (key) => categoryLabels[key] ?? key,
    ),
    recentTickets: tickets.slice(0, 5),
  };
}
