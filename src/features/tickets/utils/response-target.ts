import type { TicketPriority, TicketStatus } from "@/types/domain";
import type { Json } from "@/types/database";
export const responseTargetHours: Record<TicketPriority, number> = {
  low: 48,
  medium: 24,
  high: 8,
  urgent: 4,
};
type ResponseTicket = {
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  response_started_at?: string | null;
  response_due_at?: string | null;
  response_warning_at?: string | null;
  response_calendar?: Json;
  response_target_minutes?: number | null;
  response_remaining_minutes?: number | null;
};
const deadlineFormatters = new Map<string, Intl.DateTimeFormat>();
function formatDeadline(value: number, zone: string) {
 let formatter = deadlineFormatters.get(zone);
 if (!formatter) {
  formatter = new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: zone });
  deadlineFormatters.set(zone, formatter);
 }
 return formatter.format(new Date(value));
}
function duration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours
    ? `${hours}시간${remaining ? ` ${remaining}분` : ""}`
    : `${remaining}분`;
}
export function getResponseTarget(ticket: ResponseTicket, now = Date.now()) {
  if (ticket.status === "resolved" || ticket.status === "closed")
    return {
      label: ticket.status === "closed" ? "종료" : "응답 완료",
      tone: "done" as const,
      description: "현재 응답 대기가 종료되었습니다.",
      deadline: null,
    };
  const calendar = ticket.response_calendar;
  const business =
    !!calendar &&
    typeof calendar === "object" &&
    !Array.isArray(calendar) &&
    calendar.mode === "business";
  const zone =
    calendar &&
    typeof calendar === "object" &&
    !Array.isArray(calendar) &&
    typeof calendar.timeZone === "string"
      ? calendar.timeZone
      : "Asia/Seoul";
  const targetMinutes =
    ticket.response_target_minutes ?? responseTargetHours[ticket.priority] * 60;
  const startedAt = ticket.response_started_at ?? ticket.created_at;
  const deadline =
    ticket.response_due_at === undefined
      ? Date.parse(startedAt) + targetMinutes * 60000
      : ticket.response_due_at
        ? Date.parse(ticket.response_due_at)
        : NaN;
  const basis = business ? `영업시간 기준 · ${zone}` : "24시간 기준";
  const description = `이번 응답 목표 ${duration(targetMinutes)} · ${basis}`;
  if (!Number.isFinite(deadline))
    return {
      label: "시간 확인 필요",
      tone: "normal" as const,
      description,
      deadline: null,
    };
  const overdue = deadline <= now;
  const rawMinutes = business
    ? ticket.response_remaining_minutes
    : (deadline - now) / 60000;
  const risk = ticket.response_warning_at
    ? now >= Date.parse(ticket.response_warning_at)
    : deadline - now <= targetMinutes * 60000 * 0.25;
  const formattedDeadline = formatDeadline(deadline, zone);
  // Business minutes come from the same Postgres calendar as the scheduler, refreshed
  // with ticket queries. Do not decrement them during nights, weekends or holidays.
  const minutes =
    rawMinutes == null
      ? null
      : overdue
        ? Math.floor(Math.max(0, -rawMinutes))
        : Math.ceil(Math.max(0, rawMinutes));
  const label =
    minutes === null
      ? overdue
        ? "응답 기한 초과"
        : `${formattedDeadline}까지`
      : overdue
        ? `${minutes < 1440 ? "1일 미만" : `${Math.floor(minutes / 1440)}일`} 초과`
        : `${duration(minutes)} 남음`;
  return {
    label,
    tone: overdue
      ? ("breached" as const)
      : risk
        ? ("risk" as const)
        : ("normal" as const),
    description: `${description} · 기한 ${formattedDeadline}${business ? " · 남은 영업시간은 목록 갱신 시 반영" : ""}`,
    deadline: new Date(deadline).toISOString(),
  };
}
