"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
    return "나에게 배정된 문의의 처리 상태와 우선순위를 추적합니다.";
  }

  return "전체 지원 운영 현황과 병목 구간을 한눈에 확인합니다.";
}

export function DashboardView({ profile }: DashboardViewProps) {
  const statsQuery = useDashboardStats({ profile });

  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-5 py-7 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{getRoleLabel(profile.role)}</Badge>
            <span className="text-sm text-muted-foreground">
              {profile.email}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-foreground">
            {profile.name}님의 운영 대시보드
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
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
              Supabase 권한 정책과 네트워크 상태를 확인한 뒤 다시 시도해
              주세요.
            </p>
          </div>
        </div>
      ) : null}

      {!statsQuery.isLoading && !statsQuery.isError && statsQuery.data ? (
        <OperationsPreview
          ctaHref="/tickets"
          ctaLabel="문의 목록"
          emptyHref={profile.role === "customer" ? "/tickets/new" : "/tickets"}
          emptyLabel={profile.role === "customer" ? "문의 등록" : "문의 목록"}
          stats={statsQuery.data}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
        <span>통계는 현재 계정의 역할 기반 접근 범위로 집계됩니다.</span>
      </div>
    </div>
  );
}
