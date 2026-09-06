"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LockKeyhole, Send } from "lucide-react";
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ActionDialog } from "@/components/common/action-dialog";
import type { Tables } from "@/types/database";

import { useCreateTicketReply } from "../hooks/use-create-ticket-reply";
import {
  ticketReplySchema,
  type TicketReplyInput,
} from "../schemas/ticket-schema";

export type ReplyComposerHandle = { useDraft: (draft: string) => void };

type TicketReplyFormProps = {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
  isInternal: boolean;
  composerRef?: Ref<ReplyComposerHandle>;
};

function getReplyErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "내용을 저장하지 못했습니다. 다시 시도해 주세요.";
}

export function TicketReplyForm({
  ticketId,
  profile,
  isInternal,
  composerRef,
}: TicketReplyFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<string | null>(null);
  const source = useRef<"manual" | "ai_draft">("manual");
  const createReply = useCreateTicketReply();
  const formId = isInternal ? "internal-note-content" : "reply-content";

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<TicketReplyInput>({
    resolver: zodResolver(ticketReplySchema),
    defaultValues: {
      content: "",
    },
  });

  function focusComposer() {
    setFocus("content");
    document.getElementById(formId)?.scrollIntoView({ block: "center", behavior: "instant" });
  }

  function applyDraft(draft: string, append = false) {
    const current = getValues("content");
    setValue("content", append ? `${current}\n\n${draft}` : draft, { shouldDirty: true, shouldValidate: true });
    source.current = "ai_draft";
    setPendingDraft(null);
    setSuccessMessage("AI 초안을 작성란에 넣었습니다. 내용을 검토한 뒤 고객에게 등록해 주세요.");
    focusComposer();
  }

  useImperativeHandle(composerRef, () => ({
    useDraft(draft) {
      if (isSubmitting || createReply.isPending) return;
      if (getValues("content").trim()) setPendingDraft(draft);
      else applyDraft(draft);
    },
  }));

  async function onSubmit(input: TicketReplyInput) {
    setFormError(null);
    setSuccessMessage(null);

    try {
      await createReply.mutateAsync({
        ticketId,
        profile,
        isInternal,
        content: input.content,
        source: source.current,
      });
      reset({ content: "" });
      source.current = "manual";
      setSuccessMessage(
        isInternal ? "내부 메모를 추가했습니다." : profile.role === "customer" ? "메시지를 보냈습니다. 담당자의 답변을 기다려 주세요." : "고객 답변을 등록했습니다.",
      );
    } catch (error) {
      setFormError(getReplyErrorMessage(error));
    }
  }

  const isCustomer = profile.role === "customer";
  const pending = isSubmitting || createReply.isPending;

  return (
    <form className="grid gap-3" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <p id={`${formId}-visibility`} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {isInternal ? <LockKeyhole className="size-4" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
        {isInternal ? "팀 내부 전용 · 고객에게 보이지 않습니다" : isCustomer ? "지원팀에 전달 · 전송하면 답변 대기로 변경됩니다" : "고객에게 공개 · 등록 시 답변 완료로 처리됩니다"}
      </p>
      <div className="grid gap-2">
        <Label htmlFor={formId}>
          {isInternal ? "내부 메모 작성" : isCustomer ? "추가 메시지 작성" : "고객 답변 작성"}
        </Label>
        <Textarea
          id={formId}
          className="min-h-36 resize-y text-base leading-7 font-normal md:text-base"
          placeholder={
            isInternal
              ? "지원팀끼리 공유할 응대 맥락을 남겨 주세요."
              : isCustomer ? "아직 해결되지 않은 점이나 추가로 확인할 내용을 남겨 주세요." : "고객에게 전달할 답변을 입력해 주세요."
          }
          disabled={pending}
          aria-invalid={Boolean(errors.content)}
          aria-describedby={`${formId}-visibility${errors.content ? ` ${formId}-error` : ""}`}
          {...register("content")}
        />
        {errors.content ? (
          <p id={`${formId}-error`} role="alert" className="text-sm text-red-600 dark:text-red-400">{errors.content.message}</p>
        ) : null}
      </div>

      {formError ? <p role="alert" className="text-sm text-red-600 dark:text-red-400">{formError}</p> : null}
      {successMessage ? (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p>
      ) : null}

      <Button className="w-full sm:w-fit" variant={isInternal ? "secondary" : "default"} disabled={pending || pendingDraft !== null} type="submit">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : isInternal ? (
          <LockKeyhole className="size-4" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        {pending ? "저장 중…" : isInternal ? "내부 메모 저장" : isCustomer ? "메시지 보내기" : "고객에게 답변 등록"}
      </Button>
      <ActionDialog
        open={pendingDraft !== null}
        onClose={() => setPendingDraft(null)}
        title="작성 중인 답변이 있습니다"
        description="기존 내용을 AI 초안으로 교체하거나, 작성한 내용 뒤에 초안을 이어 붙일 수 있습니다. 취소하면 기존 내용이 유지됩니다."
        finalFocus={() => document.getElementById(formId)}
      >
        <Button type="button" variant="outline" onClick={() => { if (pendingDraft !== null) applyDraft(pendingDraft); }}>초안으로 교체</Button>
        <Button type="button" onClick={() => { if (pendingDraft !== null) applyDraft(pendingDraft, true); }}>뒤에 이어 붙이기</Button>
      </ActionDialog>
    </form>
  );
}
