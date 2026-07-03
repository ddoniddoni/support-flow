"use client";

import { Check, ExternalLink, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { AISentiment, AIUrgency } from "@/types/domain";

import type { AIReviewQueueItem } from "../api/get-ai-review-queue";
import { useReviewAIAnalysis } from "../hooks/use-review-ai-analysis";
import { AIConfidenceBadge } from "./ai-confidence-badge";

type AIReviewTableProps = {
  items: AIReviewQueueItem[];
  profile: Pick<Tables<"profiles">, "id" | "role">;
};

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

function TicketSummary({ item }: { item: AIReviewQueueItem }) {
  const ticket = item.ticket;

  if (!ticket) {
    return (
      <div>
        <p className="font-medium text-foreground">티켓 정보 없음</p>
        <p className="mt-1 text-xs text-muted-foreground">{item.ticket_id}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <Link
        href={`/tickets/${ticket.id}`}
        className="block truncate font-medium text-foreground hover:underline"
      >
        {ticket.title}
      </Link>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {formatTicketNumber(ticket.ticket_number)} ·{" "}
        {ticket.customer?.name ?? "고객 정보 없음"} ·{" "}
        {ticket.assignee?.name ?? "미배정"}
      </p>
    </div>
  );
}

function ReviewActions({
  item,
  profile,
  pendingAction,
  onRunAction,
}: {
  item: AIReviewQueueItem;
  profile: Pick<Tables<"profiles">, "id" | "role">;
  pendingAction: string | null;
  onRunAction: (item: AIReviewQueueItem, decision: "approved" | "rejected") => void;
}) {
  const approveKey = `${item.id}:approved`;
  const rejectKey = `${item.id}:rejected`;
  const isPending = pendingAction === approveKey || pendingAction === rejectKey;

  return (
    <div className="grid gap-2 sm:flex">
      <Button
        type="button"
        size="sm"
        disabled={isPending || profile.role === "customer"}
        onClick={() => onRunAction(item, "approved")}
      >
        {pendingAction === approveKey ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Check className="size-4" aria-hidden="true" />
        )}
        승인
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending || profile.role === "customer"}
        onClick={() => onRunAction(item, "rejected")}
      >
        {pendingAction === rejectKey ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <X className="size-4" aria-hidden="true" />
        )}
        거절
      </Button>
      <Button type="button" size="icon-sm" variant="outline" render={<Link href={`/tickets/${item.ticket_id}`} />}>
        <ExternalLink className="size-4" aria-hidden="true" />
        <span className="sr-only">티켓 상세로 이동</span>
      </Button>
    </div>
  );
}

function MobileReviewCard({
  item,
  profile,
  pendingAction,
  onRunAction,
}: {
  item: AIReviewQueueItem;
  profile: Pick<Tables<"profiles">, "id" | "role">;
  pendingAction: string | null;
  onRunAction: (item: AIReviewQueueItem, decision: "approved" | "rejected") => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <TicketSummary item={item} />
      <div className="flex flex-wrap gap-2">
        <SentimentBadge sentiment={item.sentiment} />
        <UrgencyBadge urgency={item.urgency} />
        <AIConfidenceBadge confidence={item.confidence} />
      </div>
      <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
        {item.summary}
      </p>
      {item.escalation_reason ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs leading-5 text-red-700">
          {item.escalation_reason}
        </p>
      ) : null}
      <div className="text-xs text-muted-foreground">
        생성 {formatDateTime(item.created_at)}
      </div>
      <ReviewActions
        item={item}
        profile={profile}
        pendingAction={pendingAction}
        onRunAction={onRunAction}
      />
    </div>
  );
}

export function AIReviewTable({ items, profile }: AIReviewTableProps) {
  const reviewAnalysis = useReviewAIAnalysis();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function runReviewAction(
    item: AIReviewQueueItem,
    decision: "approved" | "rejected",
  ) {
    setError(null);
    setPendingAction(`${item.id}:${decision}`);

    reviewAnalysis.mutate(
      {
        analysisId: item.id,
        ticketId: item.ticket_id,
        profile,
        decision,
        note:
          decision === "approved"
            ? "Approved from AI review queue."
            : "Rejected from AI review queue.",
      },
      {
        onError: (mutationError) => {
          setError(
            mutationError instanceof Error
              ? mutationError.message
              : "AI 리뷰 액션을 저장하지 못했습니다.",
          );
        },
        onSettled: () => {
          setPendingAction(null);
        },
      },
    );
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 md:hidden">
        {items.map((item) => (
          <MobileReviewCard
            key={item.id}
            item={item}
            profile={profile}
            pendingAction={pendingAction}
            onRunAction={runReviewAction}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card shadow-sm md:block">
        <Table className="min-w-[1040px] table-fixed">
          <colgroup>
            <col className="w-[260px]" />
            <col className="w-[190px]" />
            <col className="w-auto" />
            <col className="w-[150px]" />
            <col className="w-[220px]" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>티켓</TableHead>
              <TableHead>AI 상태</TableHead>
              <TableHead>요약</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead>액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="min-w-0">
                  <TicketSummary item={item} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    <SentimentBadge sentiment={item.sentiment} />
                    <UrgencyBadge urgency={item.urgency} />
                    <AIConfidenceBadge confidence={item.confidence} />
                  </div>
                </TableCell>
                <TableCell className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {item.summary}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {item.escalation_reason ?? item.reason}
                  </p>
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {formatDateTime(item.created_at)}
                </TableCell>
                <TableCell>
                  <ReviewActions
                    item={item}
                    profile={profile}
                    pendingAction={pendingAction}
                    onRunAction={runReviewAction}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
