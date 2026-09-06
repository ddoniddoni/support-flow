import {
  Archive,
  ArrowUpRight,
  CheckCircle2,
  Inbox,
  TicketCheck,
  MessageSquareText,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { SignalCard } from "@/components/common/signal-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  AISentiment,
  AIUrgency,
  Role,
  TicketPriority,
} from "@/types/domain";

import type {
  AssigneeWorkloadItem,
  DashboardStats,
  DashboardTicket,
  DistributionItem,
} from "../api/dashboard-api";

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
  low: "border-l-transparent",
  medium: "border-l-transparent",
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

function getResolvedRate(stats: DashboardStats) {
  if (!stats.totalTickets) {
    return 0;
  }

  return Math.round((stats.resolvedTickets / stats.totalTickets) * 100);
}

function ToneBadge({ children, tone }: ToneBadgeProps) {
  return (
    <Badge variant="outline"
      className={cn(
        "inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md border px-2 text-xs font-medium",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200",
        tone === "blue" && "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200",
        tone === "emerald" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200",
        tone === "muted" && "border-border bg-muted text-muted-foreground",
        tone === "orange" && "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/25 dark:bg-orange-400/10 dark:text-orange-200",
        tone === "red" && "border-red-200 bg-red-50 text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-200",
        tone === "sky" && "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-200",
      )}
    >
      {children}
    </Badge>
  );
}

function AIStatusBadges({ ticket }: { ticket: DashboardTicket }) {
  if (!ticket.ai_needs_review && ticket.ai_sentiment !== "negative" && ticket.ai_urgency !== "high" && ticket.ai_urgency !== "critical") return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {ticket.ai_needs_review ? <ToneBadge tone="amber">AI 검토 필요</ToneBadge> : null}
      {ticket.ai_sentiment === "negative" ? (
        <ToneBadge tone={sentimentTones[ticket.ai_sentiment]}>
          감정 {sentimentLabels[ticket.ai_sentiment]}
        </ToneBadge>
      ) : null}
      {ticket.ai_urgency === "high" || ticket.ai_urgency === "critical" ? (
        <ToneBadge tone={urgencyTones[ticket.ai_urgency]}>
          AI 긴급도 {urgencyLabels[ticket.ai_urgency]}
        </ToneBadge>
      ) : null}
    </div>
  );
}

const receivedAtFormatter = new Intl.DateTimeFormat("ko-KR", {month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});

