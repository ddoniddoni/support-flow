import type { TicketPriority, TicketStatus } from "@/types/domain";
export const responseTargetHours: Record<TicketPriority, number> = { low: 48, medium: 24, high: 8, urgent: 4 };
type ResponseTicket = { status: TicketStatus; priority: TicketPriority; created_at: string; response_started_at?: string | null };
function duration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours ? `${hours}시간${remaining ? ` ${remaining}분` : ""}` : `${remaining}분`;
}
export function getResponseTarget(ticket: ResponseTicket, now = Date.now()) {
  const targetHours = responseTargetHours[ticket.priority];
  const startedAt = ticket.response_started_at ?? ticket.created_at;
  const description = `${startedAt === ticket.created_at ? "최초 접수" : "이번 응답 대기"}부터 ${targetHours}시간 · 영업시간 미반영`;
  if (ticket.status === "resolved" || ticket.status === "closed") {
    return { label: ticket.status === "closed" ? "종료" : "응답 완료", tone: "done" as const, description: "현재 응답 대기가 종료되었습니다.", deadline: null };
  }
  const deadline = Date.parse(startedAt) + targetHours * 3600000;
  if (!Number.isFinite(deadline)) return { label: "시간 확인 필요", tone: "normal" as const, description, deadline: null };
  const remaining = deadline - now;
  const overdue = remaining <= 0;
  const minutes = overdue ? Math.floor(-remaining / 60000) : Math.ceil(remaining / 60000);
  return {
    label: overdue ? `${minutes ? duration(minutes) : "1분 미만"} 초과` : `${duration(minutes)} 남음`,
    tone: overdue ? "breached" as const : remaining <= targetHours * 3600000 * 0.25 ? "risk" as const : "normal" as const,
    description, deadline: new Date(deadline).toISOString(),
  };
}
