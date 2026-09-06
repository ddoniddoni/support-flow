"use client";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { useDashboardStats } from "@/features/dashboard/hooks/use-dashboard-stats";
import type { Tables } from "@/types/database";

export function FlowBoardView({ profile }: { profile: Pick<Tables<"profiles">, "id" | "role"> }) {
  const query = useDashboardStats({ profile });
  const stats = query.data;
  return <div className="mx-auto grid max-w-[1600px] gap-4 px-3 py-4 sm:px-4 lg:px-6">
    <div className="flex items-start justify-between gap-3"><div><h1 className="text-xl font-semibold">처리 흐름</h1><p className="mt-1 text-sm text-muted-foreground">현재 접근 가능한 문의의 상태별 현황입니다.</p></div>
      <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>새로고침</Button></div>
    {query.isLoading ? <DashboardSkeleton /> : query.isError ? <p role="alert">처리 현황을 불러오지 못했습니다. 다시 시도해 주세요.</p> : stats ?
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[
        { status: "answer_pending", label: "답변 대기", count: stats.activeTickets },
        { status: "resolved", label: "답변 완료", count: stats.resolvedTickets },
        { status: "closed", label: "종료", count: stats.closedTickets },
      ].map(lane => <section key={lane.status} className="rounded-lg border bg-card p-4"><h2 className="font-semibold">{lane.label}</h2>
        <p className="my-6 text-3xl font-semibold tabular-nums">{lane.count}<span className="ml-1 text-sm font-normal">건</span></p>
        <Link href={`/tickets?status=${lane.status}`} className={buttonVariants({ variant: "outline", size: "sm" })}>문의 보기</Link>
      </section>)}</div> : null}
  </div>;
}
