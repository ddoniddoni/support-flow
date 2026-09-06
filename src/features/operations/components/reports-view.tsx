"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { useDashboardStats } from "@/features/dashboard/hooks/use-dashboard-stats";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { AIDashboardInsights } from "@/features/ai/components/ai-dashboard-insights";
import type { Tables } from "@/types/database";

export function ReportsView({ profile }: { profile: Pick<Tables<"profiles">, "id" | "role"> }) {
  const queryClient = useQueryClient();
  const query = useDashboardStats({ profile });
  function refresh() {
    void query.refetch();
    void queryClient.invalidateQueries({ queryKey: ["ai-dashboard-stats", profile.id, profile.role] });
  }
  const stats = query.data;
  return <div className="mx-auto grid max-w-[1600px] gap-6 px-3 py-4 sm:px-4 lg:px-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-xl font-semibold">운영 리포트</h1>
        <p className="mt-1 text-sm text-muted-foreground">{profile.role === "admin" ? "전체 문의" : "내게 배정된 문의"}의 현재 처리 상태와 업무량입니다. 재분석은 AI 현황에 중복 집계하지 않습니다.</p></div>
      <Button variant="outline" disabled={query.isFetching} onClick={refresh}>새로고침</Button>
    </div>
    {query.isLoading ? <DashboardSkeleton /> : query.isError ?
      <div role="alert" className="rounded-lg border p-4"><p>리포트를 불러오지 못했습니다. 다시 시도해 주세요.</p></div> : stats && stats.totalTickets === 0 ?
      <EmptyState title="집계할 문의가 없습니다" description="접수되거나 배정된 문의가 생기면 운영 현황을 확인할 수 있습니다." /> : stats ? <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[["전체 문의", stats.totalTickets], ["답변 대기", stats.activeTickets], ["답변 완료", stats.resolvedTickets], ["담당자 필요", stats.unassignedActiveTickets]].map(([label, value]) =>
          <div key={label} className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{value}<span className="ml-1 text-sm font-normal">건</span></p></div>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[{ title: "답변 상태", items: stats.statusDistribution, filter: "status" }, { title: "문의 유형", items: stats.categoryDistribution, filter: "category" }].map(group =>
          <section key={group.title} className="rounded-lg border bg-card p-4"><h2 className="font-semibold">{group.title}</h2>
            <div className="mt-4 grid gap-4">{group.items.map(item => <Link key={item.key} href={`/tickets?${group.filter}=${item.key}`} className="block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="mb-2 flex justify-between text-sm"><span>{item.label}</span><span className="tabular-nums">{item.count}건 · {item.percentage}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${item.percentage}%` }} /></div>
            </Link>)}</div>
          </section>)}
      </div>
      <section className="rounded-lg border bg-card p-4"><h2 className="font-semibold">담당자별 답변 대기</h2>
        <p className="mt-1 text-sm text-muted-foreground">해결되거나 종료된 문의는 업무량에서 제외합니다.</p>
        <div className="mt-4 grid gap-3">{stats.assigneeWorkload.length ? stats.assigneeWorkload.map(item =>
          <div key={item.key} className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0 last:pb-0">
            <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">긴급 {item.urgentCount}건 · AI 검토 {item.needsReviewCount}건</p></div>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/tickets?status=answer_pending${profile.role === "admin" ? `&assignee=${item.assigneeId ?? "unassigned"}` : ""}`}>{item.answerPendingCount}건 보기</Link>
          </div>) : <p className="text-sm text-muted-foreground">답변 대기 중인 문의가 없습니다.</p>}</div>
      </section>
    </> : null}
    <AIDashboardInsights profile={profile} />
  </div>;
}
