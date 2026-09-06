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
  return role === "agent" ? "Agent" : "Admin";
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
    <div className="mx-auto grid max-w-[1600px] gap-4 px-3 py-4 sm:px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{getRoleLabel(profile.role)}</Badge>
            <span className="text-sm text-muted-foreground">
              {profile.email}
            </span>
          </div>
          <h1 className="mt-2 text-xl font-semibold text-foreground">
            오늘의 지원 운영
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
          ctaHref="/tickets"
          ctaLabel="문의함"
          emptyHref={profile.role === "customer" ? "/tickets/new" : "/tickets"}
          emptyLabel={profile.role === "customer" ? "문의 등록" : "문의함"}
          profileRole={profile.role}
          stats={statsQuery.data}
        />
      ) : null}

      <AIDashboardInsights profile={profile} />

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
        <span>통계는 현재 계정의 역할 기반 접근 범위로 집계됩니다.</span>
      </div>
    </div>
  );
}
