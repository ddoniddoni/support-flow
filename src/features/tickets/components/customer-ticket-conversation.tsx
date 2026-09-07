"use client";

import { Headphones, MessageSquareText, UserRound } from "lucide-react";
import { AttachmentList } from "@/features/attachments/attachment-list";
import type { Attachment } from "@/features/attachments/validation";
import { cn } from "@/lib/utils";
import type { TicketReplyItem } from "../types";

const dayFormat = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
});
const timeFormat = new Intl.DateTimeFormat("ko-KR", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Seoul",
});

export function CustomerTicketConversation({
  replies,
  attachments,
}: {
  replies: TicketReplyItem[];
  attachments: Attachment[];
}) {
  return (
    <section
      id="customer-conversation"
      aria-labelledby="customer-conversation-heading"
      className="scroll-mt-6 rounded-xl border border-border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-5 sm:px-6">
        <div>
          <h2
            id="customer-conversation-heading"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <MessageSquareText
              className="size-5 text-primary"
              aria-hidden="true"
            />
            지원팀과의 대화
            <span className="text-sm font-normal text-muted-foreground">
              {replies.length}개
            </span>
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            내가 보낸 메시지와 지원팀 답변을 확인하세요.
          </p>
        </div>
        {replies.length > 1 ? (
          <a
            href={`#customer-reply-${replies[replies.length - 1].id}`}
            className="rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            최근 메시지로 이동 ↓
          </a>
        ) : null}
      </div>
      <div className="grid gap-5 p-4 sm:p-6">
        {replies.length === 0 ? (
          <div className="py-6 text-center">
            <p className="font-medium">지원팀 답변을 기다리고 있어요</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              답변이 등록되면 알림으로 알려드릴게요.
              <br />
              추가로 전달할 내용은 아래에 남겨 주세요.
            </p>
          </div>
        ) : (
          replies.map((reply, index) => {
            const isMine = reply.author_role === "customer";
            const day = dayFormat.format(new Date(reply.created_at));
            const newDay =
              index === 0 ||
              day !== dayFormat.format(new Date(replies[index - 1].created_at));
            return (
              <div key={reply.id} className="grid gap-5">
                {newDay ? (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    <span>{day}</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                ) : null}
                <article
                  id={`customer-reply-${reply.id}`}
                  aria-label={isMine ? "내 메시지" : "지원팀 답변"}
                  className={cn(
                    "min-w-0 scroll-mt-6 rounded-xl border p-4 sm:p-5",
                    isMine
                      ? "border-border bg-muted/25"
                      : "border-blue-200 bg-blue-50/60 dark:border-blue-900/60 dark:bg-blue-950/25",
                  )}
                >
                  <header className="mb-3 flex flex-wrap items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full",
                        isMine
                          ? "bg-muted text-muted-foreground"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200",
                      )}
                      aria-hidden="true"
                    >
                      {isMine ? (
                        <UserRound className="size-4" />
                      ) : (
                        <Headphones className="size-4" />
                      )}
                    </span>
                    <h3 className="text-sm font-semibold">
                      {isMine ? "나" : "SupportFlow 지원팀"}
                    </h3>
                    <time
                      dateTime={reply.created_at}
                      className="ml-auto text-xs text-muted-foreground"
                    >
                      {timeFormat.format(new Date(reply.created_at))}
                    </time>
                  </header>
                  <p className="whitespace-pre-wrap break-words text-base leading-8 text-foreground [overflow-wrap:anywhere]">
                    {reply.content}
                  </p>
                  <AttachmentList
                    attachments={attachments.filter(
                      (file) => file.reply_id === reply.id,
                    )}
                  />
                </article>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