function PriorityQueueItem({ href, ticket, showAssignee }: {
  href: string;
  ticket: DashboardTicket;
  showAssignee: boolean;
}) {
  const customerName = ticket.customer?.name ?? "고객";
  return (
    <Link href={href} className={cn("group block border-b border-l-2 border-border p-5 transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", priorityBorderClassNames[ticket.priority])}>
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground">{customerName.slice(0,1)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
            <span className="font-medium text-foreground">{customerName} <span className="ml-1 font-normal text-muted-foreground">고객 문의</span></span>
            <time dateTime={ticket.created_at} className="text-muted-foreground">접수 {receivedAtFormatter.format(new Date(ticket.created_at))}</time>
          </div>
          <h3 className="mt-2 line-clamp-2 break-words text-base font-semibold leading-7 text-foreground group-hover:text-primary">{ticket.title}</h3>
          {ticket.content ? <p className="mt-1 line-clamp-2 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">{ticket.content}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-300"><MessageSquareText className="size-3.5" aria-hidden="true" />답변 대기</span>
            <span>{formatTicketNumber(ticket.ticket_number)}</span>
            <span>{categoryLabels[ticket.category] ?? ticket.category}</span>
            {ticket.priority === "urgent" || ticket.priority === "high" ? <span className="font-medium text-rose-700 dark:text-rose-300">우선순위 {priorityLabels[ticket.priority]}</span> : null}
            {showAssignee ? <span>{ticket.assignee?.name ?? "담당자 필요"}</span> : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
            <AIStatusBadges ticket={ticket} />
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary">문의 열기<ChevronRight className="size-3.5" aria-hidden="true" /></span>
          </div>
        </div>
      </div>
    </Link>
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

export function OperationsPreview({
  ctaHref, ctaLabel = "전체 보기", emptyHref, emptyLabel, profileRole = "agent", stats, ticketHrefMode = "detail",
}: OperationsPreviewProps) {
  const isAdmin = profileRole === "admin";
  const pending = stats.openTickets + stats.inProgressTickets;
  const metrics = [
    { label: "답변 대기", value: pending, detail: "고객에게 답변이 필요한 문의", icon: Inbox, tone: "info" as const, href: "/tickets?status=answer_pending" },
    { label: isAdmin ? "전체 문의" : "내 배정 문의", value: stats.totalTickets, detail: `오늘 접수 ${stats.createdToday}건`, icon: TicketCheck, tone: "neutral" as const, href: "/tickets" },
    { label: "답변 완료", value: stats.resolvedTickets, detail: `전체 문의 중 ${getResolvedRate(stats)}%`, icon: CheckCircle2, tone: "success" as const, href: "/tickets?status=resolved" },
    { label: "종료", value: stats.closedTickets, detail: "상담을 종료한 문의", icon: Archive, tone: "neutral" as const, href: "/tickets?status=closed" },
  ];
  const actions = [
    { label: "AI 검토가 필요한 답변 대기", count: stats.reviewRequiredTickets, href: "/tickets?status=answer_pending&ai_review=yes", tone: "text-amber-800 dark:text-amber-200" },
    { label: "긴급 우선순위 문의", count: stats.urgentTickets, href: "/tickets?priority=urgent", tone: "text-rose-700 dark:text-rose-300" },
    ...(isAdmin ? [{ label: "담당자 없는 답변 대기", count: stats.unassignedActiveTickets, href: "/tickets?status=answer_pending&assignee=unassigned", tone: "text-amber-800 dark:text-amber-200" }] : []),
  ];
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="문의 처리 지표">
        {metrics.map(metric => <Link key={metric.label} href={metric.href} className="rounded-xl transition-shadow hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_p.font-semibold]:text-3xl [&_p.font-semibold]:leading-10"><SignalCard label={metric.label} value={`${metric.value}건`} description={metric.detail} icon={metric.icon} tone={metric.tone} /></Link>)}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label="응답할 문의" className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
            <div><h2 className="text-lg font-semibold">응답할 문의 <span className="ml-1 text-primary tabular-nums">{pending}건</span></h2><p className="mt-1 text-sm text-muted-foreground">AI 검토 필요 · AI 긴급도 · 우선순위 순으로 확인하세요.</p></div>
            {ctaHref ? <Link className={buttonVariants({variant:"outline"})} href={ctaHref}>{ctaLabel}</Link> : null}
          </div>
          {stats.recentTickets.length ? <>
            {stats.recentTickets.map(ticket => <PriorityQueueItem key={ticket.id} href={ticketHrefMode === "detail" ? `/tickets/${ticket.id}` : "/tickets"} ticket={ticket} showAssignee={isAdmin} />)}
            <p className="border-t border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">답변 대기 {pending}건 중 우선 확인할 {stats.recentTickets.length}건을 표시합니다.</p>
          </> : <EmptyQueue emptyHref={emptyHref} emptyLabel={emptyLabel} />}
        </section>
        <aside className="grid gap-4">
          <section className="rounded-xl border border-border bg-card p-5"><h2 className="text-base font-semibold">확인할 항목</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">항목을 선택하면 해당 문의만 볼 수 있습니다.</p><div className="mt-4 grid gap-2">{actions.map(action => <Link key={action.label} href={action.href} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-3 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="text-sm leading-6">{action.label}</span><span className={cn("shrink-0 text-lg font-semibold tabular-nums",action.count ? action.tone : "text-muted-foreground")}>{action.count}건</span></Link>)}</div></section>
          {isAdmin ? <AssigneeManagementPanel isAdmin items={stats.assigneeWorkload} /> : <p className="px-2 text-xs leading-6 text-muted-foreground">모든 지표와 문의는 현재 본인에게 배정된 범위입니다. 새 배정과 고객 메시지는 알림에서 확인할 수 있습니다.</p>}
        </aside>
      </div>
      <details className="group rounded-xl border border-border bg-card"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-5 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"><span>문의 분포 <span className="ml-2 text-xs font-normal text-muted-foreground">상태 · 문의 유형</span></span><ArrowUpRight className="size-4 transition-transform group-open:rotate-90" aria-hidden="true" /></summary><div className="grid gap-4 border-t border-border p-4 md:grid-cols-2"><DistributionPanel description="전체 문의의 답변 상태별 비율입니다." items={stats.statusDistribution} title="답변 상태 분포" /><DistributionPanel description="문의 유형별 접수 비중입니다." items={stats.categoryDistribution} title="카테고리 분포" /></div></details>
    </div>
  );
}
