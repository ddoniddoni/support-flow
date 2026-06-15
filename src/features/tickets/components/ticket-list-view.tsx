"use client";

import { AlertCircle, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { EmptyState, EmptyStateAction } from "@/components/common/empty-state";
import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
import { ticketPriorities, ticketStatuses } from "@/types/domain";

import type { TicketListFilters } from "../api/tickets-api";
import { useTickets } from "../hooks/use-tickets";
import { ticketCategories } from "../schemas/ticket-schema";
import type { TicketSortOption } from "../types";
import { TicketListTable } from "./ticket-list-table";
import { TicketTableSkeleton } from "./ticket-table-skeleton";

type TicketListViewProps = {
  profile: Pick<Tables<"profiles">, "id" | "role">;
  createdTicketId?: string;
};

const statusLabels = {
  all: "전체 상태",
  open: "열림",
  in_progress: "진행 중",
  resolved: "해결됨",
  closed: "종료",
} as const;

const priorityLabels = {
  all: "전체 우선순위",
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
} as const;

const categoryLabels = {
  all: "전체 카테고리",
  account: "계정",
  billing: "결제",
  technical: "기술 지원",
  product: "제품 문의",
  other: "기타",
} as const;

const sortLabels: Record<TicketSortOption, string> = {
  created_desc: "최신순",
  created_asc: "오래된순",
  updated_desc: "최근 수정순",
  title_asc: "제목순",
};

const sortOptions: TicketSortOption[] = [
  "created_desc",
  "created_asc",
  "updated_desc",
  "title_asc",
];

function getIntParam(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

function getRoleDescription(role: Tables<"profiles">["role"]) {
  if (role === "customer") {
    return "내가 등록한 문의를 확인하고 지원팀 답변과 상태를 추적합니다.";
  }

  if (role === "agent") {
    return "나에게 배정된 티켓을 확인하고 처리 흐름을 관리합니다.";
  }

  return "전체 고객 문의를 검색하고 운영 상태를 확인합니다.";
}

export function TicketListView({
  profile,
  createdTicketId,
}: TicketListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  const filters = useMemo<TicketListFilters>(() => {
    const sort = searchParams.get("sort") as TicketSortOption | null;

    return {
      search: searchParams.get("q")?.trim() || undefined,
      status: searchParams.get("status") as TicketListFilters["status"],
      priority: searchParams.get("priority") as TicketListFilters["priority"],
      category: searchParams.get("category") ?? "all",
      sort: sortOptions.includes(sort ?? "created_desc")
        ? sort ?? "created_desc"
        : "created_desc",
      page: getIntParam(searchParams.get("page"), 1),
      pageSize: 10,
    };
  }, [searchParams]);

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

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">티켓</h1>
          <p className="mt-2 text-sm text-zinc-600">
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
          티켓이 등록되었습니다. 접수 번호: {createdTicketId}
        </div>
      ) : null}

      <div className="grid gap-3 rounded-lg border bg-white p-4">
        <form className="grid gap-2 sm:flex" onSubmit={handleSearchSubmit}>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-2 left-2.5 size-4 text-zinc-400"
              aria-hidden="true"
            />
            <Input
              className="pl-8"
              value={searchInput}
              placeholder="제목으로 검색"
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <Button className="w-full sm:w-auto" type="submit">
            검색
          </Button>
        </form>

        <div className="grid gap-2 md:grid-cols-4">
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={filters.status ?? "all"}
            onChange={(event) =>
              updateParams({ status: event.target.value, page: "1" })
            }
          >
            <option value="all">{statusLabels.all}</option>
            {ticketStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>

          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
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

          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
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
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
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
      </div>

      {ticketsQuery.isLoading ? <TicketTableSkeleton /> : null}

      {ticketsQuery.isError ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
          <div>
            <p className="font-medium">티켓 목록을 불러오지 못했습니다.</p>
            <p className="mt-1 text-red-600">
              Supabase 권한 정책과 네트워크 상태를 확인한 뒤 다시 시도해
              주세요.
            </p>
          </div>
        </div>
      ) : null}

      {!ticketsQuery.isLoading && !ticketsQuery.isError && !hasTickets ? (
        <EmptyState
          title="조건에 맞는 티켓이 없습니다"
          description="검색어나 필터를 조정하면 다른 티켓을 확인할 수 있습니다."
          action={
            profile.role === "customer" ? (
              <EmptyStateAction href="/tickets/new">문의 등록</EmptyStateAction>
            ) : null
          }
        />
      ) : null}

      {!ticketsQuery.isLoading && !ticketsQuery.isError && data ? (
        <div className={cn(!hasTickets && "hidden")}>
          <TicketListTable tickets={data.tickets} />
          <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
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
