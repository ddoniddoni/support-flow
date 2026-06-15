"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Flame,
  Inbox,
  type LucideIcon,
  Ticket,
} from "lucide-react";
import Link from "next/link";

import { EmptyState, EmptyStateAction } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
import type { TicketPriority, TicketStatus } from "@/types/domain";

import type { DashboardStats, DistributionItem } from "../api/dashboard-api";
import { useDashboardStats } from "../hooks/use-dashboard-stats";
import { DashboardSkeleton } from "./dashboard-skeleton";

type DashboardViewProps = {
  profile: Pick<Tables<"profiles">, "id" | "email" | "name" | "role">;
};

const statusLabels: Record<TicketStatus, string> = {
  open: "열림",
  in_progress: "진행 중",
  resolved: "해결됨",
  closed: "종료",
};

const priorityLabels: Record<TicketPriority, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
};

function getRoleLabel(role: Tables<"profiles">["role"]) {
  return role === "agent" ? "Agent" : "Admin";
}

function getRoleDescription(role: Tables<"profiles">["role"]) {
  if (role === "agent") {
    return "나에게 배정된 티켓의 처리 상태와 우선순위를 추적합니다.";
  }

  return "전체 지원 운영 현황과 병목 구간을 한눈에 확인합니다.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "open" && "border-blue-200 bg-blue-50 text-blue-700",
        status === "in_progress" &&
          "border-amber-200 bg-amber-50 text-amber-700",
        status === "resolved" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "closed" && "border-zinc-200 bg-zinc-100 text-zinc-600",
      )}
    >
      {statusLabels[status]}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        priority === "urgent" && "border-red-200 bg-red-50 text-red-700",
        priority === "high" && "border-orange-200 bg-orange-50 text-orange-700",
        priority === "medium" && "border-sky-200 bg-sky-50 text-sky-700",
        priority === "low" && "border-zinc-200 bg-zinc-50 text-zinc-600",
      )}
    >
      {priorityLabels[priority]}
    </Badge>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
        </div>
        <Icon className="size-5 text-zinc-500" aria-hidden="true" />
      </CardHeader>
      <CardContent className="text-sm leading-6 text-zinc-500">
        {detail}
      </CardContent>
    </Card>
  );
}

function DistributionList({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: DistributionItem[];
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {items.map((item) => (
          <div key={item.key} className="grid gap-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-zinc-800">{item.label}</span>
              <span className="text-zinc-500">
                {item.count}건 · {item.percentage}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-900"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecentTicketsTable({ stats }: { stats: DashboardStats }) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>최근 업데이트 티켓</CardTitle>
          <CardDescription>
            권한 범위 안에서 최근 수정된 티켓을 보여줍니다.
          </CardDescription>
        </div>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/tickets"
        >
          전체 보기
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-64">티켓</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>우선순위</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>수정일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="font-medium text-zinc-950 hover:underline"
                    >
                      {ticket.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={ticket.priority} />
                  </TableCell>
                  <TableCell>{ticket.category}</TableCell>
                  <TableCell>{formatDate(ticket.updated_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardContent({ stats }: { stats: DashboardStats }) {
  if (!stats.totalTickets) {
    return (
      <EmptyState
        title="아직 집계할 티켓이 없습니다"
        description="배정되거나 생성된 티켓이 생기면 이곳에서 상태, 우선순위, 카테고리 분포를 확인할 수 있습니다."
        action={<EmptyStateAction href="/tickets">티켓 목록 보기</EmptyStateAction>}
      />
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="전체 티켓"
          value={stats.totalTickets}
          detail={`오늘 새로 접수된 티켓 ${stats.createdToday}건`}
          icon={Ticket}
        />
        <MetricCard
          label="열린 티켓"
          value={stats.openTickets}
          detail="아직 처리가 시작되지 않은 요청입니다."
          icon={Inbox}
        />
        <MetricCard
          label="진행 중"
          value={stats.inProgressTickets}
          detail="상담원이 현재 처리 중인 티켓입니다."
          icon={Clock3}
        />
        <MetricCard
          label="긴급 티켓"
          value={stats.urgentTickets}
          detail={`해결 완료 티켓 ${stats.resolvedTickets}건`}
          icon={Flame}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <RecentTicketsTable stats={stats} />
        <div className="grid content-start gap-5">
          <DistributionList
            title="상태 분포"
            description="현재 티켓의 처리 단계별 비율입니다."
            items={stats.statusDistribution}
          />
          <DistributionList
            title="카테고리 분포"
            description="문의 유형별 접수 비중입니다."
            items={stats.categoryDistribution}
          />
        </div>
      </div>
    </div>
  );
}

export function DashboardView({ profile }: DashboardViewProps) {
  const statsQuery = useDashboardStats({ profile });

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{getRoleLabel(profile.role)}</Badge>
            <span className="text-sm text-zinc-500">{profile.email}</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-zinc-950">
            {profile.name}님의 운영 대시보드
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {getRoleDescription(profile.role)}
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:items-center">
          <Link
            className={buttonVariants({
              variant: "outline",
              className: "w-full sm:w-auto",
            })}
            href="/tickets"
          >
            티켓
          </Link>
          <LogoutButton />
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
        <DashboardContent stats={statsQuery.data} />
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
        <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
        <span>통계는 현재 계정의 역할 기반 접근 범위로 집계됩니다.</span>
      </div>
    </div>
  );
}
