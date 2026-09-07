"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AttachmentPicker } from "@/features/attachments/attachment-picker";
import { useAttachments } from "@/features/attachments/use-attachments";
import { FormActions } from "@/components/common/form-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createSubmissionRequest } from "../utils/submission-request";
import { useCreateTicket } from "../hooks/use-create-ticket";
import {
  createTicketSchema,
  ticketCategories,
  type CreateTicketInput,
} from "../schemas/ticket-schema";

const categoryLabels: Record<CreateTicketInput["category"], string> = {
  account: "계정",
  billing: "결제",
  technical: "기술 지원",
  product: "제품 문의",
  other: "기타",
};

function getCreateTicketErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("row-level security")) {
    return "문의를 등록할 권한이 없습니다. 다시 로그인하거나 관리자에게 문의해 주세요.";
  }

  if (
    normalizedMessage.includes("login") ||
    normalizedMessage.includes("auth") ||
    message.includes("로그인")
  ) {
    return "로그인 후 다시 시도해 주세요.";
  }

  if (
    normalizedMessage.includes("forbidden") ||
    normalizedMessage.includes("customers")
  ) {
    return "고객 계정으로 로그인한 뒤 문의를 등록해 주세요.";
  }

  return "문의를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export function CreateTicketForm({ accountId }: { accountId: string }) {
  const attachments = useAttachments({scope:`${accountId}:create`});
  const [submission] = useState(() => createSubmissionRequest(`${accountId}:create`));
  const router = useRouter();
  const createTicketMutation = useCreateTicket();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "technical",
    },
  });

  async function onSubmit(input: CreateTicketInput) {
    setFormError(null);

    try {
      const attachmentIds = attachments.queue.getIds();
      const requestId = await submission.getId({...input,attachmentIds});
      const ticket = await createTicketMutation.mutateAsync({ ...input, requestId, attachmentIds });
      submission.clear(requestId);
      attachments.queue.clear();
      router.replace(`/tickets?created=${ticket.id}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setFormError(getCreateTicketErrorMessage(message));
    }
  }

  const isPending = isSubmitting || createTicketMutation.isPending;

  return (
    <form className="grid gap-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          className="h-12 text-base md:text-base"
          maxLength={120}
          aria-describedby={errors.title ? "ticket-title-error" : undefined}
          placeholder="예: 결제 영수증을 다시 받을 수 있나요?"
          aria-invalid={Boolean(errors.title)}
          disabled={isPending}
          {...register("title")}
        />
        {errors.title ? (
          <p id="ticket-title-error" role="alert" className="text-sm text-red-600">{errors.title.message}</p>
        ) : null}
      </div>

      <fieldset disabled={isPending} className="grid gap-3">
        <legend className="mb-3 text-sm font-medium">문의 유형</legend>
        <div className="flex flex-wrap gap-2">
          {ticketCategories.map((category) => (
            <label key={category} className="cursor-pointer">
              <input type="radio" value={category} className="peer sr-only" {...register("category")} />
              <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-input px-4 text-sm text-muted-foreground transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:font-medium peer-checked:text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-50">{categoryLabels[category]}</span>
            </label>
          ))}
        </div>
        {errors.category ? <p role="alert" className="text-sm text-red-600">{errors.category.message}</p> : null}
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor="content">문의 내용</Label>
        <Textarea
          id="content"
          className="min-h-60 resize-y text-base leading-7 md:text-base"
          maxLength={4000}
          aria-describedby={errors.content ? "ticket-content-error" : "ticket-content-hint"}
          placeholder="문의가 필요한 상황, 기대한 결과, 실제 결과를 함께 적어 주세요. 지원팀이 접수 후 확인합니다."
          aria-invalid={Boolean(errors.content)}
          disabled={isPending}
          {...register("content")}
        />
        <p id="ticket-content-hint" className="text-xs leading-5 text-muted-foreground">20자 이상, 최대 4,000자까지 입력할 수 있습니다.</p>
        {errors.content ? (
          <p id="ticket-content-error" role="alert" className="text-sm text-red-600">{errors.content.message}</p>
        ) : null}
      </div>

      <AttachmentPicker selection={attachments} disabled={isPending} />

      {formError ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <FormActions
        secondaryLabel="내 문의로 돌아가기"
        onSecondary={() => router.push("/tickets")}
        submitLabel="문의 접수하기"
        pendingLabel="접수 중…"
        pending={isPending}
        submitIcon={<Send className="size-4" aria-hidden="true" />}
      />
    </form>
  );
}
