"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThumbsUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { messageOf } from "@/lib/error-message";
import type { Tables } from "@/types/database";
import { useTicketFeedback, useSubmitFeedback } from "./hooks";
const schema = z.object({
  comment: z.string().trim().max(2000, "의견은 2,000자 이하로 입력해 주세요."),
});
export function CustomerFeedback({
  ticketId,
  replyId,
  profileId,
  isCustomer,
  canRate,
}: {
  ticketId: string;
  replyId: string;
  profileId: string;
  isCustomer: boolean;
  canRate: boolean;
}) {
  const query = useTicketFeedback(ticketId, replyId, profileId);
  if (query.isLoading)
    return (
      <div
        role="status"
        className="h-24 animate-pulse rounded-xl bg-muted/40"
        aria-label="답변 평가 불러오는 중"
      />
    );
  if (query.isError)
    return (
      <div role="alert" className="rounded-xl border p-4">
        <p className="text-sm">답변 평가를 불러오지 못했습니다.</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void query.refetch()}
        >
          다시 시도
        </Button>
      </div>
    );
  if (query.data)
    return <FeedbackReceipt feedback={query.data} isCustomer={isCustomer} />;
  if (!isCustomer || !canRate) return null;
  return <FeedbackForm ticketId={ticketId} replyId={replyId} />;
}

function FeedbackForm({
  ticketId,
  replyId,
}: {
  ticketId: string;
  replyId: string;
}) {
  const mutation = useSubmitFeedback();
  const [choice, setChoice] = useState<boolean | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { comment: "" },
  });
  return (
    <section
      aria-labelledby="feedback-heading"
      className="rounded-xl border border-blue-200 bg-blue-50/30 p-5 dark:border-slate-700 dark:bg-slate-800/20"
    >
      <h2 id="feedback-heading" className="font-semibold">
        이번 답변이 도움이 됐나요?
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        답변마다 한 번 평가할 수 있습니다. 해결되지 않았다면 담당자에게 다시
        확인을 요청합니다.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={choice === true ? "default" : "outline"}
          aria-pressed={choice === true}
          disabled={mutation.isPending}
          onClick={() => setChoice(true)}
        >
          <ThumbsUp className="size-4" />
          도움이 됐어요
        </Button>
        <Button
          type="button"
          variant={choice === false ? "default" : "outline"}
          aria-pressed={choice === false}
          disabled={mutation.isPending}
          onClick={() => setChoice(false)}
        >
          <MessageCircle className="size-4" />
          아직 해결되지 않았어요
        </Button>
      </div>
      {choice !== null ? (
        <form
          className="mt-4 grid gap-3"
          onSubmit={handleSubmit((input) => {
            if (choice === false && input.comment.length < 3) {
              setError("comment", {
                message: "해결되지 않은 내용을 3자 이상 알려 주세요.",
              });
              return;
            }
            mutation.mutate({
              ticketId,
              replyId,
              helpful: choice,
              comment: input.comment,
            });
          })}
        >
          <Label htmlFor="feedback-comment">
            {choice ? "의견 (선택)" : "해결되지 않은 내용"}
          </Label>
          <Textarea
            id="feedback-comment"
            className="min-h-24 text-base leading-6"
            maxLength={2000}
            disabled={mutation.isPending}
            {...register("comment")}
          />
          {errors.comment ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.comment.message}
            </p>
          ) : null}
          {!choice ? (
            <p className="text-xs leading-5 text-muted-foreground">
              보내면 설명이 고객 메시지로 등록되고 문의가 답변 대기로 바뀝니다.
            </p>
          ) : null}
          {mutation.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {messageOf(mutation.error)}
            </p>
          ) : null}
          <Button
            className="w-full sm:w-fit"
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? "보내는 중…"
              : choice
                ? "평가 보내기"
                : "평가 보내고 다시 문의하기"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}

function FeedbackReceipt({
  feedback,
  isCustomer,
}: {
  feedback: Tables<"ticket_feedback">;
  isCustomer: boolean;
}) {
  return (
    <section
      aria-label="답변 평가"
      className="rounded-xl border border-border bg-card p-5"
    >
      <p className="font-semibold">
        {isCustomer ? "평가해 주셔서 감사합니다." : "고객 답변 평가"}
      </p>
      <p
        className={`mt-2 text-sm font-medium ${feedback.helpful ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}
      >
        {feedback.helpful ? "도움이 됐어요" : "아직 해결되지 않았어요"}
      </p>
      {feedback.comment ? (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
          {feedback.comment}
        </p>
      ) : null}
      {!feedback.helpful ? (
        <p className="mt-2 text-xs text-muted-foreground">
          고객의 설명을 대화에 추가하고 재상담을 요청했습니다.
        </p>
      ) : null}
    </section>
  );
}
