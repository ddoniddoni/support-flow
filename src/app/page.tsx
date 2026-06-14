import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  ShieldCheck,
  Ticket,
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

const metrics = [
  {
    label: "접수된 티켓",
    value: "42",
    detail: "긴급 또는 높은 우선순위 12건",
    icon: Ticket,
  },
  {
    label: "처리 중",
    value: "18",
    detail: "상담원 6명이 담당 중",
    icon: Clock3,
  },
  {
    label: "오늘 해결",
    value: "27",
    detail: "평균 첫 응답 22분",
    icon: CheckCircle2,
  },
  {
    label: "내부 메모",
    value: "84",
    detail: "운영 맥락을 남긴 기록",
    icon: MessageSquareText,
  },
];

const tickets = [
  {
    id: "SUP-1048",
    title: "2분기 청구서 다운로드가 실패합니다",
    customer: "Northstar Labs",
    status: "진행 중",
    priority: "긴급",
    assignee: "박민수",
  },
  {
    id: "SUP-1047",
    title: "SSO 사용자가 간헐적으로 로그인 화면으로 돌아갑니다",
    customer: "Apex Cloud",
    status: "열림",
    priority: "높음",
    assignee: "미배정",
  },
  {
    id: "SUP-1046",
    title: "워크스페이스 권한 변경 이력이 필요합니다",
    customer: "BrightOps",
    status: "해결됨",
    priority: "보통",
    assignee: "김하늘",
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
            <Badge variant="secondary">Phase 7 완료</Badge>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              인증, 역할 기반 접근, 티켓 생성, 역할별 목록, 상세 화면까지
              연결된 B2B 고객지원 SaaS 포트폴리오입니다. 고객은 문의를
              등록하고, 관리자와 상담원은 운영 흐름을 관리합니다.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.label} className="rounded-lg">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardDescription>{metric.label}</CardDescription>
                    <CardTitle className="mt-2 text-3xl">
                      {metric.value}
                    </CardTitle>
                  </div>
                  <metric.icon className="size-5 text-zinc-500" aria-hidden="true" />
                </CardHeader>
                <CardContent className="text-sm leading-6 text-zinc-500">
                  {metric.detail}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[1fr_360px] sm:px-6 lg:px-8">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>우선 처리 티켓</CardTitle>
            <CardDescription>
              담당자, 상태, 우선순위를 한 화면에서 빠르게 확인하는 운영용
              테이블입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>티켓</TableHead>
                  <TableHead>고객</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>우선순위</TableHead>
                  <TableHead>담당자</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="font-medium text-zinc-950">
                        {ticket.id}
                      </div>
                      <div className="text-sm text-zinc-500">{ticket.title}</div>
                    </TableCell>
                    <TableCell>{ticket.customer}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          ticket.priority === "긴급"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-sky-200 bg-sky-50 text-sky-700"
                        }
                        variant="outline"
                      >
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.assignee}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck
                  className="size-5 text-emerald-600"
                  aria-hidden="true"
                />
                역할별 권한
              </CardTitle>
              <CardDescription>
                고객, 상담원, 관리자의 접근 범위를 분리해 실제 운영 흐름을
                보여줍니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span>Customer</span>
                <Badge variant="secondary">내 문의</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Agent</span>
                <Badge variant="secondary">배정 티켓</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Admin</span>
                <Badge variant="secondary">전체 운영</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersRound className="size-5 text-zinc-600" aria-hidden="true" />
                현재 구현 상태
              </CardTitle>
              <CardDescription>
                다음 단계에서는 상태 변경, 담당자 배정, 우선순위 변경 액션을
                연결합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-zinc-600">
              <p>완료: 인증, 권한 분기, 티켓 생성, 목록, 상세</p>
              <p>다음: 티켓 액션과 활동 로그 자동 기록</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
