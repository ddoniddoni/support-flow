"use client";

import Link from "next/link";

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

const customerStatusLabels: Record<TicketStatus, string> = {
  open: "접수 완료",
  in_progress: "처리 중",
  resolved: "답변 완료",
  closed: "종료",
};

const adminColumnWidths = [
  "w-auto",
  "w-[92px]",
  "w-[100px]",
  "w-[112px]",
  "w-[180px]",
  "w-[104px]",
  "w-[112px]",
  "w-[112px]",
];

const customerColumnWidths = [
  "w-auto",
  "w-[112px]",
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

function formatTicketNumber(ticketNumber: number | null | undefined) {
  if (!ticketNumber) {
    return "접수번호 미지정";
  }

  return `SF-${String(ticketNumber).padStart(4, "0")}`;
}

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "open" && "border-blue-200 bg-blue-50 text-blue-700",
        status === "in_progress" &&
          "border-amber-200 bg-amber-50 text-amber-700",
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

function AIStatusBadges({ ticket }: { ticket: TicketListItem }) {
  if (!ticket.latest_ai_analysis_id) {
    return (
      <Badge variant="outline" className="border-border bg-muted/60 text-muted-foreground">
        미분석
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {ticket.ai_needs_review ? (
        <Badge
          variant="outline"
          className="border-red-200 bg-red-50 text-red-700"
        >
          주의 필요
        </Badge>
      ) : null}
      {ticket.ai_sentiment ? (
        <SentimentBadge sentiment={ticket.ai_sentiment} />
      ) : null}
      {ticket.ai_urgency ? <UrgencyBadge urgency={ticket.ai_urgency} /> : null}
    </div>
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
  ticket,
  role,
}: {
  ticket: TicketListItem;
  role: Tables<"profiles">["role"];
}) {
  const isCustomer = role === "customer";

  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <div>
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
            <AIStatusBadges ticket={ticket} />
          </>
        )}
        <Badge variant="outline">
          {categoryLabels[ticket.category] ?? ticket.category}
        </Badge>
      </div>
      <div className="grid gap-1 text-xs text-muted-foreground">
        <p>생성일 {formatDate(ticket.created_at)}</p>
        <p>수정일 {formatDate(ticket.updated_at)}</p>
      </div>
    </Link>
  );
}

export function TicketListTable({
  tickets,
  role,
}: {
  tickets: TicketListItem[];
  role: Tables<"profiles">["role"];
}) {
  const isCustomer = role === "customer";
  const columnWidths = isCustomer ? customerColumnWidths : adminColumnWidths;

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {tickets.map((ticket) => (
          <MobileTicketCard key={ticket.id} ticket={ticket} role={role} />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card shadow-sm md:block">
        <Table className="min-w-[980px] table-fixed">
          <colgroup>
            {columnWidths.map((width, index) => (
              <col key={index} className={width} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>{isCustomer ? "처리 상태" : "상태"}</TableHead>
              {isCustomer ? null : (
                <TableHead>우선순위</TableHead>
              )}
              {isCustomer ? null : <TableHead>담당자</TableHead>}
              {isCustomer ? null : <TableHead>AI</TableHead>}
              <TableHead>카테고리</TableHead>
              <TableHead className={dateHeaderClassName}>생성일</TableHead>
              <TableHead className={dateHeaderClassName}>수정일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="min-w-0">
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="block truncate font-medium text-foreground hover:underline"
                  >
                    {ticket.title}
                  </Link>
                  {isCustomer ? null : (
                    <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">
                      {formatTicketNumber(ticket.ticket_number)} ·{" "}
                      {ticket.customer?.name ?? "고객 정보 없음"}
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
                  <TableCell className="truncate">
                    {ticket.assignee?.name ?? "미배정"}
                  </TableCell>
                )}
                {isCustomer ? null : (
                  <TableCell>
                    <AIStatusBadges ticket={ticket} />
                  </TableCell>
                )}
                <TableCell className="truncate">
                  {categoryLabels[ticket.category] ?? ticket.category}
                </TableCell>
                <TableCell className={dateCellClassName}>
                  {formatDate(ticket.created_at)}
                </TableCell>
                <TableCell className={dateCellClassName}>
                  {formatDate(ticket.updated_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
