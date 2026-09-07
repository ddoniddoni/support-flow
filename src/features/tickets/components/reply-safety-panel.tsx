"use client";
import { UsersRound, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionDialog } from "@/components/common/action-dialog";
import type { useReplySafety } from "../hooks/use-reply-safety";
export function ReplySafetyPanel({
  safety,
  profileId,
  onReview,
  onAccepted,
}: {
  safety: ReturnType<typeof useReplySafety>;
  profileId: string;
  onReview: () => void;
  onAccepted: () => void;
}) {
  const participants = [
    ...new Set(
      (safety.collaboration.data?.participants ?? []).map((person) =>
        person.actorId === profileId ? "나 (다른 창)" : person.name,
      ),
    ),
  ];
  return (
    <>
      <div
        role="status"
        className="flex h-20 items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3"
      >
        <UsersRound
          className="size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="min-w-0 text-sm leading-6">
          <p className="truncate font-medium" title={participants.join(", ")}>
            {safety.collaboration.isPending
              ? "다른 상담원의 작성 상태를 확인하는 중입니다"
              : safety.collaboration.isError
                ? "작성 상태를 확인하지 못했습니다"
                : participants.length
                  ? `${participants.join(", ")} 님이 작성 중입니다`
                  : "현재 다른 상담원이 작성 중이지 않습니다"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {safety.collaboration.isError
              ? "전송 시 새 메시지가 있는지 다시 확인합니다."
              : "5초마다 확인 · 전송 전 중복 안내를 확인해 주세요."}
          </p>
        </div>
      </div>
      {safety.conflict ? (
        <div
          role="alert"
          className="grid gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4"
        >
          <p className="flex items-start gap-2 text-sm font-medium leading-6 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="mt-1 size-4 shrink-0" />
            작성 기준 대화를 다시 확인해 주세요. 새 메시지가 있거나 복구한
            초안의 대화 기준을 확인할 수 없습니다.
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            작성 내용과 첨부는 유지됩니다. 최신 대화를 확인한 후 답변을 수정해
            전송하세요.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            disabled={safety.loading}
            onClick={onReview}
          >
            {safety.loading ? "대화 확인 중…" : "최신 대화 확인"}
          </Button>
        </div>
      ) : null}
      {safety.error ? (
        <p role="alert" className="text-sm text-destructive">
          {safety.error}
        </p>
      ) : null}
      <ActionDialog
        open={safety.review !== null}
        onClose={safety.dismissReview}
        title="최신 공개 대화를 확인하세요"
        description="최근 공개 메시지 최대 8개를 표시합니다. 새 답변과 중복되지 않도록 작성 내용을 검토해 주세요. 확인만으로 전송되지 않습니다."
        body={
          <div className="grid max-h-[45dvh] gap-3 overflow-y-auto">
            {safety.review?.replies.length ? (
              safety.review.replies.map((reply) => (
                <article key={reply.id} className="rounded-lg border p-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    {reply.author_role === "customer" ? "고객" : "지원팀"} ·{" "}
                    {reply.author?.name ?? "작성자"}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                    {reply.content}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                새 공개 메시지는 없습니다. 본문의 문의 내용과 작성한 답변을
                확인해 주세요.
              </p>
            )}
            {safety.review && safety.latest > safety.review.order ? (
              <p role="alert" className="text-sm text-destructive">
                확인 중 새 메시지가 도착했습니다. 다시 불러와 주세요.
              </p>
            ) : null}
          </div>
        }
      >
        <Button
          type="button"
          variant="outline"
          disabled={safety.loading}
          onClick={onReview}
        >
          다시 불러오기
        </Button>
        <Button
          type="button"
          disabled={!safety.review || safety.latest > safety.review.order}
          onClick={() => {
            if (safety.acceptReview()) onAccepted();
          }}
        >
          확인 후 계속 작성
        </Button>
      </ActionDialog>
    </>
  );
}
