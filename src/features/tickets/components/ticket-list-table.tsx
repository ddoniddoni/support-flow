"use client";

import { useResponseTarget } from "../hooks/use-response-target";

import Link from "next/link";

import { SelectionCheckbox } from "@/components/ui/selection-checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
import type {
  AISentiment,
  AIUrgency,
  TicketPriority,
  TicketStatus,
} from "@/types/domain";

import type { TicketListItem } from "../types";

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
  shipping: "배송",
  refund: "환불",
  complaint: "불만",
  other: "기타",
};

const customerStatusLabels: Record<TicketStatus, string> = {
  open: "답변 대기",
  in_progress: "답변 대기",
  resolved: "답변 완료",
  closed: "종료",
};

const adminColumnWidths = [
  "w-auto",
  "w-[92px]",
  "w-[92px]",
  "w-[88px]",
  "w-[132px]",
  "w-[88px]",
  "w-[104px]",
  "w-[104px]",
];

const customerColumnWidths = [
  "w-auto",
  "w-[112px]",
  "w-[112px]",
  "w-[112px]",
];

const sentimentLabels: Record<AISentiment, string> = {
  positive: "긍정",
  neutral: "중립",
  negative: "부정",
};

const urgencyLabels: Record<AIUrgency, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  critical: "긴급 검토",
};

