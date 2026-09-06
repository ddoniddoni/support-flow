import {
  Archive,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Inbox,
  TicketCheck,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  AISentiment,
  AIUrgency,
  Role,
  TicketPriority,
  TicketStatus,
} from "@/types/domain";

import type {
  AssigneeWorkloadItem,
  DashboardStats,
  DashboardTicket,
  DistributionItem,
} from "../api/dashboard-api";

const statusLabels: Record<TicketStatus, string> = {
  open: "답변 대기",
  in_progress: "답변 대기",
  resolved: "답변 완료",
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

const priorityBorderClassNames: Record<TicketPriority, string> = {
  low: "border-l-muted-foreground/30",
  medium: "border-l-sky-400",
  high: "border-l-orange-400",
  urgent: "border-l-red-500",
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
  profileRole?: Role;
  ticketHrefMode?: "detail" | "tickets";
};

type ToneBadgeProps = {
  children: ReactNode;
  tone: "amber" | "blue" | "emerald" | "muted" | "orange" | "red" | "sky";
};

function formatTicketNumber(ticketNumber: number | null | undefined) {
  if (!ticketNumber) {
    return "접수번호 없음";
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

function isCompletedTicket(ticket: DashboardTicket) {
  return ticket.status === "resolved" || ticket.status === "closed";
}

function getAssigneeLabel(ticket: DashboardTicket) {
  if (ticket.assignee?.name) {
    return ticket.assignee.name;
  }

  return isCompletedTicket(ticket) ? "담당자 없음" : "담당자 필요";
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
      {ticket.ai_sentiment ? (
        <ToneBadge tone={sentimentTones[ticket.ai_sentiment]}>
          감정 {sentimentLabels[ticket.ai_sentiment]}
        </ToneBadge>
      ) : null}
      {ticket.ai_urgency ? (
        <ToneBadge tone={urgencyTones[ticket.ai_urgency]}>
          긴급도 {urgencyLabels[ticket.ai_urgency]}
        </ToneBadge>
      ) : null}
    </div>
  );
}

function PriorityQueueItem({
  href,
  ticket,
}: {
  href: string;
  ticket: DashboardTicket;
}) {
  return (
    <Link
      className={cn(
        "grid gap-3 border-b border-l-2 border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/50",
        priorityBorderClassNames[ticket.priority],
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
        "lg:grid-cols-[minmax(0,1fr)_112px_132px] lg:items-center",
      )}
      href={href}
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{ticket.title}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {formatTicketNumber(ticket.ticket_number)} ·{" "}
          {categoryLabels[ticket.category] ?? ticket.category} ·{" "}
          {ticket.customer?.name ?? "고객 정보 없음"}
        </p>
      </div>

      <div className="min-w-0">
        <AIStatusBadges ticket={ticket} />
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="truncate text-xs text-muted-foreground">
          {getAssigneeLabel(ticket)}
        </span>
        <span className="sr-only">
          우선순위 {priorityLabels[ticket.priority]}
        </span>
      </div>
    </Link>
  );
}

function MetricCard({
  accentClassName,
  detail,
  icon: Icon,
  label,
  progress,
  progressLabel,
  tone,
  value,
}: {
  accentClassName: string;
  detail: string;
  icon: LucideIcon;
  label: string;
  progress: number;
  progressLabel: string;
  tone: string;
  value: string;
}) {
  const progressWidth = `${Math.min(Math.max(progress, 0), 100)}%`;

  return (
    <div className="group relative min-h-36 overflow-hidden rounded-lg border border-border bg-card p-4 shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-primary",
          accentClassName,
        )}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-3xl font-semibold tabular-nums text-foreground">
            {value}
          </p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/45 shadow-xs">
          <Icon className={cn("size-4", tone)} aria-hidden="true" />
        </span>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="truncate text-muted-foreground">{detail}</span>
          <span className="shrink-0 font-medium text-foreground">
            {progressLabel}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full bg-primary", accentClassName)}
            style={{ width: progressWidth }}
          />
        </div>
      </div>
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
    <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
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

function SignalPanel({
  actionHref,
  actionLabel,
  description,
  icon: Icon,
  items,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  description: string;
  icon: LucideIcon;
  items: Array<{
    label: string;
    tone?: ToneBadgeProps["tone"];
    value: number | string;
  }>;
  title: string;
}) {
  return (
    <div className="flex h-full min-h-44 flex-col rounded-lg border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/45">
              <Icon
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </span>
            <p className="truncate text-sm font-semibold text-foreground">
              {title}
            </p>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <Link
          className="shrink-0 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      </div>

      <div className="mt-4 grid flex-1 content-end gap-2">
        {items.map((item) => (
          <div
            className="flex items-center justify-between gap-3 rounded-md bg-muted/35 px-2.5 py-2"
            key={item.label}
          >
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {item.label}
            </span>
            {item.tone ? (
              <ToneBadge tone={item.tone}>{item.value}</ToneBadge>
            ) : (
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {item.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OperationsSignalGrid({
  isAdmin,
  stats,
}: {
  isAdmin: boolean;
  stats: DashboardStats;
}) {
  const answerPendingCount = stats.openTickets + stats.inProgressTickets;

  return (
    <div className="grid items-stretch gap-3 xl:grid-cols-3">
      <SignalPanel
        actionHref="/tickets"
        actionLabel="문의함"
        description="오늘 먼저 확인해야 할 운영량입니다."
        icon={AlertTriangle}
        items={[
          { label: "응답 필요", value: answerPendingCount },
          { label: "긴급 우선순위", tone: "red", value: stats.urgentTickets },
          { label: "오늘 접수", value: stats.createdToday },
        ]}
        title="처리 압력"
      />
      <SignalPanel
        actionHref="/tickets/ai-review"
        actionLabel="AI 검토"
        description="AI가 상담원 확인을 권장한 신호입니다."
        icon={Bot}
        items={[
          {
            label: "검토 필요",
            tone: "red",
            value: stats.reviewRequiredTickets,
          },
          {
            label: "부정 감정",
            tone: "orange",
            value: stats.negativeSentimentTickets,
          },
          {
            label: "높은 긴급도",
            tone: "orange",
            value: stats.highUrgencyTickets,
          },
        ]}
        title="AI 운영 신호"
      />
      <SignalPanel
        actionHref={isAdmin ? "/admin/agents" : "/tickets"}
        actionLabel={isAdmin ? "담당자" : "문의함"}
        description="배정 공백과 담당자 부하를 확인합니다."
        icon={UserRoundPlus}
        items={[
          { label: "활성 문의", value: stats.activeTickets },
          {
            label: "미배정",
            tone: "orange",
            value: stats.unassignedActiveTickets,
          },
          { label: "담당자 그룹", value: stats.assigneeWorkload.length },
        ]}
        title="배정 현황"
      />
    </div>
  );
}

function AssigneeManagementPanel({
  isAdmin,
  items,
}: {
  isAdmin: boolean;
  items: AssigneeWorkloadItem[];
}) {
  const maxCount = Math.max(
    ...items.map((item) => item.answerPendingCount),
    1,
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {isAdmin ? "상담원 현황" : "내 담당 문의"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {isAdmin
              ? "상담원별 답변 대기 문의를 확인합니다."
              : "내게 배정된 답변 대기 문의입니다."}
          </p>
        </div>
        {isAdmin ? (
          <Link
            className={buttonVariants({ size: "sm", variant: "outline" })}
            href="/admin/agents"
          >
            현황 보기
          </Link>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.slice(0, 5).map((item) => {
            const width = `${Math.max(
              Math.round((item.answerPendingCount / maxCount) * 100),
              12,
            )}%`;
            const content = (
              <>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate font-medium text-foreground">
                    {item.label}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {item.answerPendingCount}건
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width }}
                  />
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  주의 {item.needsReviewCount}건 · 긴급 {item.urgentCount}건
                </p>
              </>
            );

            return isAdmin ? (
              <Link
                key={item.key}
                className="block rounded-md p-2 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                href="/admin/agents"
              >
                {content}
              </Link>
            ) : (
              <div key={item.key} className="rounded-md p-2">
                {content}
              </div>
            );
          })
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">
            답변 대기 문의가 생기면 담당자별 현황이 표시됩니다.
          </p>
        )}
      </div>
    </div>
  );
}

function FocusTicketPanel({
  href,
  ticket,
}: {
  href: string | null;
  ticket: DashboardTicket | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-xs">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-primary"
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            현재 포커스
          </p>
          <h2 className="mt-2 line-clamp-2 text-base font-semibold text-foreground">
            {ticket?.title ?? "응답할 문의가 없습니다"}
          </h2>
        </div>
        {href ? (
          <Link
            className={cn(
              buttonVariants({ size: "icon-sm", variant: "outline" }),
              "shrink-0",
            )}
            href={href}
            aria-label="현재 포커스 문의 상세 열기"
          >
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      {ticket ? (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <AIStatusBadges ticket={ticket} />
            <span className="sr-only">
              우선순위 {priorityLabels[ticket.priority]}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-md border border-border bg-muted/35 p-3">
              <p className="text-xs text-muted-foreground">답변 상태</p>
              <p className="mt-1 truncate text-sm font-medium text-foreground">
                {statusLabels[ticket.status]}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/35 p-3">
              <p className="text-xs text-muted-foreground">담당자</p>
              <p className="mt-1 truncate text-sm font-medium text-foreground">
                {getAssigneeLabel(ticket)}
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
            {formatTicketNumber(ticket.ticket_number)} · 최근{" "}
            {formatDateTime(ticket.updated_at)} 업데이트
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-md border border-dashed border-border p-3 text-xs leading-5 text-muted-foreground">
          새 문의가 들어오면 가장 먼저 응답해야 할 항목이 표시됩니다.
        </div>
      )}
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
          응답할 문의가 없습니다
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          새 문의가 접수되면 우선순위와 AI 검토 기준에 따라 표시됩니다.
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

function QueueSummaryFooter({ stats }: { stats: DashboardStats }) {
  const answerPendingCount = stats.openTickets + stats.inProgressTickets;
  const reviewRate = answerPendingCount
    ? Math.round((stats.reviewRequiredTickets / answerPendingCount) * 100)
    : 0;

  return (
    <div className="mt-auto grid gap-2 border-t border-border bg-muted/20 px-4 py-3 sm:grid-cols-3">
      <div>
        <p className="text-xs text-muted-foreground">큐 범위</p>
        <p className="mt-1 text-sm font-medium text-foreground">
          상위 {stats.recentTickets.length}건 표시
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">AI 확인 비율</p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {reviewRate}%
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">남은 응답</p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {Math.max(answerPendingCount - stats.recentTickets.length, 0)}건
        </p>
      </div>
    </div>
  );
}

export function OperationsPreview({
  ctaHref,
  ctaLabel = "전체 보기",
  emptyHref,
  emptyLabel,
  profileRole = "agent",
  stats,
  ticketHrefMode = "detail",
}: OperationsPreviewProps) {
  const hasTickets = stats.recentTickets.length > 0;
  const selectedTicket = getSelectedTicket(stats);
  const isAdmin = profileRole === "admin";
  const answerPendingCount = stats.openTickets + stats.inProgressTickets;
  const resolvedRate = getResolvedRate(stats);
  const answerPendingRate = stats.totalTickets
    ? Math.round((answerPendingCount / stats.totalTickets) * 100)
    : 0;
  const closedRate = stats.totalTickets
    ? Math.round((stats.closedTickets / stats.totalTickets) * 100)
    : 0;
  const metrics = [
    {
      accentClassName: "bg-sky-500",
      detail: `오늘 접수 ${stats.createdToday}건`,
      icon: TicketCheck,
      label: "전체 문의",
      progress: stats.totalTickets ? 100 : 0,
      progressLabel: `${stats.createdToday} 신규`,
      tone: "text-sky-600",
      value: String(stats.totalTickets),
    },
    {
      accentClassName: "bg-blue-600",
      detail: "아직 답변 전인 문의",
      icon: Inbox,
      label: "응답 필요",
      progress: answerPendingRate,
      progressLabel: `${answerPendingRate}%`,
      tone: "text-blue-600",
      value: String(answerPendingCount),
    },
    {
      accentClassName: "bg-emerald-500",
      detail: `해결률 ${resolvedRate}%`,
      icon: CheckCircle2,
      label: "답변 완료",
      progress: resolvedRate,
      progressLabel: `${resolvedRate}%`,
      tone: "text-emerald-600",
      value: String(stats.resolvedTickets),
    },
    {
      accentClassName: "bg-slate-400",
      detail: "후속 추적 종료",
      icon: Archive,
      label: "종료",
      progress: closedRate,
      progressLabel: `${closedRate}%`,
      tone: "text-muted-foreground",
      value: String(stats.closedTickets),
    },
  ];
  const getTicketHref = (ticketId: string) =>
    ticketHrefMode === "detail" ? `/tickets/${ticketId}` : "/tickets";

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="grid items-stretch gap-4 p-4 lg:grid-cols-[1fr_320px]">
        <div className="grid min-h-full gap-4 lg:grid-rows-[auto_minmax(0,1fr)_auto]">
          <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>

          <div className="flex min-h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs">
            <div className="flex flex-col gap-2 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  응답할 문의
                </p>
                <p className="text-xs text-muted-foreground">
                  AI 검토 필요 여부, 긴급도, 우선순위를 기준으로 정렬됩니다.
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
              <div>
                {stats.recentTickets.map((ticket) => (
                  <PriorityQueueItem
                    key={ticket.id}
                    href={getTicketHref(ticket.id)}
                    ticket={ticket}
                  />
                ))}
              </div>
            )}
            {hasTickets ? <QueueSummaryFooter stats={stats} /> : null}
          </div>

          <OperationsSignalGrid isAdmin={isAdmin} stats={stats} />
        </div>

        <aside className="grid h-full content-start gap-4">
          <FocusTicketPanel
            href={selectedTicket ? getTicketHref(selectedTicket.id) : null}
            ticket={selectedTicket}
          />

          <AssigneeManagementPanel
            isAdmin={isAdmin}
            items={stats.assigneeWorkload}
          />

          <DistributionPanel
            description="현재 문의의 답변 상태별 비율입니다."
            items={stats.statusDistribution}
            title="답변 상태 분포"
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
