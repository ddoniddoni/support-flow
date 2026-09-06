"use client";

import {
  AlertCircle,
  Gauge,
  MessageCircleWarning,
  ShieldAlert,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/types/database";

import { useAIDashboardStats } from "../hooks/use-ai-dashboard-stats";

type AIDashboardInsightsProps = {
  profile: Pick<Tables<"profiles">, "id" | "role">;
};

function formatConfidence(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  return `${Math.round(value * 100)}%`;
}

function AIStatCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: string;
  value: string;
}) {
  return (
    <div className="min-h-28 rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className={tone} aria-hidden="true" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function AIDashboardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-border bg-background p-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-16" />
            <Skeleton className="mt-3 h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AIDashboardInsights({ profile }: AIDashboardInsightsProps) {
  const aiStatsQuery = useAIDashboardStats({ profile });

  if (profile.role === "customer") {
    return null;
  }

  if (aiStatsQuery.isLoading) {
    return <AIDashboardSkeleton />;
  }

  if (aiStatsQuery.isError) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
        <div>
          <p className="font-medium">AI 인사이트를 불러오지 못했습니다.</p>
          <p className="mt-1 text-red-600">
            잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.
          </p>
        </div>
      </div>
    );
  }

  const stats = aiStatsQuery.data;

  if (!stats) {
    return null;
  }

  const metrics = [
    {
      detail: "상담원이 확인해야 할 AI 분류",
      icon: ShieldAlert,
      label: "AI 검토 필요",
      tone: "size-4 text-red-600",
      value: String(stats.reviewRequiredCount),
    },
    {
      detail: "부정 감정으로 감지된 분석",
      icon: MessageCircleWarning,
      label: "부정 감정",
      tone: "size-4 text-orange-600",
      value: String(stats.negativeSentimentCount),
    },
    {
      detail: "높음 또는 긴급 검토",
      icon: Gauge,
      label: "높은 긴급도",
      tone: "size-4 text-amber-600",
      value: String(stats.highUrgencyCount),
    },
    {
      detail: `최근 7일 분석 ${stats.analysesThisWeek}건`,
      icon: Sparkles,
      label: "평균 신뢰도",
      tone: "size-4 text-sky-600",
      value: formatConfidence(stats.averageConfidence),
    },
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            AI 운영 인사이트
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            자동 분류 결과에서 긴급도, 감정, 검토 필요 항목을 추적합니다.
          </p>
        </div>
        <Link
          className={buttonVariants({ size: "sm", variant: "outline" })}
          href="/tickets/ai-review"
        >
          AI 검토
        </Link>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <AIStatCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 border-t border-border p-4 lg:grid-cols-[1fr_280px]">
        <div>
          <p className="text-sm font-semibold text-foreground">
            상위 AI 카테고리
          </p>
          <div className="mt-4 grid gap-3">
            {stats.topCategories.length ? (
              stats.topCategories.map((category) => (
                <div key={category.key}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-foreground">
                      {category.label}
                    </span>
                    <span className="text-muted-foreground">
                      {category.count}건 · {category.percentage}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                아직 집계할 AI 분석이 없습니다.
              </p>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-medium text-muted-foreground">
            총 AI 분석
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {stats.totalAnalyses}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            문의 접수와 티켓 상세에서 생성된 AI 자동 분류 기준입니다.
          </p>
        </div>
      </div>
    </section>
  );
}
