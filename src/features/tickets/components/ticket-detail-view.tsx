"use client";

import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
import {
  ticketPriorities,
  ticketStatuses,
  type TicketPriority,
  type TicketStatus,
} from "@/types/domain";

import type { AgentOption } from "../api/tickets-api";
import { useAgents } from "../hooks/use-agents";
import { useTicket } from "../hooks/use-ticket";
import { useUpdateTicketAction } from "../hooks/use-update-ticket-action";
import type { TicketDetailData, TicketLogItem, TicketReplyItem } from "../types";
import { TicketDetailSkeleton } from "./ticket-detail-skeleton";
import { TicketReplyForm } from "./ticket-reply-form";

type TicketDetailViewProps = {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
};

type OperationField = "status" | "priority" | "assignee";

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

const actionLabels: Record<string, string> = {
  status_changed: "상태 변경",
  priority_changed: "우선순위 변경",
  assignee_changed: "담당자 변경",
  reply_added: "고객 답변 등록",
  internal_note_added: "내부 메모 추가",
};

const customerStatusLabels: Record<TicketStatus, string> = {
  open: "접수 완료",
  in_progress: "처리 중",
  resolved: "답변 완료",
  closed: "종료",
};

const authorRoleLabels: Record<Tables<"profiles">["role"], string> = {
  customer: "고객",
  agent: "상담원",
  admin: "관리자",
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

function formatTicketNumber(ticketNumber: number | null | undefined) {
  if (!ticketNumber) {
    return "접수번호 미지정";
  }

  return `SF-${String(ticketNumber).padStart(4, "0")}`;
}

function formatLogValue(value: string | null) {
  if (!value) {
    return "없음";
  }

  if (value in statusLabels) {
    return statusLabels[value as TicketStatus];
  }

  if (value in priorityLabels) {
    return priorityLabels[value as TicketPriority];
  }

  return value;
}

function formatReplyAuthor(reply: TicketReplyItem, isCustomerView: boolean) {
  if (isCustomerView) {
    return "SupportFlow 지원팀";
  }

  if (!reply.author) {
    return "지원팀";
  }

  return `${authorRoleLabels[reply.author.role]} ${reply.author.name} (${reply.author.email})`;
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

function CustomerStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant="outline" className="border-border bg-muted/60 text-foreground">
      {customerStatusLabels[status]}
    </Badge>
  );
}

