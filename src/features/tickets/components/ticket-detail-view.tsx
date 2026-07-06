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
import { AIAssistantPanel } from "@/features/ai/components/ai-assistant-panel";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
import {
  ticketPriorities,
  type TicketPriority,
  type TicketStatus,
} from "@/types/domain";

import type { AgentOption } from "../api/tickets-api";
import { useAgents } from "../hooks/use-agents";
import { useTicket } from "../hooks/use-ticket";
import { useUpdateTicketAction } from "../hooks/use-update-ticket-action";
import type {
  TicketDetail,
  TicketDetailData,
  TicketLogItem,
  TicketReplyItem,
} from "../types";
import { TicketDetailSkeleton } from "./ticket-detail-skeleton";
import { TicketReplyForm } from "./ticket-reply-form";

type TicketDetailViewProps = {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
};

type OperationField = "status" | "priority" | "assignee";

const statusLabels: Record<TicketStatus, string> = {
  open: "답변 대기",
  in_progress: "답변 대기",
  resolved: "답변 완료",
  closed: "종료",
};

const visibleStatusOptions = ["open", "resolved", "closed"] as const;

const priorityLabels: Record<TicketPriority, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
};

const slaTargetsByPriority: Record<TicketPriority, number> = {
  low: 48,
  medium: 24,
  high: 8,
  urgent: 4,
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

const tagLabels: Record<string, string> = {
  technical: "기술 지원",
  billing: "결제",
  account: "계정",
  product: "제품 문의",
  shipping: "배송",
  refund: "환불",
  complaint: "불만",
  other: "기타",
  question: "문의",
  "refund-request": "환불 요청",
  "bug-report": "오류 신고",
  "account-help": "계정 지원",
  "billing-issue": "결제 문제",
  "cancellation-request": "해지 요청",
  "feature-request": "기능 요청",
  "priority-review": "검토 필요",
  "repeat-contact": "반복 문의",
  "needs-human-review": "검토 필요",
  vip: "VIP",
};

const actionLabels: Record<string, string> = {
  status_changed: "상태 변경",
  priority_changed: "우선순위 변경",
  assignee_changed: "담당자 변경",
  reply_added: "고객 답변 등록",
  internal_note_added: "내부 메모 추가",
  ai_analysis_generated: "AI 분석 생성",
  ai_analysis_regenerated: "AI 분석 재생성",
  ai_analysis_approved: "AI 분석 확인",
  ai_analysis_corrected: "AI 분석 수정",
  ai_analysis_rejected: "AI 분석 제외",
  ai_analysis_sent_to_review: "AI 검토 필요 표시",
  ai_draft_used_as_customer_reply: "AI 답변 초안 사용",
};

const customerStatusLabels: Record<TicketStatus, string> = {
  open: "답변 대기",
  in_progress: "답변 대기",
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

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateGroup(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value));
}