const dateHeaderClassName = "text-right";
const dateCellClassName = "text-right tabular-nums";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatShortDateTime(value: string) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${month}.${day} ${hours}:${minutes}`;
}

function formatTicketNumber(ticketNumber: number | null | undefined) {
  if (!ticketNumber) {
    return "접수번호 없음";
  }

  return `SF-${String(ticketNumber).padStart(4, "0")}`;
}

function getAssigneeLabel(ticket: TicketListItem) {
  if (ticket.assignee?.name) {
    return ticket.assignee.name;
  }

  return ticket.status === "resolved" || ticket.status === "closed"
    ? "담당자 없음"
    : "담당자 필요";
}

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "open" && "border-blue-200 bg-blue-50 text-blue-700",
        status === "in_progress" &&
          "border-blue-200 bg-blue-50 text-blue-700",
        status === "resolved" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "closed" &&
          "border-border bg-muted text-muted-foreground",
      )}
    >
      {statusLabels[status]}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        priority === "urgent" && "border-red-200 bg-red-50 text-red-700",
        priority === "high" && "border-orange-200 bg-orange-50 text-orange-700",
        priority === "medium" && "border-sky-200 bg-sky-50 text-sky-700",
        priority === "low" &&
          "border-border bg-muted/60 text-muted-foreground",
      )}
    >
      {priorityLabels[priority]}
    </Badge>
  );
}

function SentimentBadge({ sentiment }: { sentiment: AISentiment }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap",
        sentiment === "negative" && "border-red-200 bg-red-50 text-red-700",
        sentiment === "neutral" && "border-border bg-muted/60 text-foreground",
        sentiment === "positive" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {sentimentLabels[sentiment]}
    </Badge>
  );
}

function UrgencyBadge({ urgency }: { urgency: AIUrgency }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap",
        urgency === "critical" && "border-red-200 bg-red-50 text-red-700",
        urgency === "high" && "border-orange-200 bg-orange-50 text-orange-700",
        urgency === "medium" && "border-sky-200 bg-sky-50 text-sky-700",
        urgency === "low" && "border-border bg-muted/60 text-muted-foreground",
      )}
    >
      {urgencyLabels[urgency]}
    </Badge>
  );
}

function SLABadge({ ticket }: { ticket: TicketListItem }) {
  const state = useResponseTarget(ticket);

  return (
    <Badge
      title={state.description}
      variant="outline"
      className={cn(
        "whitespace-nowrap",
        state.tone === "normal" &&
          "border-border bg-background text-muted-foreground",
        state.tone === "risk" &&
          "border-amber-200 bg-amber-50 text-amber-700",
        state.tone === "breached" && "border-red-200 bg-red-50 text-red-700",
        state.tone === "done" && "border-border bg-muted text-muted-foreground",
      )}
    >
      {state.label}
    </Badge>
  );
}

function AIStatusBadges({ ticket }: { ticket: TicketListItem }) {
  if (ticket.ai_review_decision === "rejected") return <Badge variant="secondary">검토 제외</Badge>;
  if (!ticket.latest_ai_analysis_id) {
    return (
      <Badge
        variant="outline"
        className="whitespace-nowrap border-border bg-muted/60 text-muted-foreground"
      >
        AI 대기
      </Badge>
    );
  }

  if (ticket.ai_needs_review) {
    return (
      <Badge
        variant="outline"
        className="whitespace-nowrap border-red-200 bg-red-50 text-red-700"
      >
        주의 필요
      </Badge>
    );
  }

  if (ticket.ai_urgency) {
    return <UrgencyBadge urgency={ticket.ai_urgency} />;
  }

  if (ticket.ai_sentiment) {
    return <SentimentBadge sentiment={ticket.ai_sentiment} />;
  }

  return (
    <Badge
      variant="outline"
      className="whitespace-nowrap border-border bg-muted/60 text-muted-foreground"
    >
      AI 완료
    </Badge>
  );
}

function TicketTagList({ ticket }: { ticket: TicketListItem }) {
  const tag = categoryLabels[ticket.category] ?? ticket.category;

  return (
    <Badge
      className="max-w-[4.75rem] truncate whitespace-nowrap border-border bg-background text-muted-foreground"
      variant="outline"
    >
      {tag}
    </Badge>
  );
}

function CustomerStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant="outline" className="border-border bg-muted/60 text-foreground">
      {customerStatusLabels[status]}
    </Badge>
  );
}

function MobileTicketCard({
  href,
  ticket,
  role,
  unreadCounts,
}: {
  href: string;
  ticket: TicketListItem;
  role: Tables<"profiles">["role"];
  unreadCounts?: Map<string, number>;
}) {
  const isCustomer = role === "customer";

  return (
    <Link
      href={href}
      className="grid gap-3 rounded-lg border border-border bg-card p-3 shadow-xs"
    >
      <div>
        {(unreadCounts?.get(ticket.id) ?? 0)>0 ? <Badge className="mb-2">새 알림 {unreadCounts?.get(ticket.id)}</Badge> : null}
        <p className="font-medium text-foreground">{ticket.title}</p>
        {isCustomer ? null : (
          <p className="mt-1 text-xs text-muted-foreground">
            {formatTicketNumber(ticket.ticket_number)}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {isCustomer ? (
          <CustomerStatusBadge status={ticket.status} />
        ) : (
          <>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <SLABadge ticket={ticket} />
            <AIStatusBadges ticket={ticket} />
          </>
        )}
        <TicketTagList ticket={ticket} />
      </div>
      <div className="grid gap-1 text-xs text-muted-foreground">
        <p>생성일 {formatDate(ticket.created_at)}</p>
        <p>수정일 {formatDate(ticket.updated_at)}</p>
      </div>
    </Link>
  );
}

export function TicketListTable({
  getTicketHref,
  selectedTicketId,
  selection,
  tickets,
  role,
  unreadCounts,
}: {
  getTicketHref?: (ticketId: string) => string;
  selectedTicketId?: string | null;
  selection?: { ids: string[]; disabled: boolean; onToggle: (id: string) => void; onToggleAll: () => void };
  tickets: TicketListItem[];
  role: Tables<"profiles">["role"];
  unreadCounts?: Map<string, number>;
}) {
  const isCustomer = role === "customer";
  const canSelect = role === "admin" && selection !== undefined;
  const allSelected = tickets.length > 0 && tickets.every(ticket => selection?.ids.includes(ticket.id));
  const isAgent = role === "agent";
  const columnWidths = isCustomer ? customerColumnWidths : isAgent ? ["w-auto", "w-[104px]", "w-[88px]", "w-[104px]", "w-[104px]", "w-[112px]"] : adminColumnWidths;
  const resolveTicketHref =
    getTicketHref ?? ((ticketId: string) => `/tickets/${ticketId}`);

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {tickets.map((ticket) => (
          <div key={ticket.id} className={cn(canSelect && "rounded-lg border border-border bg-card", selection?.ids.includes(ticket.id) && "ring-2 ring-primary/40")}>
            {canSelect ? <div className="flex items-center gap-1 px-2 pt-1"><SelectionCheckbox label={`${formatTicketNumber(ticket.ticket_number)} 선택`} checked={selection.ids.includes(ticket.id)} disabled={selection.disabled} onChange={() => selection.onToggle(ticket.id)} /><span className="text-xs text-muted-foreground">문의 선택</span></div> : null}
            <MobileTicketCard href={resolveTicketHref(ticket.id)} ticket={ticket} role={role} unreadCounts={unreadCounts} />
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card shadow-xs md:block">
        <Table className={cn("table-fixed", isAgent ? "min-w-[820px]" : "min-w-[960px]")}>
          <colgroup>
            {canSelect ? <col className="w-12" /> : null}
            {columnWidths.map((width, index) => (
              <col key={index} className={width} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow>
              {canSelect ? <TableHead><SelectionCheckbox label="현재 페이지 전체 선택" checked={allSelected} indeterminate={!allSelected && selection.ids.length > 0} disabled={selection.disabled} onChange={selection.onToggleAll} /></TableHead> : null}
              <TableHead>문의</TableHead>
              <TableHead>답변 상태</TableHead>
              {isCustomer ? null : <TableHead>우선순위</TableHead>}
              {isCustomer ? null : <TableHead title="이번 응답 대기의 시작 시각과 우선순위 기준입니다. 영업시간은 반영하지 않습니다.">응답 목표</TableHead>}
              {role === "admin" ? <TableHead>담당자</TableHead> : null}
              {role === "admin" ? <TableHead>태그</TableHead> : null}
              {isCustomer ? null : <TableHead>AI</TableHead>}
              {isCustomer ? <TableHead>카테고리</TableHead> : null}
              <TableHead className={dateHeaderClassName}>업데이트</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow
                className={cn(
                  (selectedTicketId === ticket.id || (canSelect && selection.ids.includes(ticket.id))) && "bg-accent/50 hover:bg-accent/60",
                )}
                key={ticket.id}
              >
                {canSelect ? <TableCell><SelectionCheckbox label={`${formatTicketNumber(ticket.ticket_number)} 선택`} checked={selection.ids.includes(ticket.id)} disabled={selection.disabled} onChange={() => selection.onToggle(ticket.id)} /></TableCell> : null}
                <TableCell className={cn("min-w-0", isAgent && "py-5 pr-5")}>
                  {(unreadCounts?.get(ticket.id) ?? 0)>0 ? <Badge className="mb-2">새 알림 {unreadCounts?.get(ticket.id)}</Badge> : null}
                  <Link
                    href={resolveTicketHref(ticket.id)}
                    className={cn("font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isAgent ? "line-clamp-2 whitespace-normal break-words text-sm leading-6" : "block truncate")}
                  >
                    {ticket.title}
                  </Link>
                  {isCustomer ? null : (
                    <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">
                      {formatTicketNumber(ticket.ticket_number)} ·{" "}
                      {ticket.customer?.name ?? "고객 정보 없음"}
                      {isAgent ? ` · ${categoryLabels[ticket.category] ?? ticket.category}` : null}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {isCustomer ? (
                    <CustomerStatusBadge status={ticket.status} />
                  ) : (
                    <StatusBadge status={ticket.status} />
                  )}
                </TableCell>
                {isCustomer ? null : (
                  <TableCell>
                    <PriorityBadge priority={ticket.priority} />
                  </TableCell>
                )}
                {isCustomer ? null : (
                  <TableCell>
                    <SLABadge ticket={ticket} />
                  </TableCell>
                )}
                {role !== "admin" ? null : (
                  <TableCell className="truncate">
                    {getAssigneeLabel(ticket)}
                  </TableCell>
                )}
                {role !== "admin" ? null : (
                  <TableCell>
                    <TicketTagList ticket={ticket} />
                  </TableCell>
                )}
                {isCustomer ? null : (
                  <TableCell>
                    <AIStatusBadges ticket={ticket} />
                  </TableCell>
                )}
                {isCustomer ? (
                  <TableCell className="truncate">
                    {categoryLabels[ticket.category] ?? ticket.category}
                  </TableCell>
                ) : null}
                <TableCell className={dateCellClassName}>
                  {isCustomer
                    ? formatDate(ticket.updated_at)
                    : formatShortDateTime(ticket.updated_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
