import {
  Clock3,
  Flame,
  Inbox,
  TicketCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  AISentiment,
  AIUrgency,
  TicketPriority,
  TicketStatus,
} from "@/types/domain";

import type {
  DashboardStats,
  DashboardTicket,
  DistributionItem,
} from "../api/dashboard-api";

const statusLabels: Record<TicketStatus, string> = {
  open: "열림",
  in_progress: "진행 중",
  resolved: "해결됨",
  closed: "종료",
};

const priorityLabels: Record<TicketPriority, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
};

const categoryLabels: Record<string, string> = {
  account: "계정",
  billing: "결제",
  technical: "기술 지원",
  product: "제품 문의",
  other: "기타",
};

const statusTones: Record<TicketStatus, ToneBadgeProps["tone"]> = {
  open: "blue",
  in_progress: "amber",
  resolved: "emerald",
  closed: "muted",
};

const priorityTones: Record<TicketPriority, ToneBadgeProps["tone"]> = {
  low: "muted",
  medium: "sky",
  high: "orange",
  urgent: "red",
};

const sentimentLabels: Record<AISentiment, string> = {
  positive: "긍정",
  neutral: "중립",
  negative: "부정",
};

const sentimentTones: Record<AISentiment, ToneBadgeProps["tone"]> = {
  positive: "emerald",
  neutral: "muted",
  negative: "red",
};

const urgencyLabels: Record<AIUrgency, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  critical: "긴급 검토",
};

const urgencyTones: Record<AIUrgency, ToneBadgeProps["tone"]> = {
  low: "muted",
  medium: "sky",
  high: "orange",
  critical: "red",
};

type OperationsPreviewProps = {
  stats: DashboardStats;
  ctaHref?: string;
  ctaLabel?: string;
  emptyHref?: string;
  emptyLabel?: string;
  ticketHrefMode?: "detail" | "tickets";
};

type ToneBadgeProps = {
  children: ReactNode;
  tone: "amber" | "blue" | "emerald" | "muted" | "orange" | "red" | "sky";
};

