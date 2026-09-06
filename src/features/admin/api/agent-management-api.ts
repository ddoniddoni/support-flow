import { collectPages } from "@/lib/data/pagination";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Tables } from "@/types/database";

type AdminProfile = Pick<Tables<"profiles">, "id" | "role">;
type AgentProfile = Pick<Tables<"profiles">, "email" | "id" | "name">;
type AgentTicket = Pick<
  Tables<"tickets">,
  | "ai_needs_review"
  | "assignee_id"
  | "priority"
  | "status"
  | "updated_at"
>;

export type AgentManagementRow = AgentProfile & {
  answerPendingCount: number;
  urgentCount: number;
  needsReviewCount: number;
  completedThisWeekCount: number;
  latestActivityAt: string | null;
};

export type AgentManagementSummary = {
  totalAgents: number;
  unassignedAnswerPendingCount: number;
  totalAnswerPendingCount: number;
  totalNeedsReviewCount: number;
};

export type AgentManagementResult = {
  agents: AgentManagementRow[];
  summary: AgentManagementSummary;
};

function getWeekStart() {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;

  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);

  return date;
}

function isAnswerPending(ticket: AgentTicket) {
  return ticket.status === "open" || ticket.status === "in_progress";
}

export async function getAgentManagement({
  profile,
}: {
  profile: AdminProfile;
}): Promise<AgentManagementResult> {
  if (profile.role !== "admin") {
    throw new Error("Admins can manage support assignees.");
  }

  const supabase = createSupabaseBrowserClient();
  const weekStart = getWeekStart();

  const [agentRows, ticketRows] = await Promise.all([
    collectPages<AgentProfile>((from, to) => supabase.from("profiles")
      .select("id,email,name").eq("role", "agent").order("id").range(from, to)),
    collectPages<AgentTicket>((from, to) => supabase.from("ticket_workspace")
      .select("assignee_id,status,priority,ai_needs_review,updated_at").order("id").range(from, to)),
  ]);
  const rows = agentRows.map<AgentManagementRow>((agent) => {
    const assignedTickets = ticketRows.filter(
      (ticket) => ticket.assignee_id === agent.id,
    );
    const answerPendingTickets = assignedTickets.filter(isAnswerPending);
    const completedThisWeekTickets = assignedTickets.filter(
      (ticket) =>
        ticket.status === "resolved" && new Date(ticket.updated_at) >= weekStart,
    );
    const latestActivityAt = assignedTickets
      .map((ticket) => ticket.updated_at)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

    return {
      ...agent,
      answerPendingCount: answerPendingTickets.length,
      urgentCount: answerPendingTickets.filter(
        (ticket) => ticket.priority === "urgent",
      ).length,
      needsReviewCount: answerPendingTickets.filter(
        (ticket) => ticket.ai_needs_review,
      ).length,
      completedThisWeekCount: completedThisWeekTickets.length,
      latestActivityAt,
    };
  });
  const answerPendingTickets = ticketRows.filter(isAnswerPending);

  return {
    agents: rows.sort((a, b) => {
      if (b.answerPendingCount !== a.answerPendingCount) {
        return b.answerPendingCount - a.answerPendingCount;
      }

      return a.name.localeCompare(b.name);
    }),
    summary: {
      totalAgents: agentRows.length,
      unassignedAnswerPendingCount: answerPendingTickets.filter(
        (ticket) => ticket.assignee_id === null,
      ).length,
      totalAnswerPendingCount: answerPendingTickets.length,
      totalNeedsReviewCount: answerPendingTickets.filter(
        (ticket) => ticket.ai_needs_review,
      ).length,
    },
  };
}
