"use client";

import { AlertCircle, CheckCircle2, ArrowLeft, Clock3, UserRound, MessageSquareText, Sparkles, LockKeyhole, Send } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type Ref } from "react";

import { SignalCard } from "@/components/common/signal-card";
import { TicketReadReceipt } from "@/features/notifications/ticket-read-receipt";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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

import { useAgents } from "../hooks/use-agents";
import { useTicket } from "../hooks/use-ticket";
import { useUpdateTicketAction } from "../hooks/use-update-ticket-action";
import type {
  TicketDetail,
  TicketDetailData,
  TicketLogItem,
  TicketReplyItem,
} from "../types";
import { TicketPropertySelect, type TicketPropertyOption } from "./ticket-property-select";
import { TicketDetailSkeleton } from "./ticket-detail-skeleton";
import { CustomerTicketConversation } from "./customer-ticket-conversation";
import { CustomerFeedback } from "@/features/feedback/customer-feedback";
import { AttachmentList } from "@/features/attachments/attachment-list";
import type { Attachment } from "@/features/attachments/validation";
import { useResponseTarget } from "../hooks/use-response-target";
import { useAIAnalysis } from "@/features/ai/hooks/use-ai-analysis";
import { isAnalysisOutdated } from "@/features/ai/utils/conversation-context";
import { TicketReplyForm, type ReplyComposerHandle } from "./ticket-reply-form";

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

const statusColors = {
  open: "bg-blue-500 text-blue-500",
  resolved: "bg-emerald-500 text-emerald-500",
  closed: "bg-slate-400 text-slate-400",
};
const priorityColors: Record<TicketPriority, string> = {
  low: "bg-slate-400 text-slate-400",
  medium: "bg-sky-500 text-sky-500",
  high: "bg-amber-500 text-amber-500",
  urgent: "bg-red-500 text-red-500",
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
  resolution_corrected_without_reply: "시스템: 공개 답변 없는 완료 상태 보정",
  status_changed: "상태 변경",
  priority_changed: "우선순위 변경",
  assignee_changed: "담당자 변경",
  reply_added: "지원팀 답변 등록",
  customer_feedback_submitted: "고객 답변 평가",
  customer_message_added: "고객 추가 메시지",
  internal_note_added: "내부 메모 추가",
  ai_analysis_generated: "AI 분석 생성",
  ai_analysis_regenerated: "AI 분석 재생성",
  ai_analysis_approved: "AI 분석 확인",
  ai_analysis_corrected: "AI 분석 수정",
  ai_analysis_rejected: "AI 분석 제외",
  ai_analysis_sent_to_review: "AI 검토 필요 표시",
  ai_draft_used_as_customer_reply: "AI 답변 초안 사용",
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
  if (value === "helpful") return "도움이 됐어요";
  if (value === "unresolved") return "미해결 · 재상담 요청";

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
    return reply.author_role === "customer" ? "나 · 고객" : "SupportFlow 지원팀";
  }

  if (!reply.author) {
    return "지원팀";
  }

  return `${authorRoleLabels[reply.author_role]} ${reply.author.name} (${reply.author.email})`;
}

function getTicketAssigneeLabel(ticket: TicketDetail) {
  if (ticket.assignee?.name) {
    return ticket.assignee.name;
  }

  return ticket.status === "resolved" || ticket.status === "closed"
    ? "담당자 없음"
    : "담당자 필요";
}

function TicketAttentionSummary({ ticket, hasPublicReply }: { ticket: TicketDetail; hasPublicReply: boolean }) {
  const finished = ticket.status === "resolved" || ticket.status === "closed";
  const responseTarget = useResponseTarget(ticket);
  return (
    <section aria-label="문의 처리 요약" className="grid gap-3 sm:grid-cols-3">
      <SignalCard label="응답 목표" value={responseTarget.label} tone={finished ? "neutral" : responseTarget.tone === "breached" ? "danger" : responseTarget.tone === "risk" ? "warning" : "info"} icon={Clock3} description={responseTarget.description} />
      <SignalCard label="담당 상담원" value={getTicketAssigneeLabel(ticket)} tone={!ticket.assignee_id && !finished ? "warning" : "neutral"} icon={UserRound} description={ticket.assignee_id ? "배정된 상담원이 문의를 처리합니다" : finished ? "배정된 상담원이 없습니다" : "처리 속성에서 상담원을 배정해 주세요"} />
      <SignalCard label="최신 대화 응답" value={hasPublicReply ? "답변 완료" : "답변 대기"} tone={hasPublicReply ? "success" : "info"} icon={MessageSquareText} description={hasPublicReply ? "지원팀의 공개 답변이 마지막 메시지입니다" : "고객 메시지를 확인하고 답변해 주세요"} />
    </section>
  );
}

const customerDeadlineFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" });
function CustomerResponseEstimate({ ticket, latestStaffReplyId }: { ticket: TicketDetail; latestStaffReplyId?: string }) {
  const target = useResponseTarget(ticket);
  if (ticket.status === "resolved" || ticket.status === "closed") {
    return <section aria-label="응답 안내" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
        <div><p className="font-semibold">{ticket.status === "closed" ? "종료된 문의입니다" : "지원팀 답변이 등록되었습니다"}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{latestStaffReplyId ? "답변을 확인해 주세요. 더 궁금한 점이 있다면 이어서 문의할 수 있어요." : "추가로 궁금한 점이 있다면 아래에서 이어서 문의할 수 있어요."}</p></div>
      </div>
      {latestStaffReplyId ? <a href={`#customer-reply-${latestStaffReplyId}`} className={buttonVariants({variant:"outline",className:"shrink-0"})}>최신 답변 보기 ↓</a> : null}
    </section>;
  }
  if (!target.deadline) return null;
  return <section aria-label="응답 안내" className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
    <Clock3 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
    <div><p className="text-sm font-semibold">{target.tone === "breached" ? "답변이 지연되고 있습니다" : "목표 응답 기한"}</p>
    <p className="mt-1 text-sm leading-6 text-muted-foreground">{target.tone === "breached" ? "기한 내 답변을 드리지 못했습니다. 추가로 전달할 내용이 있으면 아래 대화에 남겨 주세요." : customerDeadlineFormat.format(new Date(target.deadline)) + "까지 답변하는 것을 목표로 합니다."}</p></div>
  </section>;
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
        status === "open" && "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300",
        status === "in_progress" &&
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300",
        status === "resolved" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
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
        priority === "urgent" && "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300",
        priority === "high" && "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300",
        priority === "medium" && "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300",
        priority === "low" &&
          "border-border bg-muted/60 text-muted-foreground",
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
  isCustomerView = false,
  attachments,
}: {
  title: string;
  description: string;
  replies: TicketReplyItem[];
  emptyText: string;
  isCustomerView?: boolean;
  attachments: Attachment[];
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
                  className={cn("rounded-lg border p-3", reply.author_role === "customer" ? "border-blue-200 bg-blue-50/40 dark:border-blue-900/60 dark:bg-blue-950/20" : "border-border bg-muted/40")}
                >
                  <p className="max-w-[72ch] whitespace-pre-wrap break-words text-base leading-7 text-foreground">
                    {reply.content}
                  </p>
                  <AttachmentList attachments={attachments.filter(file=>file.reply_id===reply.id)} />
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
  composerRef,
  latestReplyOrder,
}: {
  ticketId: string;
  latestReplyOrder: number;
  profile: Pick<Tables<"profiles">, "id" | "role">;
  isInternal: boolean;
  composerRef?: Ref<ReplyComposerHandle>;
}) {
  return (
    <Card id={!isInternal && profile.role === "customer" ? "customer-reply-composer" : undefined} className={cn("scroll-mt-6 rounded-xl", isInternal ? "border border-dashed border-border bg-muted/20 dark:border-slate-700 dark:bg-slate-800/15" : "ring-blue-200/60 dark:ring-slate-700")} >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isInternal ? <LockKeyhole className="size-5 text-amber-600 dark:text-amber-300" aria-hidden="true" /> : <Send className="size-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />}
          {isInternal ? "내부 메모 추가" : profile.role === "customer" ? "추가로 문의하기" : "고객 답변 등록"}
        </CardTitle>
        <CardDescription>
          {isInternal
            ? "고객에게 보이지 않는 응대 맥락과 인수인계 내용을 남깁니다."
            : profile.role === "customer" ? "궁금한 점이나 추가 정보를 남겨 주세요. 답변 완료·종료된 문의도 다시 접수됩니다." : "고객에게 표시되는 공식 답변을 남깁니다."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TicketReplyForm
          key={`${profile.id}:${ticketId}:${isInternal}`}
          latestReplyOrder={latestReplyOrder}
          ticketId={ticketId}
          profile={profile}
          isInternal={isInternal}
          composerRef={composerRef}
        />
      </CardContent>
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
  hasPublicReply,
}: {
  ticket: NonNullable<TicketDetailData["ticket"]>;
  hasPublicReply: boolean;
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

  const agentOptions: TicketPropertyOption[] = [
    { value: "unassigned", label: "담당자 없음", description: "담당할 상담원을 선택해 주세요" },
    ...(agentsQuery.data ?? []).map((agent) => ({
      value: agent.id, label: agent.name, description: agent.email, avatar: agent.name.slice(0, 1),
    })),
  ];
  // Keep the current assignment visible while the option list loads or fails.
  if (ticket.assignee_id && !agentOptions.some((option) => option.value === ticket.assignee_id)) {
    agentOptions.push({
      value: ticket.assignee_id,
      label: ticket.assignee?.name ?? "현재 담당자",
      description: ticket.assignee?.email,
      avatar: ticket.assignee?.name.slice(0, 1),
    });
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>처리 속성</CardTitle>
        <CardDescription>
          선택하면 바로 저장됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <TicketPropertySelect
          id="status"
          label="답변 상태"
          value={visibleStatusValue}
          options={visibleStatusOptions.map((status) => ({ value: status, label: statusLabels[status], color: statusColors[status], disabled: status === "resolved" && !hasPublicReply, description: status === "resolved" && !hasPublicReply ? "최신 고객 메시지에 답변 후 선택 가능" : undefined }))}
          disabled={isPending}
          pending={pendingField === "status"}
          onValueChange={(status) => { if (status !== "resolved" || hasPublicReply) runAction("status", { status: status as TicketStatus }); }}
        />
        {!hasPublicReply ? <p className="text-sm leading-6 text-muted-foreground">고객 공개 답변을 등록하면 자동으로 답변 완료 처리됩니다. 내부 메모와 AI 초안은 답변으로 간주하지 않습니다.</p> : null}
        {isAdmin ? (
          <>
            <TicketPropertySelect
              id="priority"
              label="우선순위"
              value={ticket.priority}
              options={ticketPriorities.map((priority) => ({ value: priority, label: priorityLabels[priority], color: priorityColors[priority] }))}
              disabled={isPending}
              pending={pendingField === "priority"}
              onValueChange={(priority) => runAction("priority", { priority: priority as TicketPriority })}
            />
            <TicketPropertySelect
              id="assignee"
              label="담당자"
              value={ticket.assignee_id ?? "unassigned"}
              options={agentOptions}
              disabled={isPending || agentsQuery.isLoading || agentsQuery.isError}
              pending={pendingField === "assignee" || agentsQuery.isLoading}
              onValueChange={(assigneeId) => runAction("assignee", { assigneeId: assigneeId === "unassigned" ? null : assigneeId })}
            />
            {agentsQuery.isError ? (
              <div role="alert" className="text-xs text-red-600 dark:text-red-400">
                담당자 목록을 불러오지 못했습니다.
                <Button type="button" variant="link" size="sm" disabled={agentsQuery.isFetching} onClick={() => void agentsQuery.refetch()}>다시 시도</Button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">담당자: {ticket.assignee?.name ?? "담당자 없음"}</p>
        )}

        {message ? <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
        {error ? <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

function TicketAIAssistant({ ticket, profile, latestReplyOrder, onUseReplyDraft }: {
  ticket: TicketDetail;
  profile: Pick<Tables<"profiles">, "id" | "role">;
  latestReplyOrder: number;
  onUseReplyDraft: (draft: string) => void;
}) {
  const analysisQuery = useAIAnalysis({ ticketId: ticket.id, profile });
  const outdated = !!analysisQuery.data && isAnalysisOutdated(analysisQuery.data.source_reply_order, latestReplyOrder);
  const [expanded, setExpanded] = useState(Boolean(ticket.ai_needs_review));
  return (
    <details
      className="rounded-xl border border-slate-200 bg-slate-50/70 dark:border-[#34394f] dark:bg-[#151b2c]"
      open={expanded}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary className="cursor-pointer rounded-lg px-5 py-4 text-base font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-ring">
        <Sparkles className="mr-2 inline size-5 text-indigo-500 dark:text-[#b0b8de]" aria-hidden="true" />AI 요약과 답변 초안
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          {outdated ? "업데이트 필요" : ticket.ai_needs_review ? "검토 필요" : "상담원 전용"}
        </span>
      </summary>
      <div className="px-5 pb-5">
        <AIAssistantPanel ticketId={ticket.id} profile={profile} latestReplyOrder={latestReplyOrder} onUseReplyDraft={onUseReplyDraft} />
      </div>
    </details>
  );
}

function TicketDetailContent({
  data,
  profile,
}: {
  data: TicketDetailData;
  profile: Pick<Tables<"profiles">, "id" | "role">;
}) {
  const replyComposerRef = useRef<ReplyComposerHandle>(null);

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
  const lastStaffReply = data.replies.findLast(reply => reply.author_role !== "customer");
  const canResolve = data.replies.length > 0 && data.replies[data.replies.length - 1].author_role !== "customer";

  return (
    <div className={cn("mx-auto grid gap-6 px-4 py-6 sm:px-6 lg:px-8 dark:[--muted-foreground:#a8b5c8] [&_[data-slot=card]]:[--card-spacing:1.25rem] [&_[data-slot=card-title]]:text-lg [&_[data-slot=card-title]]:font-semibold", isCustomer ? "max-w-[960px] sm:py-10" : "max-w-[1360px]")}>
      <TicketReadReceipt key={profile.id} ticketId={ticket.id} replyOrder={Math.max(0,...data.replies.map(reply=>reply.reply_order))} />
      <div className="flex flex-col gap-3">
        <Link
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          href="/tickets"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {isCustomer ? "내 문의 목록" : "문의함"}
        </Link>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {isCustomer ? (
              <StatusBadge status={ticket.status} />
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
          <h1 className="mt-3 max-w-[40ch] break-words text-2xl leading-snug font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            {ticket.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] leading-6 text-muted-foreground">
            <span className="font-mono font-medium text-foreground">{formatTicketNumber(ticket.ticket_number)}</span>
            <span>접수 {formatDateTime(ticket.created_at)}</span>
            {!isCustomer ? <span>최근 수정 {formatDateTime(ticket.updated_at)}</span> : null}
            {isCustomer ? <a href="#customer-reply-composer" className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">추가 문의 작성 ↓</a> : null}
          </div>
        </div>
      </div>

      {canViewOperations ? <TicketAttentionSummary ticket={ticket} hasPublicReply={canResolve} /> : <CustomerResponseEstimate ticket={ticket} latestStaffReplyId={lastStaffReply?.id} />}

      <div className={cn("grid gap-6", canViewOperations && "xl:grid-cols-[minmax(0,1fr)_320px]")}>
        <div className="grid min-w-0 content-start gap-4">
          <Card className={cn("rounded-xl", isCustomer ? "bg-muted/20" : "border-l-[3px] border-l-blue-400 dark:border-l-[#739ac7] dark:bg-[#1a2433]")}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2"><MessageSquareText className="size-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />{isCustomer ? "내가 남긴 문의" : "문의 내용"}</CardTitle>
                {!isCustomer ? <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-200">고객 원문</Badge> : null}
              </div>
            </CardHeader>
            <CardContent>
              <p className="max-w-[72ch] whitespace-pre-wrap break-words text-base leading-7 text-foreground">
                {ticket.content}
              </p>
              <AttachmentList attachments={data.attachments.filter(file=>!file.reply_id)} />
            </CardContent>
          </Card>

          {isCustomer ? <CustomerTicketConversation replies={data.replies} attachments={data.attachments} /> : data.replies.length > 0 ? <ReplyList
            title="고객과의 대화"
            description="고객 메시지와 지원팀의 공개 답변을 시간순으로 확인합니다."
            attachments={data.attachments}
            replies={data.replies}
            emptyText="아직 대화가 없습니다. 추가로 전달할 내용이 있으면 아래에 남겨 주세요."
            isCustomerView={isCustomer}
          /> : null}

          {lastStaffReply ? <CustomerFeedback key={lastStaffReply.id} ticketId={ticket.id} replyId={lastStaffReply.id} profileId={profile.id} isCustomer={isCustomer} canRate={canResolve && (ticket.status === "resolved" || ticket.status === "closed")} /> : null}

          {canViewOperations ? (
            <TicketAIAssistant
              ticket={ticket}
              profile={profile}
              latestReplyOrder={data.replies.reduce((latest, reply) => reply.is_internal ? latest : Math.max(latest, reply.reply_order), 0)}
              onUseReplyDraft={(draft) => replyComposerRef.current?.useDraft(draft)}
            />
          ) : null}

          {(
            <ReplyComposerCard
                latestReplyOrder={Math.max(0,...data.replies.map(reply=>reply.reply_order))}
              ticketId={ticket.id}
              profile={profile}
              isInternal={false}
              composerRef={replyComposerRef}
            />
          )}

          {canViewOperations ? (
            <>
              {data.internalNotes.length > 0 ? <ReplyList
                title="내부 메모"
                description="지원팀 내부에서만 공유하는 메모입니다."
                attachments={data.attachments}
            replies={data.internalNotes}
                emptyText="아직 등록된 내부 메모가 없습니다."
              /> : null}
              <ReplyComposerCard
                latestReplyOrder={Math.max(0,...data.replies.map(reply=>reply.reply_order))}
                ticketId={ticket.id}
                profile={profile}
                isInternal
              />
            </>
          ) : null}
        </div>

        {canViewOperations ? <div className="grid min-w-0 content-start gap-4">
          {canViewOperations ? <TicketOperationsPanel ticket={ticket} profile={profile} hasPublicReply={canResolve} /> : null}

          <Card className="rounded-xl">
            <CardHeader><CardTitle>{isCustomer ? "문의 정보" : "고객 정보"}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 text-sm">
              {canViewOperations ? (
                <div className="flex min-w-0 items-start gap-3">
                  <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-200">{ticket.customer?.name?.slice(0, 1) ?? <UserRound className="size-4" />}</span>
                  <div className="min-w-0"><p className="font-semibold">{ticket.customer?.name ?? "고객 정보 없음"}</p><p className="mt-1 break-all text-xs leading-5 text-muted-foreground">{ticket.customer?.email}</p></div>
                </div>
              ) : <div className="flex items-center justify-between"><span className="text-muted-foreground">답변 상태</span><StatusBadge status={ticket.status} /></div>}
              <div className="border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">{canViewOperations ? "문의 태그" : "문의 유형"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(canViewOperations ? getTicketTags(ticket) : [categoryLabels[ticket.category] ?? ticket.category]).map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>

          {canViewOperations ? (
            <details className="rounded-lg border border-border bg-card">
              <summary className="cursor-pointer rounded-lg p-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">활동 로그 · {data.logs.length}건</summary>
              <ActivityLogList logs={data.logs} />
            </details>
          ) : null}
        </div> : null}
      </div>
    </div>
  );
}

export function TicketDetailView({ ticketId, profile }: TicketDetailViewProps) {
  const ticketQuery = useTicket({ ticketId, profile });

  if (ticketQuery.isLoading) {
    return <TicketDetailSkeleton isCustomer={profile.role === "customer"} />;
  }

  if (ticketQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
          <div>
            <p className="font-medium">
              문의 상세 정보를 불러오지 못했습니다.
            </p>
            <p className="mt-1 text-red-600 dark:text-red-400">
              정보를 불러오지 못했습니다. 다시 시도해 주세요.
            </p>
            <Button type="button" variant="outline" className="mt-3" disabled={ticketQuery.isFetching} onClick={() => void ticketQuery.refetch()}>다시 시도</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TicketDetailContent
      key={ticketId}
      data={
        ticketQuery.data ?? {
          ticket: null,
          replies: [],
          internalNotes: [],
          logs: [],
        attachments: [],
        }
      }
      profile={profile}
    />
  );
}
