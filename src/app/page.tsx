import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  LockKeyhole,
  MessagesSquare,
  ShieldCheck,
  Ticket,
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

const capabilities = [
  {
    title: "역할 기반 접근 제어",
    description: "고객, 상담원, 관리자가 각자 필요한 문의 범위만 확인합니다.",
    icon: ShieldCheck,
  },
  {
    title: "운영형 문의 관리",
    description: "상태, 우선순위, 담당자, 활동 로그로 처리 흐름을 추적합니다.",
    icon: Ticket,
  },
  {
    title: "답변과 내부 메모",
    description: "고객 공개 답변과 지원팀 내부 메모를 분리해 관리합니다.",
    icon: MessagesSquare,
  },
  {
    title: "실시간 대시보드",
    description: "역할별 문의 통계와 상태, 카테고리 분포를 보여줍니다.",
    icon: BarChart3,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-zinc-950 text-white">
                <Activity className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">SupportFlow</p>
                <h1 className="text-2xl font-semibold text-zinc-950">
                  고객 지원 운영 대시보드
                </h1>
              </div>
            </div>
            <div className="grid gap-2 sm:flex">
              <Link
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full sm:w-auto",
                })}
                href="/login"
              >
                로그인
              </Link>
              <Link
                className={buttonVariants({ className: "w-full sm:w-auto" })}
                href="/dashboard"
              >
                대시보드 열기
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </header>

          <div className="max-w-3xl">
            <Badge variant="secondary">Portfolio SaaS Dashboard</Badge>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              SupportFlow는 B2B 고객 지원팀을 위한 역할 기반 고객 문의 관리
              SaaS입니다. 인증, 권한 분기, URL 기반 필터링, 서버 상태 관리,
              폼 검증, 로딩/에러/빈 상태까지 실제 운영 도구에 가까운 흐름을
              구현했습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          {capabilities.map((item) => (
            <Card key={item.title} className="rounded-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <item.icon className="size-5 text-zinc-600" aria-hidden="true" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-zinc-600">
                {item.description}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="size-5 text-emerald-600" aria-hidden="true" />
              구현된 핵심 흐름
            </CardTitle>
            <CardDescription>
              단순 CRUD가 아니라 지원 운영 업무 흐름을 기준으로 구성했습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-zinc-600">
            <p>고객: 문의 등록, 내 문의 조회, 공개 답변 확인</p>
            <p>상담원: 배정 문의 처리, 상태 변경, 답변, 내부 메모</p>
            <p>관리자: 전체 문의 조회, 담당자 배정, 우선순위 변경, 통계 확인</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
