"use client";

import { useUnreadTickets } from "@/features/notifications/hooks";
import { AppSelect } from "@/components/ui/app-select";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { EmptyState, EmptyStateAction } from "@/components/common/empty-state";
import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
import {
  aiSentiments,
  aiUrgencies,
  ticketPriorities,
  type AISentiment,
  type AIUrgency,
} from "@/types/domain";

import type { TicketListFilters } from "../api/tickets-api";
import { useAgents } from "../hooks/use-agents";
import { useTickets } from "../hooks/use-tickets";
import { ticketCategories } from "../schemas/ticket-schema";
import type { TicketSortOption } from "../types";
import { BulkAssignableTickets } from "./bulk-assignable-tickets";
import { TicketListTable } from "./ticket-list-table";
import { TicketTableSkeleton } from "./ticket-table-skeleton";

type TicketListViewProps = {
  profile: Pick<Tables<"profiles">, "id" | "role">;
  createdTicketId?: string;
};

const statusLabels = {
  all: "전체 상태",
  answer_pending: "답변 대기",
  resolved: "답변 완료",
  closed: "종료",
} as const;

const statusFilterOptions = ["answer_pending", "resolved", "closed"] as const;
const statusTabOptions = ["all", ...statusFilterOptions] as const;

const priorityLabels = {
  all: "전체 우선순위",
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
} as const;

const categoryLabels: Record<string, string> = {
  all: "전체 카테고리",
  account: "계정",
  billing: "결제",
  technical: "기술 지원",
  product: "제품 문의",
  shipping: "배송",
  refund: "환불",
  complaint: "불만",
  other: "기타",
};

const sortLabels: Record<TicketSortOption, string> = {
  priority_first: "우선 확인순",
  created_desc: "최신순",
  created_asc: "오래된순",
  updated_desc: "최근 수정순",
  title_asc: "제목순",
};

const sortOptions: TicketSortOption[] = [
  "priority_first",
  "created_desc",
  "created_asc",
  "updated_desc",
  "title_asc",
];

const aiReviewLabels = {
  all: "전체 AI 검토",
  yes: "검토 필요",
  no: "일반 분류",
} as const;

const aiSentimentLabels = {
  all: "전체 감정",
  positive: "긍정",
  neutral: "중립",
  negative: "부정",
} as const;

const aiUrgencyLabels = {
  all: "전체 긴급도",
  low: "낮음",
  medium: "보통",
  high: "높음",
  critical: "긴급 검토",
} as const;

