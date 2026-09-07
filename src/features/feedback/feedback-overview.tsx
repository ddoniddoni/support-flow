"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ThumbsUp, MessageCircle, ClipboardCheck } from "lucide-react";
import { SignalCard } from "@/components/common/signal-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppSelect } from "@/components/ui/app-select";
import { useFeedbackOverview } from "./hooks";
export function FeedbackOverview({ profileId }: { profileId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const rating = ["all", "helpful", "unresolved"].includes(
    params.get("rating") ?? "",
  )
    ? params.get("rating")!
    : "all";
  const page = Math.max(
    1,
    Math.min(10000, Math.floor(Number(params.get("page")) || 1)),
  );
  const { stats, list } = useFeedbackOverview(profileId, rating, page);
  function navigate(changes: Record<string, string>) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => next.set(key, value));
    router.push(`/admin/feedback?${next}`);
  }
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6">
      <header>
        <p className="mb-2 text-sm font-medium text-primary">상담 품질</p>
        <h1 className="text-2xl font-semibold">고객 만족도</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          답변별 누적 평가를 확인합니다. 미해결 평가의 설명은 해당 문의의
          대화에도 기록됩니다.
        </p>
      </header>
      {stats.isLoading ? (
        <div
          className="h-28 animate-pulse rounded-xl bg-muted"
          role="status"
          aria-label="평가 통계 불러오는 중"
        />
      ) : stats.isError ? (
        <div role="alert">
          <p>평가 통계를 불러오지 못했습니다.</p>
          <Button variant="outline" onClick={() => void stats.refetch()}>
            통계 다시 시도
          </Button>
        </div>
      ) : stats.data ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <SignalCard
            label="도움이 된 답변 비율"
            value={
              stats.data.total
                ? `${Math.round((stats.data.helpful / stats.data.total) * 100)}%`
                : "—"
            }
            description="전체 누적 평가 중 긍정 평가 비율"
            tone="success"
            icon={ThumbsUp}
          />
          <SignalCard
            label="미해결 평가"
            value={`${stats.data.unresolved}건`}
            description="평가 당시 재상담을 요청한 답변"
            tone="warning"
            icon={MessageCircle}
          />
          <SignalCard
            label="전체 평가"
            value={`${stats.data.total}건`}
            description="동일 답변은 한 번만 집계합니다"
            tone="neutral"
            icon={ClipboardCheck}
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">
          평가 내역 {list.data ? `· ${list.data.total}건` : ""}
        </h2>
        <div className="w-48">
          <AppSelect
            aria-label="평가 필터"
            value={rating}
            onValueChange={(value) => navigate({ rating: value, page: "1" })}
            options={[
              { value: "all", label: "전체 평가" },
              { value: "unresolved", label: "미해결 평가" },
              { value: "helpful", label: "도움이 됐어요" },
            ]}
          />
        </div>
      </div>
      {list.isLoading ? (
        <div
          role="status"
          className="h-48 animate-pulse rounded-xl bg-muted"
          aria-label="평가 목록 불러오는 중"
        />
      ) : list.isError ? (
        <div role="alert">
          <p>평가 내역을 불러오지 못했습니다.</p>
          <Button variant="outline" onClick={() => void list.refetch()}>
            목록 다시 시도
          </Button>
        </div>
      ) : !list.data?.items.length ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">표시할 평가가 없습니다.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            고객이 답변을 평가하면 이곳에서 확인할 수 있습니다.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.data.items.map((item) => (
            <FeedbackEntry key={item.id} item={item} />
          ))}
        </div>
      )}
      {list.data ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => navigate({ page: String(page - 1) })}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {Math.max(1, Math.ceil(list.data.total / 20))}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page * 20 >= list.data.total}
            onClick={() => navigate({ page: String(page + 1) })}
          >
            다음
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type FeedbackItem = NonNullable<
  ReturnType<typeof useFeedbackOverview>["list"]["data"]
>["items"][number];
const feedbackDate = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});
function FeedbackEntry({ item }: { item: FeedbackItem }) {
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge
          variant="outline"
          className={
            item.helpful
              ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "border-amber-500/30 text-amber-700 dark:text-amber-300"
          }
        >
          {item.helpful ? "도움이 됐어요" : "미해결 평가"}
        </Badge>
        <time
          className="text-xs text-muted-foreground"
          dateTime={item.created_at}
        >
          {feedbackDate.format(new Date(item.created_at))}
        </time>
      </div>
      <Link
        href={`/tickets/${item.ticket_id}`}
        className="mt-3 block font-semibold hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
      >
        {item.ticket?.title ?? "문의 보기"}
      </Link>
      <p className="mt-2 text-xs text-muted-foreground">
        고객 {item.customer?.name ?? "고객"} · 답변 작성자{" "}
        {item.responder?.name ?? "지원팀"} · 현재{" "}
        {item.ticket?.status === "resolved"
          ? "답변 완료"
          : item.ticket?.status === "closed"
            ? "종료"
            : "답변 대기"}
      </p>
      <p className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-muted/30 p-3 text-sm leading-6">
        {item.comment || "별도 의견 없이 평가했습니다."}
      </p>
      <div className="mt-3 text-right">
        <Link
          href={`/tickets/${item.ticket_id}`}
          className="text-sm font-medium text-primary"
        >
          대화 확인 →
        </Link>
      </div>
    </article>
  );
}
