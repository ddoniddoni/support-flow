"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
import type { TicketPriority, TicketStatus } from "@/types/domain";

import { useTicket } from "../hooks/use-ticket";
import type { TicketDetailData, TicketLogItem, TicketReplyItem } from "../types";
import { TicketDetailSkeleton } from "./ticket-detail-skeleton";

type TicketDetailViewProps = {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
};

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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

function ReplyList({
  title,
  description,
  replies,
  emptyText,
}: {
  title: string;
  description: string;
  replies: TicketReplyItem[];
  emptyText: string;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {replies.length ? (
          replies.map((reply) => (
            <div key={reply.id} className="rounded-lg border bg-zinc-50 p-3">
              <p className="whitespace-pre-wrap text-sm text-zinc-800">
                {reply.content}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                작성자 {reply.author_id} · {formatDateTime(reply.created_at)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-500">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityLogList({ logs }: { logs: TicketLogItem[] }) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>활동 로그</CardTitle>
        <CardDescription>상태, 우선순위, 배정 변경 이력을 추적합니다.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {logs.length ? (
          logs.map((log) => (
            <div key={log.id} className="border-l-2 border-zinc-200 pl-3">
              <p className="text-sm font-medium text-zinc-900">{log.action}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {log.before_value ?? "없음"} → {log.after_value ?? "없음"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {formatDateTime(log.created_at)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-500">아직 기록된 활동이 없습니다.</p>
        )}
      </CardContent>
    </Card>
  );
}

function TicketDetailContent({
  data,
  profile,
}: {
  data: TicketDetailData;
  profile: Pick<Tables<"profiles">, "role">;
}) {
  if (!data.ticket) {
    return (
      <EmptyState
        title="티켓을 찾을 수 없습니다"
        description="존재하지 않는 티켓이거나 현재 계정으로 접근할 수 없는 티켓입니다."
        action={
          <Link className={buttonVariants()} href="/tickets">
            티켓 목록으로 이동
          </Link>
        }
      />
    );
  }

  const ticket = data.ticket;
  const canViewOperations = profile.role !== "customer";

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <div className="flex flex-col gap-3">
        <Link
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900"
          href="/tickets"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          티켓 목록
        </Link>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <Badge variant="outline">
              {categoryLabels[ticket.category] ?? ticket.category}
            </Badge>
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-zinc-950">
            {ticket.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            접수 {formatDateTime(ticket.created_at)} · 최근 수정{" "}
            {formatDateTime(ticket.updated_at)}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>문의 내용</CardTitle>
              <CardDescription>고객이 처음 접수한 요청입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-800">
                {ticket.content}
              </p>
            </CardContent>
          </Card>

          <ReplyList
            title="고객 공개 답변"
            description="고객에게 표시되는 상담 답변입니다."
            replies={data.replies}
            emptyText="아직 등록된 공개 답변이 없습니다."
          />

          {canViewOperations ? (
            <ReplyList
              title="내부 메모"
              description="지원팀 내부에서만 공유되는 메모입니다."
              replies={data.internalNotes}
              emptyText="아직 등록된 내부 메모가 없습니다."
            />
          ) : null}
        </div>

        <div className="grid content-start gap-5">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>티켓 메타데이터</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div>
                <p className="text-zinc-500">티켓 ID</p>
                <p className="break-all font-medium text-zinc-950">{ticket.id}</p>
              </div>
              <div>
                <p className="text-zinc-500">고객 ID</p>
                <p className="break-all font-medium text-zinc-950">
                  {ticket.customer_id}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">담당자</p>
                <p className="break-all font-medium text-zinc-950">
                  {ticket.assignee_id ?? "미배정"}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">상태</p>
                <p className="font-medium text-zinc-950">
                  {statusLabels[ticket.status]}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">우선순위</p>
                <p className="font-medium text-zinc-950">
                  {priorityLabels[ticket.priority]}
                </p>
              </div>
            </CardContent>
          </Card>

          {canViewOperations ? <ActivityLogList logs={data.logs} /> : null}
        </div>
      </div>
    </div>
  );
}

export function TicketDetailView({ ticketId, profile }: TicketDetailViewProps) {
  const ticketQuery = useTicket({ ticketId, profile });

  if (ticketQuery.isLoading) {
    return <TicketDetailSkeleton />;
  }

  if (ticketQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
          <div>
            <p className="font-medium">티켓 상세를 불러오지 못했습니다.</p>
            <p className="mt-1 text-red-600">
              권한 정책과 네트워크 상태를 확인한 뒤 다시 시도해 주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TicketDetailContent
      data={
        ticketQuery.data ?? {
          ticket: null,
          replies: [],
          internalNotes: [],
          logs: [],
        }
      }
      profile={profile}
    />
  );
}
