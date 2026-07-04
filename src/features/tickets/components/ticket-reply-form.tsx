"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/types/database";

import { useCreateTicketReply } from "../hooks/use-create-ticket-reply";
import {
  ticketReplySchema,
  type TicketReplyInput,
} from "../schemas/ticket-schema";

type TicketReplyFormProps = {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
  isInternal: boolean;
  initialContent?: string;
  initialContentKey?: string | null;
  source?: "manual" | "ai_draft";
  onSubmitted?: () => void;
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
  initialContent = "",
  initialContentKey = null,
  source = "manual",
  onSubmitted,
}: TicketReplyFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const createReply = useCreateTicketReply();
  const formId = isInternal ? "internal-note-content" : "reply-content";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketReplyInput>({
    resolver: zodResolver(ticketReplySchema),
    defaultValues: {
      content: initialContent,
    },
  });

  useEffect(() => {
    if (initialContent) {
      reset({ content: initialContent });
    }
  }, [initialContent, initialContentKey, reset]);

  async function onSubmit(input: TicketReplyInput) {
    setFormError(null);
    setSuccessMessage(null);

    try {
      await createReply.mutateAsync({
        ticketId,
        profile,
        isInternal,
        content: input.content,
        source,
      });
      reset();
      onSubmitted?.();
      setSuccessMessage(
        isInternal ? "내부 메모를 추가했습니다." : "고객 답변을 등록했습니다.",
      );
    } catch (error) {
      setFormError(getReplyErrorMessage(error));
    }
  }

  const pending = isSubmitting || createReply.isPending;

  return (
    <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor={formId}>
          {isInternal ? "내부 메모 작성" : "고객 답변 작성"}
        </Label>
        <Textarea
          id={formId}
          className="min-h-28 resize-y"
          placeholder={
            isInternal
              ? "지원팀끼리 공유할 응대 맥락을 남겨 주세요."
              : "고객에게 전달할 답변을 입력해 주세요."
          }
          disabled={pending}
          aria-invalid={Boolean(errors.content)}
          {...register("content")}
        />
        {errors.content ? (
          <p className="text-sm text-red-600">{errors.content.message}</p>
        ) : null}
      </div>

      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      {successMessage ? (
        <p className="text-sm text-emerald-700">{successMessage}</p>
      ) : null}

      <Button className="w-full sm:w-fit" disabled={pending} type="submit">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        {isInternal ? "메모 추가" : "답변 등록"}
      </Button>
    </form>
  );
}