function getIntParam(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

function getStatusParam(value: string | null): TicketListFilters["status"] {
  if (
    value === "answer_pending" ||
    value === "open" ||
    value === "in_progress"
  ) {
    return "answer_pending";
  }

  if (value === "resolved" || value === "closed") {
    return value;
  }

  return "all";
}

function getAssigneeParam(value: string | null) {
  return value?.trim() || "all";
}

function getAIReviewParam(value: string | null) {
  if (value === "yes" || value === "no") {
    return value;
  }

  return "all";
}

function getAISentimentParam(value: string | null): AISentiment | "all" {
  if (value && aiSentiments.some((sentiment) => sentiment === value)) {
    return value as AISentiment;
  }

  return "all";
}

function getAIUrgencyParam(value: string | null): AIUrgency | "all" {
  if (value && aiUrgencies.some((urgency) => urgency === value)) {
    return value as AIUrgency;
  }

  return "all";
}

function getRoleDescription(role: Tables<"profiles">["role"]) {
  if (role === "customer") {
    return "내가 등록한 문의를 확인하고 지원팀 답변과 상태를 추적합니다.";
  }

  if (role === "agent") {
    return "나에게 배정된 문의만 표시됩니다. 고객 답변과 내부 메모, AI 검토를 처리할 수 있습니다.";
  }

  return "전체 고객 문의를 검색하고 답변 상태를 확인합니다.";
}


function TicketFilters({ profile, filters, searchInput, setSearchInput, handleSearchSubmit, updateParams, getStatusTabHref, agentsQuery }: {
  profile: TicketListViewProps["profile"];
  filters: TicketListFilters;
  searchInput: string;
  setSearchInput: (value: string) => void;
  handleSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  updateParams: (updates: Record<string, string | null>) => void;
  getStatusTabHref: (status: (typeof statusTabOptions)[number]) => string;
  agentsQuery: Pick<ReturnType<typeof useAgents>, "data" | "isLoading">;
}) {
  const isAgent = profile.role === "agent";
  const FilterDisclosure = isAgent ? "details" : "div";
  const advancedFilterCount = [filters.priority, filters.category, filters.aiNeedsReview, filters.aiSentiment, filters.aiUrgency].filter(value => value && value !== "all").length;
  return (
      <div className="grid gap-3 rounded-lg border border-border bg-card p-3 shadow-xs">
        {profile.role === "customer" ? null : (
          <div className="flex gap-1 overflow-x-auto border-b border-border pb-3">
            {statusTabOptions.map((status) => {
              const isActive = (filters.status ?? "all") === status;

              return (
                <Link
                  className={cn(
                    "inline-flex h-11 shrink-0 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                    isActive && "bg-accent text-accent-foreground",
                  )}
                  aria-current={isActive ? "page" : undefined}
                  href={getStatusTabHref(status)}
                  key={status}
                >
                  {statusLabels[status]}
                </Link>
              );
            })}
          </div>
        )}

        <div className={cn(isAgent && "grid gap-3 md:grid-cols-[1fr_200px] md:items-end")}>
        <form className="grid gap-2 sm:flex" onSubmit={handleSearchSubmit}>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 left-3 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label="문의 제목 검색"
              className={cn("pl-9", isAgent ? "h-11" : "h-9")}
              value={searchInput}
              placeholder="제목으로 검색…"
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <Button className={cn("w-full sm:w-auto", isAgent && "h-11 px-5")} type="submit">
            검색
          </Button>
        </form>
        {isAgent ? <AppSelect aria-label="정렬 기준" value={filters.sort ?? "priority_first"} onValueChange={value => updateParams({ sort: value, page: "1" })} options={sortOptions.map(value => ({ value, label: sortLabels[value] }))} /> : null}
        </div>

        <FilterDisclosure key={isAgent ? advancedFilterCount > 0 ? "filtered" : "unfiltered" : "default"} open={isAgent && advancedFilterCount > 0 ? true : undefined} className={cn(isAgent && "group rounded-lg border border-border bg-muted/20")}>
        {isAgent ? <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"><span>상세 필터 <span className="ml-2 text-xs font-normal text-muted-foreground">{advancedFilterCount ? `${advancedFilterCount}개 적용 중` : "우선순위 · 문의 유형 · AI"}</span></span><ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" /></summary> : null}
        <div className={cn("grid gap-3", isAgent && "border-t border-border p-4")}>
        <div
          className={cn(
            "grid gap-2",
            profile.role === "customer"
              ? "md:grid-cols-2"
              : profile.role === "admin"
                ? "md:grid-cols-5"
                : "md:grid-cols-2",
          )}
        >
          {profile.role === "customer" ? null : (
            <>
              {!isAgent ? <AppSelect
                aria-label="답변 상태 필터"
                value={filters.status ?? "all"}
                onValueChange={(value) => updateParams({ status: value, page: "1" })}
                options={[{ value: "all", label: statusLabels.all }, ...statusFilterOptions.map(value => ({ value, label: statusLabels[value] }))]}
              /> : null}

              <AppSelect
                aria-label="우선순위 필터"
                value={filters.priority ?? "all"}
                onValueChange={(value) => updateParams({ priority: value, page: "1" })}
                options={[{ value: "all", label: priorityLabels.all }, ...ticketPriorities.map(value => ({ value, label: priorityLabels[value] }))]}
              />

              {profile.role === "admin" ? (
                <AppSelect
                  aria-label="담당자 필터"
                  value={filters.assignee ?? "all"}
                  disabled={agentsQuery.isLoading}
                  onValueChange={(value) => updateParams({ assignee: value, page: "1" })}
                  options={[{ value: "all", label: "전체 담당자" }, { value: "unassigned", label: "담당자 필요" }, ...(agentsQuery.data ?? []).map(agent => ({ value: agent.id, label: agent.name }))]}
                />
              ) : null}
            </>
          )}

          <AppSelect
            aria-label="카테고리 필터"
            value={filters.category ?? "all"}
            onValueChange={(value) => updateParams({ category: value, page: "1" })}
            options={[{ value: "all", label: categoryLabels.all }, ...ticketCategories.map(value => ({ value, label: categoryLabels[value] }))]}
          />

          {!isAgent ? <AppSelect
            aria-label="정렬 기준"
            value={filters.sort ?? "created_desc"}
            onValueChange={(value) => updateParams({ sort: value, page: "1" })}
            options={sortOptions.map(value => ({ value, label: sortLabels[value] }))}
          /> : null}
        </div>

        {profile.role === "customer" ? null : (
          <div className="grid gap-2 md:grid-cols-3">
            <AppSelect
              aria-label="AI 검토 신호 필터"
              value={filters.aiNeedsReview ?? "all"}
              onValueChange={(value) => updateParams({ ai_review: value, page: "1" })}
              options={Object.entries(aiReviewLabels).map(([value, label]) => ({ value, label }))}
            />

            <AppSelect
              aria-label="AI 감정 필터"
              value={filters.aiSentiment ?? "all"}
              onValueChange={(value) => updateParams({ ai_sentiment: value, page: "1" })}
              options={[{ value: "all", label: aiSentimentLabels.all }, ...aiSentiments.map(value => ({ value, label: aiSentimentLabels[value] }))]}
            />

            <AppSelect
              aria-label="AI 긴급도 필터"
              value={filters.aiUrgency ?? "all"}
              onValueChange={(value) => updateParams({ ai_urgency: value, page: "1" })}
              options={[{ value: "all", label: aiUrgencyLabels.all }, ...aiUrgencies.map(value => ({ value, label: aiUrgencyLabels[value] }))]}
            />
          </div>
        )}
        {isAgent && advancedFilterCount > 0 ? <Button className="justify-self-start" variant="outline" onClick={() => updateParams({priority:null,category:null,ai_review:null,ai_sentiment:null,ai_urgency:null,page:"1"})}>상세 필터 초기화</Button> : null}
        </div>
        </FilterDisclosure>
      </div>
  );
}

export function TicketListView({
  profile,
  createdTicketId,
}: TicketListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const agentsQuery = useAgents(profile.role === "admin");

  const filters = useMemo<TicketListFilters>(() => {
    const sort = searchParams.get("sort") as TicketSortOption | null;
    const defaultSort = profile.role === "customer"
      ? "created_desc"
      : "priority_first";

    return {
      search: searchParams.get("q")?.trim() || undefined,
      status: getStatusParam(searchParams.get("status")),
      priority: searchParams.get("priority") as TicketListFilters["priority"],
      assignee: getAssigneeParam(searchParams.get("assignee")),
      category: searchParams.get("category") ?? "all",
      aiNeedsReview: getAIReviewParam(searchParams.get("ai_review")),
      aiSentiment: getAISentimentParam(searchParams.get("ai_sentiment")),
      aiUrgency: getAIUrgencyParam(searchParams.get("ai_urgency")),
      sort: sortOptions.includes(sort ?? defaultSort)
        ? sort ?? defaultSort
        : defaultSort,
      page: getIntParam(searchParams.get("page"), 1),
      pageSize: 7,
    };
  }, [profile.role, searchParams]);

  const ticketsQuery = useTickets({ profile, filters });

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all" || (key === "page" && value === "1")) {
        params.delete(key);
        return;
      }

      params.set(key, value);
    });

    params.delete("created");
    params.delete("selected");
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParams({ q: searchInput.trim(), page: "1" });
  }

  const page = filters.page ?? 1;
  const data = ticketsQuery.data;
  const unreadQuery = useUnreadTickets(profile.id, data?.tickets.map(ticket=>ticket.id) ?? []);
  const hasTickets = Boolean(data?.tickets.length);
  const isAgent = profile.role === "agent";


  function getStatusTabHref(status: (typeof statusTabOptions)[number]) {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("created");
    params.delete("selected");
    params.delete("page");

    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  return (
    <div className={cn("mx-auto grid gap-5", profile.role === "customer" ? "max-w-6xl px-5 py-8 sm:px-8" : isAgent ? "max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8" : "max-w-[1600px] px-3 py-4 sm:px-4 lg:px-6")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {profile.role === "customer" ? "내 문의" : profile.role === "agent" ? "내 배정 문의" : "문의함"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {getRoleDescription(profile.role)}
          </p>
        </div>
        {profile.role === "customer" ? (
          <Link
            className={buttonVariants({ className: "w-full sm:w-auto" })}
            href="/tickets/new"
          >
            <Plus className="size-4" aria-hidden="true" />
            문의 등록
          </Link>
        ) : null}
      </div>

      {createdTicketId ? (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {profile.role === "customer"
            ? "문의가 등록되었습니다. 답변이 준비되면 이 목록에서 확인할 수 있습니다."
            : `문의가 등록되었습니다. 접수 번호: ${createdTicketId}`}
        </div>
      ) : null}

      <TicketFilters profile={profile} filters={filters} searchInput={searchInput} setSearchInput={setSearchInput} handleSearchSubmit={handleSearchSubmit} updateParams={updateParams} getStatusTabHref={getStatusTabHref} agentsQuery={agentsQuery} />

      {isAgent && data && !ticketsQuery.isLoading ? <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold">{statusLabels[filters.status === "open" || filters.status === "in_progress" ? "answer_pending" : filters.status ?? "all"]} <span className="ml-1 tabular-nums text-primary">{data.total}건</span></h2><p className="text-xs text-muted-foreground">본인 배정 문의 기준</p></div> : null}
      {ticketsQuery.isLoading ? <TicketTableSkeleton /> : null}

      {ticketsQuery.isError ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
          <div>
            <p className="font-medium">문의 목록을 불러오지 못했습니다.</p>
            <p className="mt-1 text-red-600">
              잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.
            </p>
          </div>
        </div>
      ) : null}

      {!ticketsQuery.isLoading && !ticketsQuery.isError && !hasTickets ? (
        <EmptyState
          title="조건에 맞는 문의가 없습니다"
          description={profile.role === "agent" ? "배정된 문의 중 검색 조건에 맞는 항목이 없습니다. 필터를 확인하거나 관리자에게 문의 배정을 요청해 주세요." : "검색어나 필터를 조정하면 다른 문의를 확인할 수 있습니다."}
          action={
            profile.role === "customer" ? (
              <EmptyStateAction href="/tickets/new">문의 등록</EmptyStateAction>
            ) : null
          }
        />
      ) : null}

      {!ticketsQuery.isLoading && !ticketsQuery.isError && data ? (
        <div className={cn(!hasTickets && "hidden")}>
          {profile.role === "admin" ? <BulkAssignableTickets key={searchParams.toString()} tickets={data.tickets} unreadCounts={unreadQuery.data} /> : <TicketListTable tickets={data.tickets} role={profile.role} unreadCounts={unreadQuery.data} />}
          <div className="mt-4 grid justify-items-center gap-2 text-sm text-muted-foreground">
            <p>
              총 {data.total}건 중 {data.tickets.length}건 표시
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={page <= 1}
                aria-label="이전 페이지"
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <span className="min-w-14 text-center tabular-nums">
                {page} / {data.pageCount}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={page >= data.pageCount}
                aria-label="다음 페이지"
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
