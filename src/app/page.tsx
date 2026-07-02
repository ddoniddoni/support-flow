import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  TicketCheck,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  getDefaultAuthenticatedPath,
  getServerProfile,
} from "@/features/auth/api/server-auth";
import { demoDashboardStats } from "@/features/dashboard/api/demo-dashboard-stats";
import { getDashboardStats } from "@/features/dashboard/api/dashboard-api";
import { OperationsPreview } from "@/features/dashboard/components/operations-preview";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const profile = await getServerProfile();
  const workspaceHref = profile
    ? getDefaultAuthenticatedPath(profile.role)
    : "/dashboard";
  const previewStats = profile
    ? await getDashboardStats(profile, await createSupabaseServerClient())
    : demoDashboardStats;

  return (
    <main className="min-h-screen bg-background">
      <section className="sf-starfield text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex size-9 items-center justify-center rounded-md bg-white text-[var(--sf-ink)]">
              <Activity className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                SupportFlow
              </p>
              <p className="text-xs text-white/70">
                Customer support operations
              </p>
            </div>
          </Link>
          {profile ? null : (
            <div className="flex items-center gap-2">
              <Link
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "hidden border-white/20 bg-white/10 !text-white hover:bg-white hover:!text-[var(--sf-ink)] sm:inline-flex",
                })}
                href="/login"
              >
                로그인
              </Link>
            </div>
          )}
        </div>

        <div className="mx-auto grid max-w-7xl gap-6 px-5 pt-7 pb-8 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <Badge className="border-white/20 bg-[var(--sf-night)] text-white">
                {profile ? "Live operations" : "Public console preview"}
              </Badge>
              <h1 className="mt-4 max-w-4xl font-heading text-3xl leading-tight font-semibold text-white sm:text-4xl lg:text-5xl">
                SupportFlow 운영 콘솔
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70 sm:text-base sm:leading-8">
                {profile
                  ? "현재 계정의 권한 범위에서 문의 상태, 배정, 우선순위, 최근 업데이트를 바로 확인합니다."
                  : "로그인 전에도 실제 지원팀이 보는 운영 흐름을 먼저 확인할 수 있도록 공개 프리뷰를 제공합니다."}
              </p>
            </div>
            <div className="grid gap-2 sm:flex">
              <Link
                className={buttonVariants({
                  className:
                    "bg-white !text-[var(--sf-ink)] shadow-[rgb(21_15_35)_0_0_8px_6px] hover:bg-[#f0f0f0] hover:!text-[var(--sf-ink)]",
                })}
                href={workspaceHref}
              >
                {profile ? "내 작업공간 보기" : "운영 화면 보기"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <UsersRound
                className="size-5 text-[var(--sf-lime)]"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold">Role scoped</p>
              <p className="mt-1 text-xs leading-5 text-white/70">
                Customer, Agent, Admin 권한별로 다른 문의 범위를 보여줍니다.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <TicketCheck
                className="size-5 text-[var(--sf-pink)]"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold">Ticket workflow</p>
              <p className="mt-1 text-xs leading-5 text-white/70">
                상태, 우선순위, 담당자, 활동 로그가 한 흐름으로 이어집니다.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <LockKeyhole className="size-5 text-white" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">Supabase RLS</p>
              <p className="mt-1 text-xs leading-5 text-white/70">
                프론트 라우팅과 데이터 정책을 함께 고려한 구조입니다.
              </p>
            </div>
          </div>

          <div className="rounded-[18px] border border-white/15 bg-white p-2 shadow-[0_1.5rem_4rem_rgb(0_0_0_/_24%)]">
            <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
              <span className="size-2.5 rounded-full bg-[var(--sf-pink)]" />
              <span className="size-2.5 rounded-full bg-[var(--sf-lime)]" />
              <span className="size-2.5 rounded-full bg-[var(--sf-violet)]" />
              <span className="ml-2 text-[0.625rem] font-semibold tracking-[0.015625rem] text-muted-foreground uppercase">
                Operations console
              </span>
            </div>
            <OperationsPreview
              ctaHref={profile ? workspaceHref : undefined}
              ctaLabel="작업공간 열기"
              emptyHref={
                profile?.role === "customer" ? "/tickets/new" : "/tickets"
              }
              emptyLabel={
                profile?.role === "customer" ? "문의 등록" : "문의 목록"
              }
              stats={previewStats}
              ticketHrefMode={profile ? "detail" : "tickets"}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <CheckCircle2
          className="size-4 text-[var(--sf-violet-deep)]"
          aria-hidden="true"
        />
        <span>
          `/`는 랜딩 전용 페이지가 아니라, 로그인 전후 모두 접근 가능한 운영
          콘솔 프리뷰입니다.
        </span>
      </section>
    </main>
  );
}
