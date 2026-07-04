"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

function getAgentTicketsHref(agentId: string) {
  return `/tickets?status=answer_pending&assignee=${agentId}`;
}

function AgentManagementSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}

function AgentRow({ agent }: { agent: AgentManagementRow }) {
  return (
    <div className="grid gap-3 border-b border-border px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_140px_140px_140px_132px] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-foreground">{agent.name}</p>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {agent.email}
        </p>
      </div>

      <Metric label="현재 배정" value={`${agent.answerPendingCount}건`} />
      <Metric label="긴급" value={`${agent.urgentCount}건`} />
      <Metric label="이번 주 완료" value={`${agent.completedThisWeekCount}건`} />
      <div className="grid gap-2 lg:justify-items-end">
        <p className="text-xs text-muted-foreground">
          최근 {formatDateTime(agent.latestActivityAt)}
        </p>
        <Link
          className={buttonVariants({
            className: "w-full lg:w-auto",
            size: "sm",
            variant: "outline",
          })}
          href={getAgentTicketsHref(agent.id)}
        >
          문의 보기
        </Link>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

export function AgentManagementView({ profile }: AgentManagementViewProps) {
  const agentsQuery = useAgentManagement({ profile });
  const data = agentsQuery.data;

  return (
    <div className="mx-auto grid max-w-[1600px] gap-4 px-3 py-4 sm:px-4 lg:px-6">
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
            <Badge variant="secondary">Admin</Badge>
            <h1 className="mt-3 text-2xl font-semibold text-foreground">
              담당자 관리
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              상담원 목록과 담당 문의 현황을 관리합니다.
            </p>
          </div>
        </div>
      </div>

      {agentsQuery.isLoading ? <AgentManagementSkeleton /> : null}

      {agentsQuery.isError ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
          <div>
            <p className="font-medium">담당자 현황을 불러오지 못했습니다.</p>
            <p className="mt-1 text-red-600">
              권한 정책과 네트워크 상태를 확인한 뒤 다시 시도해 주세요.
            </p>
          </div>
        </div>
      ) : null}

      {!agentsQuery.isLoading && !agentsQuery.isError && data ? (
        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>담당자 목록</CardTitle>
                <CardDescription>
                  담당자별 현재 배정 현황과 최근 활동입니다.
                </CardDescription>
              </div>
              <Badge variant="secondary">{data.summary.totalAgents}명</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.agents.length ? (
              data.agents.map((agent) => (
                <AgentRow key={agent.id} agent={agent} />
              ))
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                등록된 담당자가 없습니다.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
