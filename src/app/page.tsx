import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  TicketCheck,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getDefaultAuthenticatedPath,
  getServerProfile,
} from "@/features/auth/api/server-auth";
import { demoDashboardStats } from "@/features/dashboard/api/demo-dashboard-stats";
import { getDashboardStats } from "@/features/dashboard/api/dashboard-api";
import { OperationsPreview } from "@/features/dashboard/components/operations-preview";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const capabilities = [
  {
    title: "역할 기반 접근 제어",
    description: "고객, 상담원, 관리자가 각자 필요한 문의 범위만 확인합니다.",
    icon: ShieldCheck,
  },
  {
    title: "운영형 문의 관리",
    description: "상태, 우선순위, 담당자, 활동 로그로 처리 흐름을 추적합니다.",
    icon: TicketCheck,
  },
  {
    title: "답변과 내부 메모",
    description: "고객 공개 답변과 지원팀 내부 메모를 분리해 관리합니다.",
    icon: MessageSquareText,
  },
  {
    title: "실시간 대시보드",
    description: "역할별 문의 통계와 상태, 카테고리 분포를 보여줍니다.",
    icon: BarChart3,
  },
];

export default async function Home() {
  const profile = await getServerProfile();
  const workspaceHref = profile
    ? getDefaultAuthenticatedPath(profile.role)
    : "/dashboard";
  const previewStats = profile
    ? await getDashboardStats(profile, await createSupabaseServerClient())
    : demoDashboardStats;

  return (
    <main className="min-h-screen bg-muted/40">
      <section className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Activity className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                SupportFlow
              </p>
              <p className="text-xs text-muted-foreground">
                Customer support operations
              </p>
            </div>
          </Link>
          {profile ? null : (
            <div className="flex items-center gap-2">
              <Link
                className={buttonVariants({
                  variant: "outline",
                  className: "hidden sm:inline-flex",
                })}
                href="/login"
              >
                로그인
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8">
        <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badge variant="secondary">
              {profile ? "Live Workspace Preview" : "Portfolio SaaS Dashboard"}
            </Badge>
            <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              고객 문의를 접수부터 배정, 답변, 내부 로그까지 운영하는 지원
              콘솔
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {profile
                ? "현재 계정의 권한 범위 안에서 실제 문의 운영 현황을 미리 보여줍니다."
                : "SupportFlow는 역할별 권한, URL 기반 필터링, 서버 상태 관리, 답변/내부 메모를 갖춘 B2B 고객 지원 대시보드입니다."}
            </p>
          </div>
          <div className="grid gap-2 sm:flex">
            <Link className={buttonVariants()} href={workspaceHref}>
              {profile ? "내 작업공간 보기" : "운영 화면 보기"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <OperationsPreview
          ctaHref={profile ? workspaceHref : undefined}
          ctaLabel="작업공간 열기"
          emptyHref={profile?.role === "customer" ? "/tickets/new" : "/tickets"}
          emptyLabel={profile?.role === "customer" ? "문의 등록" : "문의 목록"}
          stats={previewStats}
          ticketHrefMode={profile ? "detail" : "tickets"}
        />
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-8 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {capabilities.map((item) => (
          <Card key={item.title} className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <item.icon
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {item.description}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-3 px-5 pb-10 sm:grid-cols-3 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card p-4">
          <UsersRound className="size-5 text-sky-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-foreground">3개 역할</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Customer, Agent, Admin
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <LockKeyhole className="size-5 text-emerald-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-foreground">
            RLS 기반 권한
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Supabase policy</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <CheckCircle2 className="size-5 text-amber-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-foreground">
            운영 상태 처리
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Replies, notes, logs
          </p>
        </div>
      </section>
    </main>
  );
}
