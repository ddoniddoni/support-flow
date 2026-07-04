"use client";

import {
  AlertCircle,
  ArrowUpRight,
  Clock3,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { EmptyState, EmptyStateAction } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
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
import type { TicketListItem, TicketSortOption } from "../types";
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
  other: "기타",
};

const ticketStatusLabels = {
  open: "답변 대기",
  in_progress: "답변 대기",
  resolved: "답변 완료",
  closed: "종료",
} as const;

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
  all: "전체 AI 신호",
  yes: "주의 필요",
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

const slaTargetsByPriority = {
  low: 48,
  medium: 24,
  high: 8,
  urgent: 4,
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
    return "나에게 배정된 문의를 확인하고 답변 상태를 관리합니다.";
  }

  return "전체 고객 문의를 검색하고 답변 상태를 확인합니다.";
}

function formatTicketNumber(ticketNumber: number | null | undefined) {
  if (!ticketNumber) {
    return "접수번호 미지정";
  }

  return `SF-${String(ticketNumber).padStart(4, "0")}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAssigneeLabel(ticket: TicketListItem) {
  if (ticket.assignee?.name) {
    return ticket.assignee.name;
  }

  return ticket.status === "resolved" || ticket.status === "closed"
    ? "배정 없이 완료"
    : "담당자 지정 전";
}

function getSlaLabel(ticket: TicketListItem) {
  if (ticket.status === "resolved" || ticket.status === "closed") {
    return "SLA 충족";
  }

  const createdAt = new Date(ticket.created_at).getTime();
  const elapsedHours = (Date.now() - createdAt) / (1000 * 60 * 60);
  const targetHours = slaTargetsByPriority[ticket.priority];

  if (elapsedHours >= targetHours) {
    return "SLA 초과";
  }

  return `SLA ${Math.max(Math.ceil(targetHours - elapsedHours), 1)}h 남음`;
}

function getTicketTags(ticket: TicketListItem) {
  return [
    categoryLabels[ticket.category] ?? ticket.category,
    ...(ticket.latest_ai_analysis?.tags ?? []),
  ].slice(0, 5);
}

function DetailMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}

function SelectedTicketPanel({ ticket }: { ticket: TicketListItem | null }) {
  if (!ticket) {
    return (
      <aside className="rounded-lg border border-border bg-card p-4 shadow-xs">
        <p className="text-sm font-medium text-foreground">
          선택된 문의가 없습니다
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          문의가 접수되면 이 영역에서 처리 맥락을 확인합니다.
        </p>
      </aside>
    );
  }

  return (
    <aside className="grid content-start gap-3 rounded-lg border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {formatTicketNumber(ticket.ticket_number)}
          </p>
          <h2 className="mt-1 line-clamp-2 text-base font-semibold text-foreground">
            {ticket.title}
          </h2>
        </div>
        <Link
          className={buttonVariants({ size: "icon-sm", variant: "outline" })}
          href={`/tickets/${ticket.id}`}
          aria-label="문의 상세 열기"
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <p className="line-clamp-5 text-sm leading-6 text-muted-foreground">
        {ticket.latest_ai_analysis?.summary ?? ticket.content}
      </p>

      <div className="grid grid-cols-2 gap-3 border-y border-border py-3">
        <DetailMetric
          label="답변 상태"
          value={ticketStatusLabels[ticket.status]}
        />
        <DetailMetric label="우선순위" value={priorityLabels[ticket.priority]} />
        <DetailMetric label="SLA" value={getSlaLabel(ticket)} />
        <DetailMetric label="담당자" value={getAssigneeLabel(ticket)} />
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">태그</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {getTicketTags(ticket).map((tag) => (
            <Badge
              className="border-border bg-background text-muted-foreground"
              key={tag}
              variant="outline"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </aside>
  );
}

function CustomerContextPanel({ ticket }: { ticket: TicketListItem | null }) {
  if (!ticket) {
    return (
      <aside className="rounded-lg border border-border bg-card p-4 shadow-xs">
        <p className="text-sm font-medium text-foreground">고객 Context</p>
        <p className="mt-1 text-xs text-muted-foreground">
          문의를 선택하면 고객과 최근 접수 정보를 표시합니다.
        </p>
      </aside>
    );
  }

  return (
    <aside className="grid content-start gap-4 rounded-lg border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <UserRound className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {ticket.customer?.name ?? "고객 정보 없음"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {ticket.customer?.email ?? "이메일 정보 없음"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 text-sm">
        <DetailMetric
          label="문의 유형"
          value={categoryLabels[ticket.category] ?? ticket.category}
        />
        <DetailMetric
          label="AI 의도"
          value={ticket.latest_ai_analysis?.intent ?? "분류 대기"}
        />
        <DetailMetric
          label="접수 시각"
          value={formatDateTime(ticket.created_at)}
        />
        <DetailMetric
          label="최근 업데이트"
          value={formatDateTime(ticket.updated_at)}
        />
      </div>

      <div className="rounded-md border border-border bg-muted/40 p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Clock3 className="size-3.5" aria-hidden="true" />
          처리 메모
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          답변 전에는 SLA와 우선순위를 먼저 확인하고, 답변 완료 후에는 담당자
          미지정 상태가 운영 리스크로 표시되지 않도록 처리됩니다.
        </p>
      </div>
    </aside>
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
      pageSize: 10,
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
    if (!("selected" in updates)) {
      params.delete("selected");
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParams({ q: searchInput.trim(), page: "1" });
  }

  const page = filters.page ?? 1;
  const data = ticketsQuery.data;
  const hasTickets = Boolean(data?.tickets.length);
  const selectedTicket =
    data?.tickets.find((ticket) => ticket.id === searchParams.get("selected")) ??
    data?.tickets[0] ??
    null;
  const selectedTicketId = selectedTicket?.id ?? null;

  function getSelectedTicketHref(ticketId: string) {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("created");
    params.set("selected", ticketId);

    return `${pathname}?${params.toString()}`;
  }

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
    <div className="mx-auto grid max-w-[1600px] gap-4 px-3 py-4 sm:px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {profile.role === "customer" ? "내 문의" : "문의 Inbox"}
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

      <div className="grid gap-3 rounded-lg border border-border bg-card p-3 shadow-xs">
        {profile.role === "customer" ? null : (
          <div className="flex gap-1 overflow-x-auto border-b border-border pb-3">
            {statusTabOptions.map((status) => {
              const isActive = (filters.status ?? "all") === status;

              return (
                <Link
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                    isActive && "bg-accent text-accent-foreground",
                  )}
                  href={getStatusTabHref(status)}
                  key={status}
                >
                  {statusLabels[status]}
                </Link>
              );
            })}
          </div>
        )}

        <form className="grid gap-2 sm:flex" onSubmit={handleSearchSubmit}>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label="문의 제목 검색"
              className="h-9 pl-8"
              value={searchInput}
              placeholder="제목으로 검색…"
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <Button className="w-full sm:w-auto" type="submit">
            검색
          </Button>
        </form>

        <div
          className={cn(
            "grid gap-2",
            profile.role === "customer"
              ? "md:grid-cols-2"
              : profile.role === "admin"
                ? "md:grid-cols-5"
                : "md:grid-cols-4",
          )}
        >
          {profile.role === "customer" ? null : (
            <>
              <select
                aria-label="답변 상태 필터"
                className="h-9 rounded-md border border-input bg-background px-2.5 text-sm font-medium text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                value={filters.status ?? "all"}
                onChange={(event) =>
                  updateParams({ status: event.target.value, page: "1" })
                }
              >
                <option value="all">{statusLabels.all}</option>
                {statusFilterOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>

              <select
                aria-label="우선순위 필터"
                className="h-9 rounded-md border border-input bg-background px-2.5 text-sm font-medium text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                value={filters.priority ?? "all"}
                onChange={(event) =>
                  updateParams({ priority: event.target.value, page: "1" })
                }
              >
                <option value="all">{priorityLabels.all}</option>
                {ticketPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityLabels[priority]}
                  </option>
                ))}
              </select>

              {profile.role === "admin" ? (
                <select
                  aria-label="담당자 필터"
                  className="h-9 rounded-md border border-input bg-background px-2.5 text-sm font-medium text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                  value={filters.assignee ?? "all"}
                  disabled={agentsQuery.isLoading}
                  onChange={(event) =>
                    updateParams({ assignee: event.target.value, page: "1" })
                  }
                >
                  <option value="all">전체 담당자</option>
                  <option value="unassigned">담당자 지정 전</option>
                  {(agentsQuery.data ?? []).map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </>
          )}

          <select
            aria-label="카테고리 필터"
            className="h-9 rounded-md border border-input bg-background px-2.5 text-sm font-medium text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            value={filters.category ?? "all"}
            onChange={(event) =>
              updateParams({ category: event.target.value, page: "1" })
            }
          >
            <option value="all">{categoryLabels.all}</option>
            {ticketCategories.map((category) => (
              <option key={category} value={category}>
                {categoryLabels[category]}
              </option>
            ))}
          </select>

          <select
            aria-label="정렬 기준"
            className="h-9 rounded-md border border-input bg-background px-2.5 text-sm font-medium text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            value={filters.sort ?? "created_desc"}
            onChange={(event) =>
              updateParams({ sort: event.target.value, page: "1" })
            }
          >
            {sortOptions.map((sort) => (
              <option key={sort} value={sort}>
                {sortLabels[sort]}
              </option>
            ))}
          </select>
        </div>

        {profile.role === "customer" ? null : (
          <div className="grid gap-2 md:grid-cols-3">
            <select
              aria-label="AI 검토 신호 필터"
              className="h-9 rounded-md border border-input bg-background px-2.5 text-sm font-medium text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              value={filters.aiNeedsReview ?? "all"}
              onChange={(event) =>
                updateParams({ ai_review: event.target.value, page: "1" })
              }
            >
              <option value="all">{aiReviewLabels.all}</option>
              <option value="yes">{aiReviewLabels.yes}</option>
              <option value="no">{aiReviewLabels.no}</option>
            </select>

            <select
              aria-label="AI 감정 필터"
              className="h-9 rounded-md border border-input bg-background px-2.5 text-sm font-medium text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              value={filters.aiSentiment ?? "all"}
              onChange={(event) =>
                updateParams({ ai_sentiment: event.target.value, page: "1" })
              }
            >
              <option value="all">{aiSentimentLabels.all}</option>
              {aiSentiments.map((sentiment) => (
                <option key={sentiment} value={sentiment}>
                  {aiSentimentLabels[sentiment]}
                </option>
              ))}
            </select>

            <select
              aria-label="AI 긴급도 필터"
              className="h-9 rounded-md border border-input bg-background px-2.5 text-sm font-medium text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              value={filters.aiUrgency ?? "all"}
              onChange={(event) =>
                updateParams({ ai_urgency: event.target.value, page: "1" })
              }
            >
              <option value="all">{aiUrgencyLabels.all}</option>
              {aiUrgencies.map((urgency) => (
                <option key={urgency} value={urgency}>
                  {aiUrgencyLabels[urgency]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {ticketsQuery.isLoading ? <TicketTableSkeleton /> : null}

      {ticketsQuery.isError ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
          <div>
            <p className="font-medium">문의 목록을 불러오지 못했습니다.</p>
            <p className="mt-1 text-red-600">
              Supabase 권한 정책과 네트워크 상태를 확인한 뒤 다시 시도해
              주세요.
            </p>
          </div>
        </div>
      ) : null}

      {!ticketsQuery.isLoading && !ticketsQuery.isError && !hasTickets ? (
        <EmptyState
          title="조건에 맞는 문의가 없습니다"
          description="검색어나 필터를 조정하면 다른 문의를 확인할 수 있습니다."
          action={
            profile.role === "customer" ? (
              <EmptyStateAction href="/tickets/new">문의 등록</EmptyStateAction>
            ) : null
          }
        />
      ) : null}

      {!ticketsQuery.isLoading && !ticketsQuery.isError && data ? (
        <div className={cn(!hasTickets && "hidden")}>
          {profile.role === "customer" ? (
            <TicketListTable tickets={data.tickets} role={profile.role} />
          ) : (
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px_280px]">
              <section className="min-w-0">
                <TicketListTable
                  getTicketHref={getSelectedTicketHref}
                  selectedTicketId={selectedTicketId}
                  tickets={data.tickets}
                  role={profile.role}
                />
              </section>
              <SelectedTicketPanel ticket={selectedTicket} />
              <CustomerContextPanel ticket={selectedTicket} />
            </div>
          )}
          <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              총 {data.total}건 중 {data.tickets.length}건 표시
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
