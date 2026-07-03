"use client";

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
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/types/database";
import { ticketPriorities, ticketStatuses } from "@/types/domain";

import {
  correctAIAnalysisSchema,
  type CorrectAIAnalysisFormInput,
} from "../schemas/review-ai-analysis-schema";
import type { TicketAIAnalysis } from "../types";
import { useAIAnalysis } from "../hooks/use-ai-analysis";
import { useAnalyzeTicket } from "../hooks/use-analyze-ticket";
import {
  useReviewAIAnalysis,
  useSendAIAnalysisToReview,
} from "../hooks/use-review-ai-analysis";
import { AIAnalysisSummaryCard } from "./ai-analysis-summary-card";
import { AIReplyDraftBox } from "./ai-reply-draft-box";

type AIAssistantPanelProps = {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
  canUseReplyDraft: boolean;
  onUseReplyDraft: (draft: string, analysisId: string) => void;
};

const priorityLabels: Record<(typeof ticketPriorities)[number], string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
};

const statusLabels: Record<(typeof ticketStatuses)[number], string> = {
  open: "열림",
  in_progress: "진행 중",
  resolved: "해결됨",
  closed: "종료",
};

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
  if (analysis.needs_review) {
    return (
      <Badge
        variant="outline"
        className="border-red-200 bg-red-50 text-red-700"
      >
        Review required
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-emerald-50 text-emerald-700"
    >
      Human checked
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
      reason: analysis.reason,
      replyDraft: analysis.reply_draft ?? "",
      suggestedPriority: analysis.suggested_priority ?? "none",
      suggestedStatus: analysis.suggested_status ?? "none",
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
        note: input.note || "AI analysis corrected from ticket detail.",
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
        <Label htmlFor="ai-summary">Summary</Label>
        <Textarea
          id="ai-summary"
          className="min-h-24"
          disabled={pending}
          aria-invalid={Boolean(form.formState.errors.summary)}
          {...form.register("summary")}
        />
        {form.formState.errors.summary ? (
          <p className="text-xs text-red-600">
            {form.formState.errors.summary.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ai-reason">Reason</Label>
        <Textarea
          id="ai-reason"
          className="min-h-28"
          disabled={pending}
          aria-invalid={Boolean(form.formState.errors.reason)}
          {...form.register("reason")}
        />
        {form.formState.errors.reason ? (
          <p className="text-xs text-red-600">
            {form.formState.errors.reason.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ai-reply-draft">Reply draft</Label>
        <Textarea
          id="ai-reply-draft"
          className="min-h-32"
          disabled={pending}
          {...form.register("replyDraft")}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="ai-priority">Suggested priority</Label>
          <select
            id="ai-priority"
            className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            disabled={pending}
            {...form.register("suggestedPriority")}
          >
            <option value="none">없음</option>
            {ticketPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priorityLabels[priority]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ai-status">Suggested status</Label>
          <select
            id="ai-status"
            className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            disabled={pending}
            {...form.register("suggestedStatus")}
          >
            <option value="none">없음</option>
            {ticketStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ai-note">Review note</Label>
        <Textarea
          id="ai-note"
          className="min-h-20"
          disabled={pending}
          placeholder="수정 이유나 확인한 맥락을 남겨 주세요."
          {...form.register("note")}
        />
      </div>

      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

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
  canUseReplyDraft,
  onUseReplyDraft,
}: AIAssistantPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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

  async function confirmAnalysis(analysis: TicketAIAnalysis) {
    setMessage(null);
    setError(null);

    try {
      await reviewAnalysis.mutateAsync({
        analysisId: analysis.id,
        ticketId,
        profile,
        decision: "approved",
        note: "AI analysis confirmed from ticket detail.",
      });
      setMessage("AI 분석을 확인 처리했습니다.");
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    }
  }

  async function sendAnalysisToReview(analysis: TicketAIAnalysis) {
    setMessage(null);
    setError(null);

    try {
      await sendToReview.mutateAsync({
        analysisId: analysis.id,
        ticketId,
        profile,
        note: "Sent to review from ticket detail.",
      });
      setMessage("AI 분석을 리뷰 대상으로 표시했습니다.");
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    }
  }

  const analysis = analysisQuery.data ?? null;
  const pending =
    analyzeTicket.isPending || reviewAnalysis.isPending || sendToReview.isPending;

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-4 text-primary" aria-hidden="true" />
              AI Assistant
            </CardTitle>
            <CardDescription>
              티켓 분류, 요약, 응답 초안을 상담원 검토용으로 제안합니다.
            </CardDescription>
          </div>
          {analysis ? <AIReviewStateBadge analysis={analysis} /> : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {analysisQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <div className="flex gap-2">
              <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
              <div>
                <p className="font-medium">AI 분석을 불러오지 못했습니다.</p>
                <p className="mt-1 text-red-600">
                  AI schema migration 적용 여부와 RLS 정책을 확인해 주세요.
                </p>
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
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <div className="flex gap-2">
                  <ShieldAlert className="mt-0.5 size-4" aria-hidden="true" />
                  <div>
                    <p className="font-medium">사람 검토가 필요합니다.</p>
                    {analysis.escalation_reason ? (
                      <p className="mt-1 text-red-600">
                        {analysis.escalation_reason}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <AIAnalysisSummaryCard analysis={analysis} />

            {isEditing ? (
              <CorrectAnalysisForm
                analysis={analysis}
                profile={profile}
                onCancel={() => setIsEditing(false)}
              />
            ) : null}

            <AIReplyDraftBox
              draft={analysis.reply_draft}
              canUseDraft={canUseReplyDraft}
              onUseDraft={(draft) => {
                onUseReplyDraft(draft, analysis.id);
                setMessage("AI 초안을 고객 답변 작성란에 넣었습니다.");
              }}
            />
          </>
        ) : null}

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-2">
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => void runAnalysis(Boolean(analysis))}
          >
            {pending && analyzeTicket.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : analysis ? (
              <RefreshCw className="size-4" aria-hidden="true" />
            ) : (
              <Bot className="size-4" aria-hidden="true" />
            )}
            {analysis ? "재분석" : "분석 실행"}
          </Button>

          {analysis ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => void confirmAnalysis(analysis)}
              >
                <Check className="size-4" aria-hidden="true" />
                확인
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => setIsEditing((current) => !current)}
              >
                <Edit3 className="size-4" aria-hidden="true" />
                수정
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => void sendAnalysisToReview(analysis)}
              >
                <ShieldAlert className="size-4" aria-hidden="true" />
                리뷰
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
