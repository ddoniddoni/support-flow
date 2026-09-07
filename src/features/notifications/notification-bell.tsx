"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { ActionDialog } from "@/components/common/action-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications, useReadNotifications } from "./hooks";

const notificationDate = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});
const labels: Record<string, string> = {
  response_warning: "응답 목표가 곧 만료됩니다",
  response_breached: "응답 목표를 초과했습니다",
  assigned: "새 문의가 배정되었습니다",
  customer_message: "고객이 추가 메시지를 보냈습니다",
  staff_reply: "지원팀 답변이 도착했습니다",
};

export function NotificationBell({
  profileId,
  compact = false,
}: {
  profileId: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const query = useNotifications(profileId);
  const read = useReadNotifications();
  const items = query.data?.items ?? [];
  const unread = query.data?.unread ?? 0;
  const unreadIds = items
    .filter((item) => !item.read_at)
    .map((item) => item.id);
  const hasItems = query.isSuccess && items.length > 0;
  const allDisplayedRead = hasItems && unreadIds.length === 0;

  function openNotifications() {
    if (!read.isPending) read.reset();
    setOpen(true);
    void query.refetch();
  }

  return (
    <>
      <Button
        ref={trigger}
        size={compact ? "icon" : "default"}
        variant="outline"
        onClick={openNotifications}
        aria-label={
          query.isError
            ? "알림 확인 실패 — 다시 확인"
            : `알림${unread ? ` · 읽지 않음 ${unread}개` : ""}`
        }
        className="relative gap-2"
      >
        <Bell className="size-4" aria-hidden="true" />
        {!compact ? <span>알림</span> : null}
        {unread > 0 ? (
          <span
            className={cn(
              "rounded-full bg-primary px-1.5 text-xs leading-5 text-primary-foreground",
              compact && "absolute -top-2 -right-2",
            )}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
        {query.isError ? <span aria-hidden="true">!</span> : null}
      </Button>
      <ActionDialog
        open={open}
        onClose={() => setOpen(false)}
        finalFocus={trigger}
        title="내 알림"
        closeLabel="닫기"
        description="최근 알림 50개 · 15초마다 갱신합니다. 문의를 열면 확인한 메시지가 읽음 처리됩니다."
        body={
          <div className="grid gap-3">
            {query.isPending ? (
              <p role="status">알림을 불러오는 중…</p>
            ) : query.isError ? (
              <div role="alert">
                <p>알림을 불러오지 못했습니다.</p>
                <Button variant="outline" onClick={() => void query.refetch()}>
                  다시 시도
                </Button>
              </div>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                아직 알림이 없습니다. 새 배정·메시지·응답 지연 알림이 여기에
                표시됩니다.
              </p>
            ) : (
              <ul className="max-h-[50dvh] space-y-2 overflow-y-auto">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      onClick={() => setOpen(false)}
                      href={`/tickets/${item.ticket_id}`}
                      className={cn(
                        "block rounded-lg border p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        item.read_at
                          ? "border-border bg-muted/20"
                          : "border-primary/30 bg-primary/5",
                      )}
                    >
                      <span
                        className={cn(
                          "mb-2 flex items-center gap-1.5 text-xs font-medium",
                          item.read_at
                            ? "text-muted-foreground"
                            : "text-primary",
                        )}
                      >
                        {item.read_at ? (
                          <CheckCheck className="size-3.5" aria-hidden="true" />
                        ) : (
                          <span
                            className="size-1.5 rounded-full bg-primary"
                            aria-hidden="true"
                          />
                        )}
                        {item.read_at ? "읽음" : "읽지 않음"}
                      </span>
                      <p
                        className={cn(
                          "text-sm",
                          item.read_at
                            ? "font-medium text-muted-foreground"
                            : "font-semibold",
                        )}
                      >
                        {labels[item.kind] ?? "문의 알림"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm leading-6">
                        {item.ticket?.title ?? "문의 보기"}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {item.response_due_at
                          ? `알림 당시 응답 기한 ${notificationDate.format(new Date(item.response_due_at))} · `
                          : ""}
                        {item.ticket
                          ? `SF-${String(item.ticket.ticket_number).padStart(4, "0")} · `
                          : ""}
                        {notificationDate.format(new Date(item.created_at))}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div role="status" className="text-sm text-muted-foreground">
              {read.isSuccess && allDisplayedRead
                ? "표시된 알림을 모두 확인했습니다."
                : null}
            </div>
            {read.isError ? (
              <p role="alert" className="text-sm text-destructive">
                읽음 처리에 실패했습니다. 다시 시도해 주세요.
              </p>
            ) : null}
          </div>
        }
      >
        {hasItems ? (
          <Button
            disabled={allDisplayedRead || read.isPending}
            onClick={() => read.mutate({ ids: unreadIds })}
          >
            {read.isPending ? (
              "처리 중…"
            ) : allDisplayedRead ? (
              <>
                <CheckCheck aria-hidden="true" />
                표시된 알림 모두 읽음
              </>
            ) : (
              "표시된 알림 읽음 처리"
            )}
          </Button>
        ) : null}
      </ActionDialog>
    </>
  );
}
