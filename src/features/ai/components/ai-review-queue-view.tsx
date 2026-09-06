"use client";

import { AlertCircle, Search, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EmptyState, EmptyStateAction } from "@/components/common/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
import { aiSentiments, aiUrgencies, type AISentiment, type AIUrgency } from "@/types/domain";

import type { AIReviewQueueFilters } from "../api/get-ai-review-queue";
import { useAIReviewQueue } from "../hooks/use-ai-review-queue";
import { AIReviewTable } from "./ai-review-table";
import { AIReviewTableSkeleton } from "./ai-review-table-skeleton";

type AIReviewQueueViewProps = {
  profile: Pick<Tables<"profiles">, "id" | "email" | "name" | "role">;
};

const sentimentLabels: Record<AISentiment | "all", string> = {
  all: "전체 감정",
  positive: "긍정",
  neutral: "중립",
  negative: "부정",
};

const urgencyLabels: Record<AIUrgency | "all", string> = {
  all: "전체 긴급도",
  low: "낮음",
  medium: "보통",
  high: "높음",
  critical: "긴급 검토",
};

function getIntParam(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

function getSentimentParam(value: string | null): AISentiment | "all" {
  if (value && aiSentiments.some((sentiment) => sentiment === value)) {
    return value as AISentiment;
  }

  return "all";
}

function getUrgencyParam(value: string | null): AIUrgency | "all" {
  if (value && aiUrgencies.some((urgency) => urgency === value)) {
    return value as AIUrgency;
  }

  return "all";
}

function UnauthorizedReviewState() {
  return (
    <div className="mx-auto grid max-w-3xl gap-5 px-5 py-7 sm:px-6 lg:px-8">
      <EmptyState
        title="AI 검토 화면에 접근할 수 없습니다"
        description="AI 자동 분류 결과와 운영자용 검토 항목은 상담원과 관리자만 확인할 수 있습니다."
        action={<EmptyStateAction href="/tickets">문의함으로 이동</EmptyStateAction>}
      />
    </div>
  );
}

export function AIReviewQueueView({ profile }: AIReviewQueueViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  const filters = useMemo<AIReviewQueueFilters>(() => {
    return {
      search: searchParams.get("q")?.trim() || undefined,
      sentiment: getSentimentParam(searchParams.get("sentiment")),
      urgency: getUrgencyParam(searchParams.get("urgency")),
      page: getIntParam(searchParams.get("page"), 1),
      pageSize: 10,
    };
  }, [searchParams]);

  const reviewQueueQuery = useAIReviewQueue({ profile, filters });

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all" || (key === "page" && value === "1")) {
        params.delete(key);
        return;
      }

      params.set(key, value);
    });

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParams({ q: searchInput.trim(), page: "1" });
  }

  if (profile.role === "customer") {
    return <UnauthorizedReviewState />;
  }

  const page = filters.page ?? 1;
  const data = reviewQueueQuery.data;
  const hasItems = Boolean(data?.items.length);

  return (
    <div className="mx-auto grid max-w-[1600px] gap-4 px-3 py-4 sm:px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-semibold text-foreground">
              AI 검토
            </h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            AI가 자동 분류한 문의 중 낮은 신뢰도, 높은 긴급도, 상담원 확인이 필요한 항목을 모아 봅니다.
          </p>
        </div>
        <Link
          className={buttonVariants({
            variant: "outline",
            className: "w-full sm:w-auto",
          })}
          href="/tickets"
        >
          문의함
        </Link>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
        <form className="grid gap-2 sm:flex" onSubmit={handleSearchSubmit}>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="pl-8"
              value={searchInput}
              placeholder="문의 제목 검색"
              aria-label="검토할 문의 제목 검색"
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <Button className="w-full sm:w-auto" type="submit">
            검색
          </Button>
        </form>

        <div className="grid gap-2 md:grid-cols-2">
          <select
            className="h-11 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            aria-label="감정 필터"
            value={filters.sentiment ?? "all"}
            onChange={(event) =>
              updateParams({ sentiment: event.target.value, page: "1" })
            }
          >
            <option value="all">{sentimentLabels.all}</option>
            {aiSentiments.map((sentiment) => (
              <option key={sentiment} value={sentiment}>
                {sentimentLabels[sentiment]}
              </option>
            ))}
          </select>

          <select
            className="h-11 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            aria-label="긴급도 필터"
            value={filters.urgency ?? "all"}
            onChange={(event) =>
              updateParams({ urgency: event.target.value, page: "1" })
            }
          >
            <option value="all">{urgencyLabels.all}</option>
            {aiUrgencies.map((urgency) => (
              <option key={urgency} value={urgency}>
                {urgencyLabels[urgency]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {reviewQueueQuery.isLoading ? <AIReviewTableSkeleton /> : null}

      {reviewQueueQuery.isError ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
          <div>
            <p className="font-medium">AI 검토 항목을 불러오지 못했습니다.</p>
            <p className="mt-1 text-red-600">
              잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.
            </p>
          </div>
        </div>
      ) : null}

      {!reviewQueueQuery.isLoading && !reviewQueueQuery.isError && !hasItems ? (
        <EmptyState
          title="검토할 AI 분류가 없습니다"
          description="현재 조건에 맞는 검토 항목이 없습니다. 새 문의가 접수되면 AI 자동 분류 결과가 이곳에 반영됩니다."
        />
      ) : null}

      {!reviewQueueQuery.isLoading && !reviewQueueQuery.isError && data ? (
        <div className={cn(!hasItems && "hidden")}>
          <AIReviewTable items={data.items} />
          <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              총 {data.total}건 중 {data.items.length}건 표시
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1}
                className="w-full sm:w-auto"
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                이전
              </Button>
              <span>
                {page} / {data.pageCount}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={page >= data.pageCount}
                className="w-full sm:w-auto"
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                다음
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