function getDateGroupKey(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function groupItemsByDate<T>(
  items: T[],
  getDate: (item: T) => string,
) {
  const groups = new Map<
    string,
    {
      key: string;
      label: string;
      items: T[];
    }
  >();

  items.forEach((item) => {
    const value = getDate(item);
    const key = getDateGroupKey(value);
    const group = groups.get(key) ?? {
      key,
      label: formatDateGroup(value),
      items: [],
    };

    group.items.push(item);
    groups.set(key, group);
  });

  return Array.from(groups.values());
}

function formatTicketNumber(ticketNumber: number | null | undefined) {
  if (!ticketNumber) {
    return "접수번호 없음";
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

function getTicketAssigneeLabel(ticket: TicketDetail) {
  if (ticket.assignee?.name) {
    return ticket.assignee.name;
  }

  return ticket.status === "resolved" || ticket.status === "closed"
    ? "담당자 없음"
    : "담당자 필요";
}

function getSlaLabel(ticket: TicketDetail) {
  if (ticket.status === "resolved" || ticket.status === "closed") {
    return "응답 완료";
  }

  const createdAt = new Date(ticket.created_at).getTime();
  const elapsedHours = (Date.now() - createdAt) / (1000 * 60 * 60);
  const targetHours = slaTargetsByPriority[ticket.priority];

  if (elapsedHours >= targetHours) {
    return "SLA 초과";
  }

  return `SLA ${Math.max(Math.ceil(targetHours - elapsedHours), 1)}h 남음`;
}

function getTicketTags(ticket: TicketDetail) {
  const tags = [
    categoryLabels[ticket.category] ?? ticket.category,
    ...(ticket.latest_ai_analysis?.tags.map((tag) => tagLabels[tag] ?? tag) ??
      []),
  ];

  return Array.from(new Set(tags)).slice(0, 6);
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
  const groupedReplies = groupItemsByDate(replies, (reply) => reply.created_at);

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {replies.length ? (
          groupedReplies.map((group) => (
            <section key={group.key} className="grid gap-2">
              <div className="flex items-center gap-3">
                <p className="shrink-0 text-xs font-medium text-muted-foreground">
                  {group.label}
                </p>
                <div className="h-px flex-1 bg-border" />
              </div>
              {group.items.map((reply) => (
                <div
                  key={reply.id}
                  className="rounded-lg border border-border bg-muted/40 p-3"
                >
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {reply.content}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatReplyAuthor(reply, isCustomerView)} ·{" "}
                    {formatTime(reply.created_at)}
                  </p>
                </div>
              ))}
            </section>
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
  initialContent,
  initialContentKey,
  source,
  onSubmitted,
}: {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
  isInternal: boolean;
  initialContent?: string;
  initialContentKey?: string | null;
  source?: "manual" | "ai_draft";
  onSubmitted?: () => void;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>
          {isInternal ? "내부 메모 추가" : "고객 답변 등록"}
        </CardTitle>
        <CardDescription>
          {isInternal
            ? "고객에게 보이지 않는 응대 맥락과 인수인계 내용을 남깁니다."
            : "고객에게 표시되는 공식 답변을 남깁니다."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TicketReplyForm
          ticketId={ticketId}
          profile={profile}
          isInternal={isInternal}
          initialContent={initialContent}
          initialContentKey={initialContentKey}
          source={source}
          onSubmitted={onSubmitted}
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
  const groupedLogs = groupItemsByDate(logs, (log) => log.created_at);

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
          groupedLogs.map((group) => (
            <section key={group.key} className="grid gap-2">
              <div className="flex items-center gap-3">
                <p className="shrink-0 text-xs font-medium text-muted-foreground">
                  {group.label}
                </p>
                <div className="h-px flex-1 bg-border" />
              </div>
              {group.items.map((log) => (
                <div key={log.id} className="border-l-2 border-border pl-3">
                  <p className="text-sm font-medium text-foreground">
                    {actionLabels[log.action] ?? log.action}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatLogValue(log.before_value)} →{" "}
                    {formatLogValue(log.after_value)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTime(log.created_at)}
                  </p>
                </div>
              ))}
            </section>
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
  const visibleStatusValue =
    ticket.status === "in_progress" ? "open" : ticket.status;

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
      return ticket.status === "resolved" || ticket.status === "closed"
        ? "담당자 없음"
        : "담당자 필요";
    }

    const agent = agentsQuery.data?.find((item) => item.id === agentId);
    return agent ? `${agent.name} (${agent.email})` : "담당자 정보 없음";
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>처리 속성</CardTitle>
        <CardDescription>
          답변 상태, 우선순위, 담당자를 관리합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="status">
            답변 상태
          </label>
          <div className="relative">
            <select
              id="status"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              value={visibleStatusValue}
              disabled={isPending}
              onChange={(event) =>
                runAction("status", {
                  status: event.target.value as TicketStatus,
                })
              }
            >
              {visibleStatusOptions.map((status) => (
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
                  <option value="unassigned">담당자 필요</option>
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

        <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
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
  const [replyDraft, setReplyDraft] = useState<{
    content: string;
    analysisId: string;
    version: number;
  } | null>(null);

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
            문의함으로 이동
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
    <div className="mx-auto grid max-w-[1600px] gap-4 px-3 py-4 sm:px-4 lg:px-6">
      <div className="flex flex-col gap-3">
        <Link
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          href="/tickets"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          문의함
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
          <h1 className="mt-3 text-xl font-semibold text-foreground">
            {ticket.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatTicketNumber(ticket.ticket_number)} · 접수{" "}
            {formatDateTime(ticket.created_at)} · 최근 수정{" "}
            {formatDateTime(ticket.updated_at)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
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
              initialContent={replyDraft?.content}
              initialContentKey={
                replyDraft
                  ? `${replyDraft.analysisId}:${replyDraft.version}`
                  : null
              }
              source={replyDraft ? "ai_draft" : "manual"}
              onSubmitted={() => setReplyDraft(null)}
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

        <div className="grid content-start gap-4">
          {canViewOperations ? (
            <>
              <AIAssistantPanel
                ticketId={ticket.id}
                profile={profile}
                canUseReplyDraft={!hasPublicReply}
                onUseReplyDraft={(draft, analysisId) => {
                  setReplyDraft((current) => ({
                    content: draft,
                    analysisId,
                    version: (current?.version ?? 0) + 1,
                  }));
                }}
              />
              <TicketOperationsPanel ticket={ticket} profile={profile} />
            </>
          ) : null}

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>고객 정보</CardTitle>
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
                      {getTicketAssigneeLabel(ticket)}
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
                <p className="text-muted-foreground">답변 상태</p>
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
              {canViewOperations ? (
                <>
                  <div>
                    <p className="text-muted-foreground">SLA</p>
                    <p className="font-medium text-foreground">
                      {getSlaLabel(ticket)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">태그</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {getTicketTags(ticket).map((tag, index) => (
                        <Badge
                          className="border-border bg-background text-muted-foreground"
                          key={`${tag}-${index}`}
                          variant="outline"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
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
