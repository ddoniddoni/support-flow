import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Inbox,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  TicketCheck,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getDefaultAuthenticatedPath, getServerProfile } from "@/features/auth/api/server-auth";
import {
  Card,
  CardContent,
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
import { cn } from "@/lib/utils";

const metrics = [
  {
    label: "열린 문의",
    value: "38",
    detail: "전일 대비 +6",
    icon: Inbox,
    tone: "text-blue-600",
  },
  {
    label: "진행 중",
    value: "14",
    detail: "상담원 처리 중",
    icon: Clock3,
    tone: "text-amber-600",
  },
  {
    label: "SLA 임박",
    value: "7",
    detail: "2시간 내 응답 필요",
    icon: Activity,
    tone: "text-red-600",
  },
  {
    label: "해결률",
    value: "86%",
    detail: "최근 30일 기준",
    icon: TicketCheck,
    tone: "text-emerald-600",
  },
];

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

const queueItems = [
  {
    id: "SF-1042",
    title: "기업 플랜 결제 영수증 재발급 요청",
    customer: "Acme Korea",
    category: "Billing",
    assignee: "이지원",
    status: "진행 중",
    priority: "높음",
    updated: "12분 전",
    statusTone: "amber",
    priorityTone: "orange",
  },
  {
    id: "SF-1041",
    title: "SSO 로그인 후 워크스페이스가 보이지 않음",
    customer: "Northstar Labs",
    category: "Technical",
    assignee: "박민수",
    status: "열림",
    priority: "긴급",
    updated: "28분 전",
    statusTone: "blue",
    priorityTone: "red",
  },
  {
    id: "SF-1038",
    title: "새 상담원 초대 권한 요청",
    customer: "Bluefin",
    category: "Account",
    assignee: "최서연",
    status: "해결됨",
    priority: "보통",
    updated: "1시간 전",
    statusTone: "emerald",
    priorityTone: "sky",
  },
  {
    id: "SF-1037",
    title: "제품 사용량 리포트 다운로드 오류",
    customer: "Motion Grid",
    category: "Product",
    assignee: "미배정",
    status: "열림",
    priority: "높음",
    updated: "2시간 전",
    statusTone: "blue",
    priorityTone: "orange",
  },
] as const;

const activityItems = [
  {
    title: "박민수가 SF-1041 상태를 열림으로 변경",
    time: "28분 전",
  },
  {
    title: "이지원이 내부 메모를 추가",
    time: "41분 전",
  },
  {
    title: "관리자가 SF-1037 우선순위를 높음으로 변경",
    time: "2시간 전",
  },
];

const workloadItems = [
  { label: "이지원", value: "7건", width: "82%" },
  { label: "박민수", value: "5건", width: "62%" },
  { label: "최서연", value: "4건", width: "48%" },
];

function ToneBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "amber" | "blue" | "emerald" | "orange" | "red" | "sky";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md border px-2 text-xs font-medium",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "blue" && "border-blue-200 bg-blue-50 text-blue-700",
        tone === "emerald" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "orange" && "border-orange-200 bg-orange-50 text-orange-700",
        tone === "red" && "border-red-200 bg-red-50 text-red-700",
        tone === "sky" && "border-sky-200 bg-sky-50 text-sky-700",
      )}
    >
      {children}
    </span>
  );
}

function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="grid items-start gap-4 p-4 lg:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-4">
          <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="min-h-28 rounded-lg border border-border bg-background p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                  <metric.icon
                    className={cn("size-4", metric.tone)}
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="flex flex-col gap-2 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Support queue
                </p>
                <p className="text-xs text-muted-foreground">
                  우선순위와 SLA 기준으로 정렬된 운영 큐
                </p>
              </div>
            </div>
            <div className="grid gap-2 p-3 sm:hidden">
              {queueItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-border bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium leading-5 text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.id} · {item.category}
                      </p>
                    </div>
                    <ToneBadge tone={item.statusTone}>{item.status}</ToneBadge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <span className="truncate text-muted-foreground">
                      {item.customer}
                    </span>
                    <ToneBadge tone={item.priorityTone}>
                      {item.priority}
                    </ToneBadge>
                  </div>
                </div>
              ))}
            </div>
            <Table className="hidden sm:table">
              <TableHeader>
                <TableRow>
                  <TableHead>문의</TableHead>
                  <TableHead className="hidden sm:table-cell">고객사</TableHead>
                  <TableHead className="hidden md:table-cell">담당자</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    우선순위
                  </TableHead>
                  <TableHead className="hidden text-right lg:table-cell">
                    업데이트
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="min-w-52">
                        <p className="font-medium text-foreground">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.id} · {item.category}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {item.customer}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.assignee}
                    </TableCell>
                    <TableCell>
                      <ToneBadge tone={item.statusTone}>{item.status}</ToneBadge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <ToneBadge tone={item.priorityTone}>
                        {item.priority}
                      </ToneBadge>
                    </TableCell>
                    <TableCell className="hidden text-right text-muted-foreground lg:table-cell">
                      {item.updated}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  선택된 문의
                </p>
                <h2 className="mt-2 text-base font-semibold text-foreground">
                  SSO 로그인 후 워크스페이스가 보이지 않음
                </h2>
              </div>
              <ToneBadge tone="red">긴급</ToneBadge>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">상태</p>
                  <p className="mt-1 font-medium text-foreground">열림</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">담당자</p>
                  <p className="mt-1 font-medium text-foreground">박민수</p>
                </div>
              </div>
              <div className="rounded-md bg-muted p-3 text-xs leading-5 text-muted-foreground">
                고객은 SSO 인증 후 빈 워크스페이스 화면을 보고 있습니다. 최근
                조직 권한 변경 로그 확인이 필요합니다.
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm font-semibold text-foreground">상담원 현황</p>
            <div className="mt-4 grid gap-3">
              {workloadItems.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      {item.label}
                    </span>
                    <span className="text-muted-foreground">{item.value}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: item.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm font-semibold text-foreground">활동 로그</p>
            <div className="mt-4 grid gap-3">
              {activityItems.map((item) => (
                <div key={item.title} className="border-l-2 border-border pl-3">
                  <p className="text-xs font-medium leading-5 text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default async function Home() {
  const profile = await getServerProfile();
  const workspaceHref = profile
    ? getDefaultAuthenticatedPath(profile.role)
    : "/dashboard";

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
            <Badge variant="secondary">Portfolio SaaS Dashboard</Badge>
            <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              고객 문의를 접수부터 배정, 답변, 내부 로그까지 운영하는 지원
              콘솔
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              SupportFlow는 역할별 권한, URL 기반 필터링, 서버 상태 관리,
              답변/내부 메모를 갖춘 B2B 고객 지원 대시보드입니다.
            </p>
          </div>
          <div className="grid gap-2 sm:flex">
            <Link className={buttonVariants()} href={workspaceHref}>
              {profile ? "내 작업공간 보기" : "운영 화면 보기"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <ProductPreview />
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

      <section className="mx-auto grid max-w-7xl gap-3 px-5 pb-10 sm:px-6 sm:grid-cols-3 lg:px-8">
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
