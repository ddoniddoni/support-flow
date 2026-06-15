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
import type { TicketPriority, TicketStatus } from "@/types/domain";

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
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
        status === "closed" && "border-zinc-200 bg-zinc-100 text-zinc-600",
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
        priority === "low" && "border-zinc-200 bg-zinc-50 text-zinc-600",
      )}
    >
      {priorityLabels[priority]}
    </Badge>
  );
}

function MobileTicketCard({ ticket }: { ticket: TicketListItem }) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="grid gap-3 rounded-lg border border-zinc-300 bg-white p-4 shadow-sm"
    >
      <div>
        <p className="font-medium text-zinc-950">{ticket.title}</p>
        <p className="mt-1 break-all text-xs text-zinc-500">{ticket.id}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        <Badge variant="outline">
          {categoryLabels[ticket.category] ?? ticket.category}
        </Badge>
      </div>
      <div className="grid gap-1 text-xs text-zinc-500">
        <p>생성일 {formatDate(ticket.created_at)}</p>
        <p>수정일 {formatDate(ticket.updated_at)}</p>
      </div>
    </Link>
  );
}

export function TicketListTable({ tickets }: { tickets: TicketListItem[] }) {
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {tickets.map((ticket) => (
          <MobileTicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-zinc-300 bg-white shadow-sm md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-72">제목</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>우선순위</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead>수정일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="font-medium text-zinc-950 hover:underline"
                  >
                    {ticket.title}
                  </Link>
                  <p className="mt-1 max-w-md truncate text-xs text-zinc-500">
                    {ticket.id}
                  </p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={ticket.status} />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell>
                  {categoryLabels[ticket.category] ?? ticket.category}
                </TableCell>
                <TableCell>{formatDate(ticket.created_at)}</TableCell>
                <TableCell>{formatDate(ticket.updated_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
