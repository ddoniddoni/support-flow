"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AIDashboardInsights } from "@/features/ai/components/ai-dashboard-insights";
import type { Tables } from "@/types/database";

import { useDashboardStats } from "../hooks/use-dashboard-stats";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { OperationsPreview } from "./operations-preview";

type DashboardViewProps = {
  profile: Pick<Tables<"profiles">, "id" | "email" | "name" | "role">;
};

function getRoleLabel(role: Tables<"profiles">["role"]) {
  return role === "agent" ? "상담원" : "관리자";
}

function getRoleDescription(role: Tables<"profiles">["role"]) {
  if (role === "agent") {
    return "내가 맡은 문의의 응답 필요 항목과 AI 검토 대상을 확인합니다.";
  }

  return "지원팀 전체의 응답 현황, AI 위험 신호, 담당자 부하를 확인합니다.";
}

export function DashboardView({ profile }: DashboardViewProps) {
  const statsQuery = useDashboardStats({ profile });

  return (
    <div className="mx-auto grid max-w-[1360px] gap-6 px-4 py-6 sm:px-6 lg:px-8 dark:[--muted-foreground:#a8b5c8]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{getRoleLabel(profile.role)}</Badge>
            <span className="text-sm text-muted-foreground">
              {profile.name}님
            </span>
          </div>
          <h1 className="mt-2 text-xl font-semibold text-foreground">
            {profile.role === "agent" ? "내 문의 처리 현황" : "오늘의 지원 운영"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {getRoleDescription(profile.role)}
          </p>
        </div>
      </div>

      {statsQuery.isLoading ? <DashboardSkeleton /> : null}

      {statsQuery.isError ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
          <div>
            <p className="font-medium">
              대시보드 통계를 불러오지 못했습니다.
            </p>
            <p className="mt-1 text-red-600">
              잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.
            </p>
          </div>
        </div>
      ) : null}

      {!statsQuery.isLoading && !statsQuery.isError && statsQuery.data ? (
        <OperationsPreview
          ctaHref="/tickets?status=answer_pending"
          ctaLabel={profile.role === "agent" ? "내 배정 문의" : "문의함"}
          emptyHref={profile.role === "customer" ? "/tickets/new" : "/tickets"}
          emptyLabel={profile.role === "customer" ? "문의 등록" : "문의함"}
          profileRole={profile.role}
          stats={statsQuery.data}
        />
      ) : null}

      <details className="rounded-xl border border-border bg-card"><summary className="cursor-pointer rounded-xl p-5 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">AI 분석 통계 <span className="ml-2 text-xs font-normal text-muted-foreground">감정 · 긴급도 · 신뢰도</span></summary><div className="border-t border-border p-4"><AIDashboardInsights profile={profile} /></div></details>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
        <span>통계는 현재 계정의 역할 기반 접근 범위로 집계됩니다.</span>
      </div>
    </div>
  );
}
