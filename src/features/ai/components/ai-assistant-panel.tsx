"use client";

import { AppSelect } from "@/components/ui/app-select";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Bot,
  Check,
  Edit3,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { ActionDialog } from "@/components/common/action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/types/database";
import { ticketPriorities, type TicketStatus } from "@/types/domain";

import {
  correctAIAnalysisSchema,
  type CorrectAIAnalysisFormInput,
} from "../schemas/review-ai-analysis-schema";
import type { TicketAIAnalysis } from "../types";
import { formatAIVisibleText } from "../utils/ai-display-text";
import { isAnalysisOutdated } from "../utils/conversation-context";
import { useAIAnalysis } from "../hooks/use-ai-analysis";
import { useAnalyzeTicket } from "../hooks/use-analyze-ticket";
import { useReviewAIAnalysis, useSendAIAnalysisToReview } from "../hooks/use-review-ai-analysis";
import { AIAnalysisSummaryCard } from "./ai-analysis-summary-card";
import { AIReplyDraftBox } from "./ai-reply-draft-box";

type AIAssistantPanelProps = {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
  latestReplyOrder: number;
  onUseReplyDraft: (draft: string, analysisId: string) => void;
};

const priorityLabels: Record<(typeof ticketPriorities)[number], string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
};

const statusLabels: Record<TicketStatus, string> = {
  open: "답변 대기",
  in_progress: "답변 대기",
  resolved: "답변 완료",
  closed: "종료",
};

const visibleStatusOptions = ["open", "resolved", "closed"] as const;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "AI 작업을 처리하지 못했습니다.";
}

