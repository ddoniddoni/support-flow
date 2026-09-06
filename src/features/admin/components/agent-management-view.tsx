"use client";

import { AlertCircle, ArrowLeft, ArrowRight, UsersRound } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/types/database";

import type { AgentManagementRow } from "../api/agent-management-api";
import { useAgentManagement } from "../hooks/use-agent-management";

type AgentManagementViewProps = {
  profile: Pick<Tables<"profiles">, "id" | "email" | "name" | "role">;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "활동 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAgentTicketsHref(agent: AgentManagementRow) {
  return `/tickets?status=${agent.answerPendingCount > 0 ? "answer_pending" : "all"}&assignee=${agent.id}`;
}

function AgentManagementSkeleton() {
  return (
    <div className="grid gap-4" aria-label="상담원 현황 불러오는 중">
      <Skeleton className="h-12 w-60" />
      <Skeleton className="h-52 rounded-xl sm:h-44" />
    </div>
  );
}

function AgentRow({ agent }: { agent: AgentManagementRow }) {
  return (
    <article aria-label={`${agent.name} 처리 현황`} className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:items-center md:gap-8">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200">
            {agent.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h3 className="break-words text-base font-semibold leading-6 text-foreground">{agent.name}</h3>
            <p className="mt-1 break-all text-sm leading-5 text-muted-foreground">{agent.email}</p>
          </div>
        </div>
        <dl className="grid grid-cols-3 divide-x divide-border rounded-lg bg-muted/40 py-4">
          <Metric label="답변 대기" value={agent.answerPendingCount} tone={agent.answerPendingCount > 0 ? "pending" : "default"} />
          <Metric label="긴급 대기" value={agent.urgentCount} tone={agent.urgentCount > 0 ? "urgent" : "default"} />
          <Metric label="이번 주 완료" value={agent.completedThisWeekCount} tone="default" />
        </dl>
      </div>
      {agent.answerPendingCount === 0 ? <p className="mt-4 text-sm leading-6 text-muted-foreground">배정된 답변 대기 문의가 없습니다. 완료된 문의는 배정 문의에서 확인할 수 있습니다.</p> : null}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm leading-6 text-muted-foreground">
          문의 최근 변경 <span className="ml-1 text-foreground">{agent.latestActivityAt ? formatDateTime(agent.latestActivityAt) : "기록 없음"}</span>
        </p>
        <Link
          aria-label={`${agent.name} ${agent.answerPendingCount > 0 ? "답변 대기" : "배정"} 문의 보기`}
          className={buttonVariants({ size: "sm", variant: "outline", className: "gap-2" })}
          href={getAgentTicketsHref(agent)}
        >
          {agent.answerPendingCount > 0 ? "답변 대기 보기" : "배정 문의 보기"} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "default" | "pending" | "urgent" }) {
  const color = tone === "urgent" ? "text-red-700 dark:text-red-300" : tone === "pending" ? "text-blue-700 dark:text-blue-300" : "text-foreground";
  return (
    <div className="px-2 text-center sm:px-4">
      <dt className="whitespace-nowrap text-xs font-medium leading-5 text-muted-foreground sm:text-sm">{label}</dt>
      <dd className={`mt-1 text-2xl font-semibold leading-8 tabular-nums ${color}`}>
        {value}<span className="ml-1 text-sm font-normal text-muted-foreground">건</span>
      </dd>
    </div>
  );
}

export function AgentManagementView({ profile }: AgentManagementViewProps) {
  const agentsQuery = useAgentManagement({ profile });
  const data = agentsQuery.data;

  return (
    <div className="mx-auto grid max-w-[1120px] gap-6 px-4 py-6 sm:px-6 lg:px-8 dark:[--muted-foreground:#b0bed1]">
      <div className="flex flex-col gap-3">
        <Link
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          href="/admin"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          관리자 홈
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="secondary">관리자 전용</Badge>
            <h1 className="mt-3 text-2xl font-semibold text-foreground">
              상담원 현황
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              상담원별 배정 문의와 처리 현황을 확인합니다.
            </p>
          </div>
        </div>
      </div>

      {agentsQuery.isLoading ? <AgentManagementSkeleton /> : null}

      {agentsQuery.isError ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
          <div>
            <p role="alert" className="font-medium">상담원 현황을 불러오지 못했습니다.</p>
            <p className="mt-1">
              잠시 후 다시 시도해 주세요.
            </p>
            <Button className="mt-3" variant="outline" onClick={() => void agentsQuery.refetch()}>다시 시도</Button>
          </div>
        </div>
      ) : null}

      {!agentsQuery.isLoading && !agentsQuery.isError && data ? (
        <section aria-labelledby="agent-list-heading" className="grid gap-4">
          {data.summary.unassignedAnswerPendingCount > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/25">
              <div>
                <h2 className="font-semibold text-amber-900 dark:text-amber-200">담당자 배정이 필요한 문의 {data.summary.unassignedAnswerPendingCount}건</h2>
                <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-200/90">미배정 답변 대기 문의는 아래 상담원별 건수에 포함되지 않습니다.</p>
              </div>
              <Link href="/tickets?status=answer_pending&assignee=unassigned" className={buttonVariants({ variant: "outline" })}>미배정 문의 보기 <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </div>
          ) : null}
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="agent-list-heading" className="text-base font-semibold">상담원 <span className="ml-1 text-muted-foreground">{data.summary.totalAgents}명</span></h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">답변 대기에는 접수·처리 중인 문의가 포함됩니다.</p>
            </div>
            <span className="text-sm text-muted-foreground">답변 대기 많은 순</span>
          </div>
          {data.agents.length ? data.agents.map((agent) => <AgentRow key={agent.id} agent={agent} />) : (
            <div className="rounded-xl border border-border bg-card px-6 py-10 text-center">
              <UsersRound className="mx-auto mb-3 size-6 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium">등록된 상담원이 없습니다.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">사용자 관리에서 계정을 추가하거나 상담원 권한을 지정해 주세요.</p>
              <Link href="/admin/users" className={buttonVariants({ variant: "outline", className: "mt-4" })}>사용자 관리</Link>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