function ReplyList({
  title,
  description,
  replies,
  emptyText,
  isCustomerView = false,
}: {
  title: string;
  description: string;
  replies: TicketReplyItem[];
  emptyText: string;
  isCustomerView?: boolean;
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
            <div
              key={reply.id}
              className="rounded-lg border border-border bg-muted/40 p-3"
            >
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {reply.content}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatReplyAuthor(reply, isCustomerView)} ·{" "}
                {formatDateTime(reply.created_at)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ReplyComposerCard({
  ticketId,
  profile,
  isInternal,
}: {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
  isInternal: boolean;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>
          {isInternal ? "내부 메모 추가" : "고객 답변 등록"}
        </CardTitle>
        <CardDescription>
          {isInternal
            ? "고객에게 보이지 않는 처리 맥락과 인수인계 내용을 남깁니다."
            : "고객에게 표시되는 공식 답변을 남깁니다."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TicketReplyForm
          ticketId={ticketId}
          profile={profile}
          isInternal={isInternal}
        />
      </CardContent>
    </Card>
  );
}

function PublicReplyCompletedCard() {
  return (
    <Card className="rounded-lg border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
      <CardHeader>
        <CardTitle>고객 답변 등록 완료</CardTitle>
        <CardDescription className="text-emerald-800 dark:text-emerald-200">
          이미 고객에게 표시되는 공식 답변이 등록되었습니다.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function ActivityLogList({ logs }: { logs: TicketLogItem[] }) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>활동 로그</CardTitle>
        <CardDescription>
          상태, 우선순위, 담당자, 답변 변경 이력을 추적합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {logs.length ? (
          logs.map((log) => (
            <div key={log.id} className="border-l-2 border-border pl-3">
              <p className="text-sm font-medium text-foreground">
                {actionLabels[log.action] ?? log.action}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatLogValue(log.before_value)} →{" "}
                {formatLogValue(log.after_value)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(log.created_at)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            아직 기록된 활동이 없습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TicketOperationsPanel({
  ticket,
  profile,
}: {
  ticket: NonNullable<TicketDetailData["ticket"]>;
  profile: Pick<Tables<"profiles">, "id" | "role">;
}) {
  const [pendingField, setPendingField] = useState<OperationField | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const agentsQuery = useAgents(profile.role === "admin");
  const updateAction = useUpdateTicketAction();
  const isAdmin = profile.role === "admin";
  const isPending = updateAction.isPending;

  function runAction(
    field: OperationField,
    input: {
      status?: TicketStatus;
      priority?: TicketPriority;
      assigneeId?: string | null;
    },
  ) {
    setPendingField(field);
    setMessage(null);
    setError(null);

    updateAction.mutate(
      {
        ticketId: ticket.id,
        profile,
        ...input,
      },
      {
        onSuccess: () => {
          setMessage("변경 사항을 저장했습니다.");
        },
        onError: (mutationError) => {
          setError(
            mutationError instanceof Error
              ? mutationError.message
              : "변경 사항을 저장하지 못했습니다.",
          );
        },
        onSettled: () => {
          setPendingField(null);
        },
      },
    );
  }

  function getAgentLabel(agentId: string | null) {
    if (!agentId) {
      return "미배정";
    }

    const agent = agentsQuery.data?.find((item) => item.id === agentId);
    return agent ? `${agent.name} (${agent.email})` : "담당자 정보 없음";
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>운영 액션</CardTitle>
        <CardDescription>
          권한에 따라 상태, 우선순위, 담당자를 관리합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="status">
            상태
          </label>
          <div className="relative">
            <select
              id="status"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              value={ticket.status}
              disabled={isPending}
              onChange={(event) =>
                runAction("status", {
                  status: event.target.value as TicketStatus,
                })
              }
            >
              {ticketStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            {pendingField === "status" ? (
              <Loader2
                className="absolute top-2 right-2 size-4 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            ) : null}
          </div>
        </div>

        {isAdmin ? (
          <>
            <div className="grid gap-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="priority"
              >
                우선순위
              </label>
              <div className="relative">
                <select
                  id="priority"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                  value={ticket.priority}
                  disabled={isPending}
                  onChange={(event) =>
                    runAction("priority", {
                      priority: event.target.value as TicketPriority,
                    })
                  }
                >
                  {ticketPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priorityLabels[priority]}
                    </option>
                  ))}
                </select>
                {pendingField === "priority" ? (
                  <Loader2
                    className="absolute top-2 right-2 size-4 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </div>

            <div className="grid gap-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="assignee"
              >
                담당자
              </label>
              <div className="relative">
                <select
                  id="assignee"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                  value={ticket.assignee_id ?? "unassigned"}
                  disabled={isPending || agentsQuery.isLoading}
                  onChange={(event) =>
                    runAction("assignee", {
                      assigneeId:
                        event.target.value === "unassigned"
                          ? null
                          : event.target.value,
                    })
                  }
                >
                  <option value="unassigned">미배정</option>
                  {(agentsQuery.data ?? []).map((agent: AgentOption) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.email})
                    </option>
                  ))}
                </select>
                {pendingField === "assignee" || agentsQuery.isLoading ? (
                  <Loader2
                    className="absolute top-2 right-2 size-4 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              {agentsQuery.isError ? (
                <p className="text-xs text-red-600">
                  담당자 목록을 불러오지 못했습니다.
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          현재 담당자: {getAgentLabel(ticket.assignee_id)}
        </div>

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

function TicketDetailContent({
  data,
  profile,
}: {
  data: TicketDetailData;
  profile: Pick<Tables<"profiles">, "id" | "role">;
}) {
  if (!data.ticket) {
    return (
      <EmptyState
        title="문의를 찾을 수 없습니다"
        description="존재하지 않는 문의이거나 현재 계정으로 접근할 수 없는 문의입니다."
        action={
          <Link
            className={buttonVariants({ className: "w-full sm:w-auto" })}
            href="/tickets"
          >
            문의 목록으로 이동
          </Link>
        }
      />
    );
  }

  const ticket = data.ticket;
  const canViewOperations = profile.role !== "customer";
  const isCustomer = profile.role === "customer";
  const hasPublicReply = data.replies.length > 0;

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <div className="flex flex-col gap-3">
        <Link
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          href="/tickets"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          문의 목록
        </Link>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {isCustomer ? (
              <CustomerStatusBadge status={ticket.status} />
            ) : (
              <>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </>
            )}
            <Badge variant="outline">
              {categoryLabels[ticket.category] ?? ticket.category}
            </Badge>
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-foreground">
            {ticket.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatTicketNumber(ticket.ticket_number)} · 접수{" "}
            {formatDateTime(ticket.created_at)} · 최근 수정{" "}
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
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                {ticket.content}
              </p>
            </CardContent>
          </Card>

          <ReplyList
            title="고객 공개 답변"
            description="고객에게 표시되는 상담 답변입니다."
            replies={data.replies}
            emptyText="아직 등록된 공개 답변이 없습니다."
            isCustomerView={isCustomer}
          />

          {canViewOperations && !hasPublicReply ? (
            <ReplyComposerCard
              ticketId={ticket.id}
              profile={profile}
              isInternal={false}
            />
          ) : null}

          {canViewOperations && hasPublicReply ? (
            <PublicReplyCompletedCard />
          ) : null}

          {canViewOperations ? (
            <>
              <ReplyList
                title="내부 메모"
                description="지원팀 내부에서만 공유하는 메모입니다."
                replies={data.internalNotes}
                emptyText="아직 등록된 내부 메모가 없습니다."
              />
              <ReplyComposerCard
                ticketId={ticket.id}
                profile={profile}
                isInternal
              />
            </>
          ) : null}
        </div>

        <div className="grid content-start gap-5">
          {canViewOperations ? (
            <TicketOperationsPanel ticket={ticket} profile={profile} />
          ) : null}

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>문의 정보</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {canViewOperations ? (
                <>
                  <div>
                    <p className="text-muted-foreground">접수 번호</p>
                    <p className="font-medium text-foreground">
                      {formatTicketNumber(ticket.ticket_number)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">고객</p>
                    <p className="font-medium text-foreground">
                      {ticket.customer?.name ?? "고객 정보 없음"}
                    </p>
                    {ticket.customer?.email ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ticket.customer.email}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-muted-foreground">담당자</p>
                    <p className="font-medium text-foreground">
                      {ticket.assignee?.name ?? "미배정"}
                    </p>
                    {ticket.assignee?.email ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ticket.assignee.email}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}
              <div>
                <p className="text-muted-foreground">
                  {isCustomer ? "처리 상태" : "상태"}
                </p>
                <p className="font-medium text-foreground">
                  {isCustomer
                    ? customerStatusLabels[ticket.status]
                    : statusLabels[ticket.status]}
                </p>
              </div>
              {canViewOperations ? (
                <div>
                  <p className="text-muted-foreground">우선순위</p>
                  <p className="font-medium text-foreground">
                    {priorityLabels[ticket.priority]}
                  </p>
                </div>
              ) : null}
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
            <p className="font-medium">
              문의 상세 정보를 불러오지 못했습니다.
            </p>
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
