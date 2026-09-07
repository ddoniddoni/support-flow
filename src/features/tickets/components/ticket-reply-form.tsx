"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LockKeyhole, Send } from "lucide-react";
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useReplySafety } from "../hooks/use-reply-safety";
import { ReplySafetyPanel } from "./reply-safety-panel";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useQueryClient } from "@tanstack/react-query";
import { TemplatePicker } from "@/features/reply-templates/template-picker";
import { AttachmentPicker } from "@/features/attachments/attachment-picker";
import { useAttachments } from "@/features/attachments/use-attachments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ActionDialog } from "@/components/common/action-dialog";
import type { Tables } from "@/types/database";

import { createSubmissionRequest } from "../utils/submission-request";
import { useReplyDraft } from "../hooks/use-reply-draft";
import { useCreateTicketReply } from "../hooks/use-create-ticket-reply";
import {
  ticketReplySchema,
  type TicketReplyInput,
} from "../schemas/ticket-schema";

export type ReplyComposerHandle = { useDraft: (draft: string) => void };

type TicketReplyFormProps = {
  ticketId: string;
  latestReplyOrder: number;
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
  latestReplyOrder,
}: TicketReplyFormProps) {
  const queryClient = useQueryClient();
  const [focused, setFocused] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<{content:string;kind:"ai"|"template"} | null>(null);
  const source = useRef<"manual" | "ai_draft">("manual");
  const attachments = useAttachments({scope:`${profile.id}:${ticketId}:${isInternal}`,ticketId,internal:isInternal});
  const createReply = useCreateTicketReply();
  const [submission] = useState(() => createSubmissionRequest(`${profile.id}:${ticketId}:${isInternal ? "internal" : "public"}`));
  const formId = isInternal ? "internal-note-content" : "reply-content";

  const {
    register,
    control,
    watch,
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

  const content = useWatch({ control, name: "content" });
  const staffPublic = profile.role !== "customer" && !isInternal;
  const safety = useReplySafety({ ticketId, profile, latestReplyOrder, enabled: staffPublic, hasDraft: !!content.trim(), typing: focused && !!content.trim() });
  const draftStatus = useReplyDraft({ accountId: profile.id, ticketId, internal: isInternal, sourceRef: source, watch, reset, conversationRef: safety.conversationRef, onRestoreVersion: safety.onRestoreVersion });

  function finishSent(requestId: string, recovered = false) {
    submission.clear(requestId);
    attachments.queue.clear();
    reset({ content: "" });
    source.current = "manual";
    safety.afterSent();
    setFormError(null);
    setSuccessMessage(recovered ? "이전 전송이 이미 등록된 것을 확인했습니다. 중복 전송하지 않았습니다." : isInternal ? "내부 메모를 추가했습니다." : profile.role === "customer" ? "메시지를 보냈습니다. 담당자의 답변을 기다려 주세요." : "고객 답변을 등록했습니다.");
  }
  async function checkAlreadySent() {
    let attachmentIds: string[];
    try { attachmentIds = attachments.queue.getIds(); } catch { return false; }
    const requestId = await submission.getId({ content: getValues("content").trim(), source: source.current, attachmentIds });
    const {data,error} = await createSupabaseBrowserClient().rpc("find_reply_submission", {p_ticket_id:ticketId,p_request_id:requestId});
    if(error)throw error;
    if(!data)return false;
    finishSent(requestId,true);
    await Promise.all(["ticket","tickets","notifications","dashboard-stats","agent-management"].map(key=>queryClient.invalidateQueries({queryKey:[key]})));
    return true;
  }
  function reviewConversation() { void safety.loadReview(checkAlreadySent); }


  function focusComposer() {
    setFocus("content");
    document.getElementById(formId)?.scrollIntoView({ block: "center", behavior: "instant" });
  }

  function applyDraft(draft: string, append = false, kind: "ai" | "template" = "ai") {
    safety.captureIfEmpty();
    const current = getValues("content");
    const content = append ? `${current}\n\n${draft}` : draft;
    if (content.length > 4000) { setFormError("작성 내용이 4,000자를 초과합니다. 내용을 줄이거나 교체해 주세요."); setPendingDraft(null); return; }
    source.current = kind === "ai" || (append && source.current === "ai_draft") ? "ai_draft" : "manual";
    setValue("content", content, { shouldDirty: true, shouldValidate: true });
    setPendingDraft(null);
    setSuccessMessage(`${kind === "ai" ? "AI 초안" : "답변 템플릿"}을 작성란에 넣었습니다. 내용을 검토한 뒤 고객에게 등록해 주세요.`);
    focusComposer();
  }

  useImperativeHandle(composerRef, () => ({
    useDraft(draft) {
      if (isSubmitting || createReply.isPending) return;
      if (getValues("content").trim()) setPendingDraft({content:draft,kind:"ai"});
      else applyDraft(draft);
    },
  }));

  async function onSubmit(input: TicketReplyInput) {
    setFormError(null);
    setSuccessMessage(null);

    if (staffPublic && safety.conflict) { reviewConversation(); return; }
    try {
      const attachmentIds = attachments.queue.getIds();
      const requestId = await submission.getId({ content: input.content, source: source.current, attachmentIds });
      await createReply.mutateAsync({
        expectedReplyOrder: safety.conversationRef.current,
        requestId,
        attachmentIds,
        ticketId,
        profile,
        isInternal,
        content: input.content,
        source: source.current,
      });
      finishSent(requestId);
    } catch (error) {
      if (staffPublic && error && typeof error === "object" && "code" in error && error.code === "40001") safety.flagConflict();
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
      {staffPublic ? <ReplySafetyPanel safety={safety} profileId={profile.id} onReview={reviewConversation} onAccepted={()=>{setFormError(null);setValue("content",getValues("content"),{shouldDirty:true});setFocus("content");}}/> : null}
      {!isCustomer && !isInternal ? <TemplatePicker profileId={profile.id} disabled={pending || pendingDraft !== null} onUse={content=>{ if(getValues("content").trim())setPendingDraft({content,kind:"template"});else applyDraft(content,false,"template"); }}/> : null}
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
          {...register("content", {onBlur:()=>setFocused(false)})}
          onFocus={()=>{safety.captureIfEmpty();setFocused(true);}}
        />
        {errors.content ? (
          <p id={`${formId}-error`} role="alert" className="text-sm text-red-600 dark:text-red-400">{errors.content.message}</p>
        ) : null}
      </div>

      <AttachmentPicker selection={attachments} disabled={pending} internal={isInternal} />
      <p className="text-xs leading-5 text-muted-foreground">{draftStatus}</p>
      {formError ? <p role="alert" className="text-sm text-red-600 dark:text-red-400">{formError}</p> : null}
      {successMessage ? (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p>
      ) : null}

      <Button className="w-full sm:w-fit" variant={isInternal ? "secondary" : "default"} disabled={pending || pendingDraft !== null || safety.loading} type="submit">
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
        description="기존 내용을 선택한 내용으로 교체하거나, 작성한 내용 뒤에 이어 붙일 수 있습니다. 취소하면 기존 내용이 유지됩니다."
        finalFocus={() => document.getElementById(formId)}
      >
        <Button type="button" variant="outline" onClick={() => { if (pendingDraft !== null) applyDraft(pendingDraft.content,false,pendingDraft.kind); }}>선택한 내용으로 교체</Button>
        <Button type="button" onClick={() => { if (pendingDraft !== null) applyDraft(pendingDraft.content,true,pendingDraft.kind); }}>뒤에 이어 붙이기</Button>
      </ActionDialog>
    </form>
  );
}