function AIPanelSkeleton() {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="grid gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

function AIReviewStateBadge({ analysis }: { analysis: TicketAIAnalysis }) {
  if (analysis.review_decision === "rejected") return <Badge variant="secondary">검토 제외</Badge>;
  if (analysis.review_decision === "approved" || analysis.review_decision === "corrected") {
    return <Badge variant="outline">검토 완료</Badge>;
  }
  if (analysis.needs_review) {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
      >
        검토 필요
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
    >
      자동 분류 완료
    </Badge>
  );
}

function CorrectAnalysisForm({
  analysis,
  profile,
  onCancel,
}: {
  analysis: TicketAIAnalysis;
  profile: Pick<Tables<"profiles">, "id" | "role">;
  onCancel: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const reviewAnalysis = useReviewAIAnalysis();
  const form = useForm<CorrectAIAnalysisFormInput>({
    resolver: zodResolver(correctAIAnalysisSchema),
    defaultValues: {
      summary: analysis.summary,
      reason: formatAIVisibleText(analysis.reason),
      replyDraft: analysis.reply_draft ?? "",
      suggestedPriority: analysis.suggested_priority ?? "none",
      suggestedStatus:
        analysis.suggested_status === "in_progress"
          ? "open"
          : analysis.suggested_status ?? "none",
      note: "",
    },
  });

  async function submitCorrection(input: CorrectAIAnalysisFormInput) {
    setFormError(null);

    try {
      await reviewAnalysis.mutateAsync({
        analysisId: analysis.id,
        ticketId: analysis.ticket_id,
        profile,
        decision: "corrected",
        note: input.note || "티켓 상세에서 AI 분석을 수정했습니다.",
        correction: {
          summary: input.summary,
          reason: input.reason,
          replyDraft: input.replyDraft || null,
          suggestedPriority:
            input.suggestedPriority === "none" ? null : input.suggestedPriority,
          suggestedStatus:
            input.suggestedStatus === "none" ? null : input.suggestedStatus,
        },
      });
      onCancel();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  const pending = form.formState.isSubmitting || reviewAnalysis.isPending;

  return (
    <form
      className="grid gap-3 rounded-lg border border-border bg-background p-3"
      onSubmit={form.handleSubmit(submitCorrection)}
    >
      <div className="grid gap-2">
        <Label htmlFor="ai-summary">요약</Label>
        <Textarea
          id="ai-summary"
          className="min-h-24"
          disabled={pending}
          aria-invalid={Boolean(form.formState.errors.summary)}
          {...form.register("summary")}
        />
        {form.formState.errors.summary ? (
          <p className="text-xs text-red-600 dark:text-red-400">
            {form.formState.errors.summary.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ai-reason">판단 근거</Label>
        <Textarea
          id="ai-reason"
          className="min-h-28"
          disabled={pending}
          aria-invalid={Boolean(form.formState.errors.reason)}
          {...form.register("reason")}
        />
        {form.formState.errors.reason ? (
          <p className="text-xs text-red-600 dark:text-red-400">
            {form.formState.errors.reason.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ai-reply-draft">답변 초안</Label>
        <Textarea
          id="ai-reply-draft"
          className="min-h-32"
          disabled={pending}
          {...form.register("replyDraft")}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="ai-priority">제안 우선순위</Label>
          <Controller control={form.control} name="suggestedPriority" render={({ field }) => <AppSelect id="ai-priority" name={field.name} ref={field.ref} onBlur={field.onBlur} value={field.value} onValueChange={field.onChange} disabled={pending} options={[{ value: "none", label: "없음" }, ...ticketPriorities.map(value => ({ value, label: priorityLabels[value] }))]} />} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ai-status">제안 답변 상태</Label>
          <Controller control={form.control} name="suggestedStatus" render={({ field }) => <AppSelect id="ai-status" name={field.name} ref={field.ref} onBlur={field.onBlur} value={field.value} onValueChange={field.onChange} disabled={pending} options={[{ value: "none", label: "없음" }, ...visibleStatusOptions.map(value => ({ value, label: statusLabels[value] }))]} />} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ai-note">수정 메모</Label>
        <Textarea
          id="ai-note"
          className="min-h-20"
          disabled={pending}
          placeholder="수정 이유나 확인한 맥락을 남겨 주세요."
          {...form.register("note")}
        />
      </div>

      {formError ? <p className="text-sm text-red-600 dark:text-red-400">{formError}</p> : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="size-4" aria-hidden="true" />
          )}
          수정 저장
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

export function AIAssistantPanel({
  ticketId,
  profile,
  latestReplyOrder,
  onUseReplyDraft,
}: AIAssistantPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmExclude, setConfirmExclude] = useState(false);
  const analysisQuery = useAIAnalysis({ ticketId, profile });
  const analyzeTicket = useAnalyzeTicket();
  const reviewAnalysis = useReviewAIAnalysis();
  const sendToReview = useSendAIAnalysisToReview();

  if (profile.role === "customer") {
    return null;
  }

  if (analysisQuery.isLoading) {
    return <AIPanelSkeleton />;
  }

  async function runAnalysis(regenerate: boolean) {
    setMessage(null);
    setError(null);
    setIsEditing(false);

    try {
      await analyzeTicket.mutateAsync({ ticketId, profile, regenerate });
      setMessage(regenerate ? "AI 분석을 다시 생성했습니다." : "AI 분석을 생성했습니다.");
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    }
  }

  const analysis = analysisQuery.data ?? null;
  const outdated = !!analysis && isAnalysisOutdated(analysis.source_reply_order, latestReplyOrder);
  const pending = analyzeTicket.isPending || reviewAnalysis.isPending || sendToReview.isPending || isEditing;

  async function review(decision: "approved" | "rejected" | "request_review") {
    if (!analysis) return;
    setMessage(null);
    setError(null);
    const input = { analysisId: analysis.id, ticketId, profile };
    try {
      if (decision === "request_review") await sendToReview.mutateAsync(input);
      else await reviewAnalysis.mutateAsync({ ...input, decision });
      setMessage(decision === "request_review" ? "검토를 요청했습니다." : decision === "rejected" ? "AI 분석과 답변 초안을 제외했습니다." : "AI 분석을 확인했습니다.");
    } catch (error) {
      setError(getErrorMessage(error));
    }
  }

  return (
    <Card className="gap-4 rounded-none bg-transparent py-0 shadow-none ring-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <p className="text-[13px] leading-5 text-muted-foreground">AI 제안 · 고객에게 공개되지 않습니다</p>
        {analysis ? <AIReviewStateBadge analysis={analysis} /> : null}
      </div>
      <CardContent className="grid gap-5 px-0">
        {outdated ? <div role="status" className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm leading-6">
          <p className="font-semibold text-amber-700 dark:text-amber-200">분석 업데이트 필요</p>
          <p className="mt-1 text-muted-foreground">새 공개 메시지가 있어 기존 분석과 초안이 최신 대화를 반영하지 않습니다.</p>
          <Button type="button" className="mt-3" size="sm" disabled={pending} onClick={() => void runAnalysis(true)}>{analyzeTicket.isPending ? "분석 중…" : "최신 대화로 재분석"}</Button>
        </div> : null}
        {analysis && !outdated ? <p className="text-xs text-muted-foreground">최초 문의와 최근 공개 메시지 최대 20개 기준 · 내부 메모 제외</p> : null}
        {analysisQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <div className="flex gap-2">
              <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
              <div>
                <p className="font-medium">AI 분석을 불러오지 못했습니다.</p>
                <p className="mt-1 text-red-600 dark:text-red-400">
                  잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.
                </p>
                <Button type="button" size="sm" variant="outline" className="mt-2"
                  onClick={() => void analysisQuery.refetch()}>다시 시도</Button>
              </div>
            </div>
          </div>
        ) : null}

        {!analysis && !analysisQuery.isError ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            아직 생성된 AI 분석이 없습니다.
          </div>
        ) : null}

        {analysis ? (
          <>
            {analysis.needs_review ? (
              <div className="rounded-xl border border-amber-200 border-l-[3px] border-l-amber-500 bg-amber-50/60 px-4 py-4 text-sm leading-6 text-amber-900 dark:border-[#51442f] dark:border-l-[#cfaa65] dark:bg-[#29252a] dark:text-[#e2c68f]">
                <div className="flex gap-2">
                  <ShieldAlert className="mt-0.5 size-4" aria-hidden="true" />
                  <div>
                    <p className="font-medium">AI 검토가 필요합니다.</p>
                    {analysis.escalation_reason ? (
                      <p className="mt-1 text-amber-800 dark:text-[#c6bca9]">
                        {formatAIVisibleText(analysis.escalation_reason)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <AIAnalysisSummaryCard analysis={analysis} />

            {isEditing ? (
              <CorrectAnalysisForm
                key={analysis.id}
                analysis={analysis}
                profile={profile}
                onCancel={() => setIsEditing(false)}
              />
            ) : null}

            <AIReplyDraftBox
              draft={analysis.reply_draft}
              canUseDraft={!outdated && !pending && analysis.review_decision !== "rejected"}
              disabledReason={outdated ? "최신 대화로 재분석한 뒤 초안을 사용할 수 있습니다." : analysis.review_decision === "rejected" ? "제외된 분석의 초안은 사용할 수 없습니다." : isEditing ? "AI 분석 수정을 마친 뒤 초안을 사용할 수 있습니다." : pending ? "AI 작업을 처리 중입니다. 완료 후 다시 시도해 주세요." : undefined}
              onUseDraft={(draft) => {
                onUseReplyDraft(draft, analysis.id);
                setMessage(null);
              }}
            />
          </>
        ) : null}

        {message ? <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
        {error ? <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <div className="grid gap-3">
          {!analysis ? (
            <Button type="button" size="sm" variant="secondary" disabled={pending || analysisQuery.isError} onClick={() => void runAnalysis(false)}>
              {analyzeTicket.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Bot className="size-4" aria-hidden="true" />}
              {analyzeTicket.isPending ? "분석 중…" : "AI 분석 실행"}
            </Button>
          ) : !isEditing ? (
            <>
              {!outdated && (analysis.review_decision === "approved" || analysis.review_decision === "corrected") ? (
                <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300"><Check className="size-4" aria-hidden="true" />상담원 검토 완료</p>
              ) : analysis.review_decision !== "rejected" ? (
                <Button type="button" size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-[#414b63] dark:text-[#c4cde6] dark:hover:bg-[#252e43]" disabled={pending || outdated} onClick={() => void review("approved")}>
                  <Check className="size-4" aria-hidden="true" />{reviewAnalysis.isPending ? "처리 중…" : "AI 분석 검토 완료"}
                </Button>
              ) : null}
              <details className="rounded-md border border-border">
                <summary className="cursor-pointer rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">추가 작업</summary>
                <div className="grid gap-2 p-3 pt-1 sm:grid-cols-2">
                  <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => void runAnalysis(true)}>
                    {analyzeTicket.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
                    {analyzeTicket.isPending ? "재분석 중…" : "재분석"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" disabled={pending || outdated} onClick={() => setIsEditing(true)}><Edit3 className="size-4" aria-hidden="true" />분석 수정</Button>
                  {!analysis.needs_review && analysis.review_decision !== "rejected" ? <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => void review("request_review")}>검토 요청</Button> : null}
                  <Button type="button" size="sm" variant="destructive" disabled={pending || analysis.review_decision === "rejected"} onClick={() => setConfirmExclude(true)}>분석 제외</Button>
                </div>
              </details>
            </>
          ) : null}
        </div>
        <ActionDialog open={confirmExclude} onClose={() => setConfirmExclude(false)} title="이 AI 분석을 제외할까요?" description="이 분석의 답변 초안과 상태·우선순위 제안이 제거되고 운영 통계에서 제외됩니다. 이미 작성란에 넣은 내용과 등록된 고객 답변은 유지됩니다. 다시 사용하려면 재분석해 주세요.">
          <Button type="button" variant="destructive" disabled={pending} onClick={() => { setConfirmExclude(false); void review("rejected"); }}>분석 제외하기</Button>
        </ActionDialog>
      </CardContent>
    </Card>
  );
}
