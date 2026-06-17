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
import { cn } from "@/lib/utils";

const metrics = [
  { label: "열린 문의", value: "38", detail: "전일 대비 +6", icon: Inbox },
  { label: "진행 중", value: "14", detail: "상담원 처리 중", icon: Clock3 },
  { label: "해결됨", value: "126", detail: "이번 달 누적", icon: TicketCheck },
  { label: "긴급", value: "4", detail: "우선 확인 필요", icon: Activity },
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
    title: "결제 영수증 재발급 요청",
    owner: "Billing",
    status: "진행 중",
    priority: "높음",
    tone: "amber",
  },
  {
    title: "로그인 2단계 인증 오류",
    owner: "Technical",
    status: "열림",
    priority: "긴급",
    tone: "red",
  },
  {
    title: "워크스페이스 초대 권한 문의",
    owner: "Account",
    status: "해결됨",
    priority: "보통",
    tone: "emerald",
  },
] as const;

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "amber" | "red" | "emerald";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "red" && "border-red-200 bg-red-50 text-red-700",
        tone === "emerald" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {children}
    </span>
  );
}

function ProductPreview() {
  return (
    <Card className="overflow-hidden rounded-lg border-border shadow-sm">
      <CardHeader className="border-b bg-card pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardDescription>운영 현황</CardDescription>
            <CardTitle className="mt-1 text-xl">Support Queue</CardTitle>
          </div>
          <Badge variant="secondary" className="w-fit">
            Admin View
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border border-border bg-background p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <metric.icon
                  className="size-4 text-muted-foreground"
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

        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>문의</TableHead>
                <TableHead>팀</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>우선순위</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queueItems.map((item) => (
                <TableRow key={item.title}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.owner}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={item.tone}>{item.status}</StatusPill>
                  </TableCell>
                  <TableCell>{item.priority}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-muted/40">
      <section className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
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
          </div>
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
            <Link className={buttonVariants()} href="/dashboard">
              데모 열기
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="grid content-start gap-6">
          <div>
            <Badge variant="secondary">Portfolio SaaS Dashboard</Badge>
            <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              고객 문의를 접수부터 답변, 배정, 로그까지 관리하는 지원 운영 콘솔
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
              SupportFlow는 단순 게시판이 아니라 고객, 상담원, 관리자의 실제
              업무 흐름을 기준으로 만든 B2B 고객 지원 대시보드입니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <UsersRound className="size-5 text-sky-600" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-foreground">
                3개 역할
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Customer, Agent, Admin
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <LockKeyhole
                className="size-5 text-emerald-600"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-medium text-foreground">
                RLS 기반 권한
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supabase policy
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <CheckCircle2
                className="size-5 text-amber-600"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-medium text-foreground">
                운영 상태 처리
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Replies, notes, logs
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:flex">
            <Link className={buttonVariants()} href="/dashboard">
              운영 화면 보기
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              className={buttonVariants({
                variant: "outline",
                className: "w-full sm:w-auto",
              })}
              href="/login"
            >
              로그인 페이지
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
    </main>
  );
}