function formatTicketNumber(ticketNumber: number | null | undefined) {
  if (!ticketNumber) {
    return "접수번호 미지정";
  }

  return `SF-${String(ticketNumber).padStart(4, "0")}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getResolvedRate(stats: DashboardStats) {
  if (!stats.totalTickets) {
    return 0;
  }

  return Math.round((stats.resolvedTickets / stats.totalTickets) * 100);
}

function getSelectedTicket(stats: DashboardStats) {
  return (
    stats.recentTickets.find((ticket) => ticket.priority === "urgent") ??
    stats.recentTickets[0] ??
    null
  );
}

function getWorkloadItems(tickets: DashboardTicket[]) {
  const counts = new Map<string, number>();

  tickets.forEach((ticket) => {
    const assignee = ticket.assignee?.name ?? "미배정";
    counts.set(assignee, (counts.get(assignee) ?? 0) + 1);
  });

  const items = Array.from(counts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  const maxCount = Math.max(...items.map(([, count]) => count), 1);

  return items.map(([label, count]) => ({
    label,
    value: `${count}건`,
    width: `${Math.max(Math.round((count / maxCount) * 100), 12)}%`,
  }));
}

function ToneBadge({ children, tone }: ToneBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md border px-2 text-xs font-medium",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "blue" && "border-blue-200 bg-blue-50 text-blue-700",
        tone === "emerald" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "muted" && "border-border bg-muted text-muted-foreground",
        tone === "orange" && "border-orange-200 bg-orange-50 text-orange-700",
        tone === "red" && "border-red-200 bg-red-50 text-red-700",
        tone === "sky" && "border-sky-200 bg-sky-50 text-sky-700",
      )}
    >
      {children}
    </span>
  );
}

function AIStatusBadges({ ticket }: { ticket: DashboardTicket }) {
  if (!ticket.ai_sentiment && !ticket.ai_urgency) {
    return <ToneBadge tone="muted">AI 대기</ToneBadge>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {ticket.ai_needs_review ? (
        <ToneBadge tone="red">주의 필요</ToneBadge>
      ) : null}
      {ticket.ai_sentiment ? (
        <ToneBadge tone={sentimentTones[ticket.ai_sentiment]}>
          {sentimentLabels[ticket.ai_sentiment]}
        </ToneBadge>
      ) : null}
      {ticket.ai_urgency ? (
        <ToneBadge tone={urgencyTones[ticket.ai_urgency]}>
          {urgencyLabels[ticket.ai_urgency]}
        </ToneBadge>
      ) : null}
    </div>
  );
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: string;
  value: string;
}) {
  return (
    <div className="min-h-28 rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className={cn("size-4", tone)} aria-hidden="true" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function DistributionPanel({
  description,
  items,
  title,
}: {
  description: string;
  items: DistributionItem[];
  title: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item.key}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-foreground">{item.label}</span>
              <span className="text-muted-foreground">
                {item.count}건 · {item.percentage}%
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyQueue({
  emptyHref,
  emptyLabel,
}: {
  emptyHref?: string;
  emptyLabel?: string;
}) {
  return (
    <div className="grid min-h-56 place-items-center p-6 text-center">
      <div>
        <Inbox className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-foreground">
          아직 표시할 문의가 없습니다
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          문의가 접수되거나 배정되면 이곳에서 운영 흐름을 확인할 수 있습니다.
        </p>
        {emptyHref && emptyLabel ? (
          <Link
            className={buttonVariants({
              className: "mt-4",
              size: "sm",
              variant: "outline",
            })}
            href={emptyHref}
          >
            {emptyLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function OperationsPreview({
  ctaHref,
  ctaLabel = "전체 보기",
  emptyHref,
  emptyLabel,
  stats,
  ticketHrefMode = "detail",
}: OperationsPreviewProps) {
  const hasTickets = stats.recentTickets.length > 0;
  const selectedTicket = getSelectedTicket(stats);
  const workloadItems = getWorkloadItems(stats.recentTickets);
  const metrics = [
    {
      detail: `오늘 새 접수 ${stats.createdToday}건`,
      icon: TicketCheck,
      label: "전체 문의",
      tone: "text-sky-600",
      value: String(stats.totalTickets),
    },
    {
      detail: "아직 처리가 시작되지 않은 요청",
      icon: Inbox,
      label: "열린 문의",
      tone: "text-blue-600",
      value: String(stats.openTickets),
    },
    {
      detail: "상담원이 현재 처리 중",
      icon: Clock3,
      label: "진행 중",
      tone: "text-amber-600",
      value: String(stats.inProgressTickets),
    },
    {
      detail: `해결률 ${getResolvedRate(stats)}%`,
      icon: Flame,
      label: "긴급 문의",
      tone: "text-red-600",
      value: String(stats.urgentTickets),
    },
  ];
  const getTicketHref = (ticketId: string) =>
    ticketHrefMode === "detail" ? `/tickets/${ticketId}` : "/tickets";

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="grid items-start gap-4 p-4 lg:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-4">
          <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="flex flex-col gap-2 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  우선 처리 큐
                </p>
                <p className="text-xs text-muted-foreground">
                  AI 주의 신호와 긴급도를 기준으로 먼저 볼 문의
                </p>
              </div>
              {ctaHref ? (
                <Link
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                  href={ctaHref}
                >
                  {ctaLabel}
                </Link>
              ) : null}
            </div>

            {!hasTickets ? (
              <EmptyQueue emptyHref={emptyHref} emptyLabel={emptyLabel} />
            ) : (
              <>
                <div className="grid gap-2 p-3 sm:hidden">
                  {stats.recentTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      className="rounded-md border border-border bg-card p-3"
                      href={getTicketHref(ticket.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium leading-5 text-foreground">
                            {ticket.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatTicketNumber(ticket.ticket_number)} ·{" "}
                            {categoryLabels[ticket.category] ?? ticket.category}
                          </p>
                        </div>
                        <ToneBadge tone={statusTones[ticket.status]}>
                          {statusLabels[ticket.status]}
                        </ToneBadge>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                        <span className="truncate text-muted-foreground">
                          {ticket.customer?.name ?? "고객 정보 없음"}
                        </span>
                        <ToneBadge tone={priorityTones[ticket.priority]}>
                          {priorityLabels[ticket.priority]}
                        </ToneBadge>
                      </div>
                      <div className="mt-3">
                        <AIStatusBadges ticket={ticket} />
                      </div>
                    </Link>
                  ))}
                </div>

                <Table className="hidden sm:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>문의</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        고객
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        담당자
                      </TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>AI 신호</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        우선순위
                      </TableHead>
                      <TableHead className="hidden text-right lg:table-cell">
                        업데이트
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <div className="min-w-52">
                            <Link
                              className="font-medium text-foreground hover:underline"
                              href={getTicketHref(ticket.id)}
                            >
                              {ticket.title}
                            </Link>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatTicketNumber(ticket.ticket_number)} ·{" "}
                              {categoryLabels[ticket.category] ??
                                ticket.category}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {ticket.customer?.name ?? "고객 정보 없음"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {ticket.assignee?.name ?? "미배정"}
                        </TableCell>
                        <TableCell>
                          <ToneBadge tone={statusTones[ticket.status]}>
                            {statusLabels[ticket.status]}
                          </ToneBadge>
                        </TableCell>
                        <TableCell>
                          <AIStatusBadges ticket={ticket} />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <ToneBadge tone={priorityTones[ticket.priority]}>
                            {priorityLabels[ticket.priority]}
                          </ToneBadge>
                        </TableCell>
                        <TableCell className="hidden text-right text-muted-foreground lg:table-cell">
                          {formatDateTime(ticket.updated_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  선택된 문의
                </p>
                <h2 className="mt-2 text-base font-semibold text-foreground">
                  {selectedTicket?.title ?? "대기 중인 문의가 없습니다"}
                </h2>
              </div>
              {selectedTicket ? (
                <div className="grid justify-items-end gap-1.5">
                  <ToneBadge tone={priorityTones[selectedTicket.priority]}>
                    {priorityLabels[selectedTicket.priority]}
                  </ToneBadge>
                  <AIStatusBadges ticket={selectedTicket} />
                </div>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">상태</p>
                  <p className="mt-1 font-medium text-foreground">
                    {selectedTicket
                      ? statusLabels[selectedTicket.status]
                      : "대기 없음"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">담당자</p>
                  <p className="mt-1 font-medium text-foreground">
                    {selectedTicket?.assignee?.name ?? "미배정"}
                  </p>
                </div>
              </div>
              <div className="rounded-md bg-muted p-3 text-xs leading-5 text-muted-foreground">
                {selectedTicket
                  ? `${formatTicketNumber(
                      selectedTicket.ticket_number,
                    )} 문의는 최근 ${formatDateTime(
                      selectedTicket.updated_at,
                    )}에 업데이트되었습니다.`
                  : "새 문의가 들어오면 이 영역에서 우선 확인할 항목을 보여줍니다."}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm font-semibold text-foreground">상담원 현황</p>
            <div className="mt-4 grid gap-3">
              {workloadItems.length ? (
                workloadItems.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="text-muted-foreground">
                        {item.value}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: item.width }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs leading-5 text-muted-foreground">
                  배정된 문의가 생기면 상담원별 업무량이 표시됩니다.
                </p>
              )}
            </div>
          </div>

          <DistributionPanel
            description="현재 문의의 처리 단계별 비율입니다."
            items={stats.statusDistribution}
            title="상태 분포"
          />
          <DistributionPanel
            description="문의 유형별 접수 비중입니다."
            items={stats.categoryDistribution}
            title="카테고리 분포"
          />
        </aside>
      </div>
    </div>
  );
}
