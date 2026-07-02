import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileSearch,
  LockKeyhole,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
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
import { OperationsPreview } from "@/features/dashboard/components/operations-preview";
import { hasSupabaseEnv } from "@/lib/env";

const outcomes = [
  {
    icon: TicketCheck,
    title: "문의 접수부터 해결까지 한 화면",
    description:
      "상태, 우선순위, 담당자, 고객 답변, 내부 노트를 한 워크플로우에서 관리합니다.",
  },
  {
    icon: UsersRound,
    title: "고객, 상담원, 관리자 권한 분리",
    description:
      "역할별로 필요한 티켓만 보여주고 운영 권한을 분리해 실제 팀 운영에 맞춥니다.",
  },
  {
    icon: Bot,
    title: "AI 지원 운영 확장 준비",
    description:
      "티켓 요약, 긴급도 감지, 답변 초안, 검토 큐로 상담원의 판단을 보조합니다.",
  },
];

const proofPoints = [
  "URL 기반 검색, 필터, 정렬, 페이지네이션",
  "Supabase Auth와 RLS를 고려한 권한 설계",
  "TanStack Query 기반 서버 상태 관리",
  "로딩, 오류, 빈 상태까지 포함한 운영 UX",
];

const workflowSteps = [
  {
    label: "01",
    title: "고객 문의 접수",
    description: "고객이 제품, 결제, 계정, 기술 지원 문의를 생성합니다.",
  },
  {
    label: "02",
    title: "운영팀 분류 및 배정",
    description: "관리자가 우선순위와 담당자를 정하고 상담원이 처리합니다.",
  },
  {
    label: "03",
    title: "답변, 내부 노트, 활동 로그",
    description: "고객 답변과 내부 기록을 분리하고 변경 이력을 남깁니다.",
  },
  {
    label: "04",
    title: "AI 보조 검토",
    description: "AI 제안은 사람이 확인한 뒤 운영 흐름에 반영합니다.",
  },
];

async function getLandingProfile() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    return await getServerProfile();
  } catch {
    return null;
  }
}

export default async function Home() {
  const profile = await getLandingProfile();
  const workspaceHref = profile
    ? getDefaultAuthenticatedPath(profile.role)
    : "/login";
  const workspaceLabel = profile ? "작업공간 열기" : "Demo 체험";

  return (
    <main className="min-h-screen bg-background">
      <section className="sf-starfield relative overflow-hidden text-white">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-white"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex size-9 items-center justify-center rounded-md bg-white text-[var(--sf-ink)]">
              <Activity className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">SupportFlow</p>
              <p className="text-xs text-white/70">
                AI-assisted support operations
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {profile ? null : (
              <Link
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className:
                    "hidden bg-white/10 !text-white hover:bg-white/15 hover:!text-white sm:inline-flex",
                })}
                href="/login"
              >
                로그인
              </Link>
            )}
            <Link
              className={buttonVariants({
                size: "sm",
                className:
                  "bg-[var(--sf-lime)] !text-[var(--sf-ink)] hover:bg-[#d7ff68] hover:!text-[var(--sf-ink)]",
              })}
              href={workspaceHref}
            >
              {workspaceLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 pt-10 pb-12 sm:px-6 sm:pt-14 lg:px-8">
          <div className="max-w-4xl">
            <Badge className="border-white/20 bg-white/10 text-white">
              B2B Customer Support SaaS
            </Badge>
            <h1 className="mt-5 max-w-4xl font-heading text-4xl leading-tight font-semibold text-white sm:text-5xl lg:text-6xl">
              고객 문의 운영을 팀 단위로 정리하는 SupportFlow
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              SupportFlow는 고객, 상담원, 관리자의 역할을 나누고 티켓 처리,
              담당자 배정, 내부 노트, 활동 로그를 하나의 운영 흐름으로 연결하는
              B2B 지원 관리 솔루션입니다.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                className={buttonVariants({
                  size: "lg",
                  className:
                    "bg-white !text-[var(--sf-ink)] hover:bg-[#f0f0f0] hover:!text-[var(--sf-ink)]",
                })}
                href={workspaceHref}
              >
                {workspaceLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className:
                    "border-white/20 bg-white/10 !text-white hover:bg-white hover:!text-[var(--sf-ink)]",
                })}
                href="#product-preview"
              >
                제품 화면 보기
              </Link>
            </div>
          </div>

          <div
            className="grid gap-3 rounded-lg border border-white/15 bg-white/10 p-3 text-sm backdrop-blur sm:grid-cols-3"
            aria-label="SupportFlow operational highlights"
          >
            <div className="flex items-center gap-3 rounded-md bg-white/10 p-3">
              <MessagesSquare
                className="size-5 text-[var(--sf-lime)]"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold text-white">38 active tickets</p>
                <p className="text-xs text-white/70">운영 큐 실시간 파악</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-white/10 p-3">
              <FileSearch
                className="size-5 text-[var(--sf-pink)]"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold text-white">Role-based views</p>
                <p className="text-xs text-white/70">권한별 데이터 접근</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-white/10 p-3">
              <Sparkles className="size-5 text-white" aria-hidden="true" />
              <div>
                <p className="font-semibold text-white">AI-ready workflow</p>
                <p className="text-xs text-white/70">검토 기반 AI 보조</p>
              </div>
            </div>
          </div>

          <div
            id="product-preview"
            className="rounded-lg border border-white/15 bg-white p-2 shadow-[0_1.5rem_4rem_rgb(0_0_0_/_24%)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[var(--sf-pink)]" />
                <span className="size-2.5 rounded-full bg-[var(--sf-lime)]" />
                <span className="size-2.5 rounded-full bg-[var(--sf-violet)]" />
              </div>
              <span className="text-[0.625rem] font-semibold text-muted-foreground uppercase">
                Live product demo
              </span>
            </div>
            <OperationsPreview
              ctaHref={profile ? workspaceHref : "/login"}
              ctaLabel={workspaceLabel}
              emptyHref="/tickets"
              emptyLabel="문의 목록"
              stats={demoDashboardStats}
              ticketHrefMode={profile ? "detail" : "tickets"}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        {outcomes.map((item) => (
          <div key={item.title} className="rounded-lg border bg-card p-5">
            <item.icon
              className="size-5 text-[var(--sf-violet-deep)]"
              aria-hidden="true"
            />
            <h2 className="mt-4 text-base font-semibold text-foreground">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </section>

      <section className="border-y bg-muted/60">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <Badge variant="outline">Operational workflow</Badge>
            <h2 className="mt-4 max-w-xl font-heading text-3xl font-semibold text-foreground">
              단순 문의 게시판이 아니라 실제 지원팀의 운영 흐름입니다.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              SupportFlow는 티켓을 만드는 화면에서 끝나지 않고, 배정,
              우선순위, 고객 답변, 내부 기록, 관리자 통계까지 이어지는 지원
              운영 사이클을 제공합니다.
            </p>
          </div>

          <div className="grid gap-3">
            {workflowSteps.map((step) => (
              <div
                className="grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-[3rem_1fr]"
                key={step.label}
              >
                <div className="flex size-10 items-center justify-center rounded-md bg-[var(--sf-ink)] text-sm font-semibold text-white">
                  {step.label}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <div>
          <Badge variant="outline">Built for credible demos</Badge>
          <h2 className="mt-4 font-heading text-3xl font-semibold text-foreground">
            채용 담당자가 제품처럼 볼 수 있는 포트폴리오 SaaS
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            공개 페이지는 솔루션 가치를 보여주고, Demo 체험은 실제 역할 기반
            운영 화면으로 이어집니다. 화면만 그럴듯한 목업이 아니라 인증,
            권한, 서버 상태, 폼 검증, 운영 상태를 함께 다룹니다.
          </p>
        </div>

        <div className="grid gap-3">
          {proofPoints.map((point) => (
            <div
              className="flex items-start gap-3 rounded-lg border bg-card p-4"
              key={point}
            >
              <CheckCircle2
                className="mt-0.5 size-5 text-[var(--sf-violet-deep)]"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-foreground">{point}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--sf-ink)] text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheck
                className="size-5 text-[var(--sf-lime)]"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-white">
                실제 운영 SaaS처럼 확인해보세요.
              </p>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
              Demo 계정으로 고객, 상담원, 관리자 시나리오를 전환하며 티켓
              흐름과 권한 차이를 직접 볼 수 있습니다.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className={buttonVariants({
                className:
                  "bg-[var(--sf-lime)] !text-[var(--sf-ink)] hover:bg-[#d7ff68] hover:!text-[var(--sf-ink)]",
              })}
              href={workspaceHref}
            >
              {workspaceLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              className={buttonVariants({
                variant: "outline",
                className:
                  "border-white/20 bg-white/10 !text-white hover:bg-white hover:!text-[var(--sf-ink)]",
              })}
              href="/signup"
            >
              계정 만들기
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <LockKeyhole className="size-4" aria-hidden="true" />
          <span>Role-based customer support operations</span>
        </div>
        <div className="flex items-center gap-3">
          <Link className="hover:text-foreground" href="/login">
            로그인
          </Link>
          <Link className="hover:text-foreground" href="/dashboard">
            Dashboard
          </Link>
          <Link className="hover:text-foreground" href="/tickets">
            Tickets
          </Link>
        </div>
      </footer>
    </main>
  );
}
