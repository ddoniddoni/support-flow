import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  ShieldCheck,
  Ticket,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
    label: "접수된 문의",
    value: "42",
    detail: "긴급 또는 높음 우선순위 12건",
    icon: Ticket,
  },
  {
    label: "처리 중",
    value: "18",
    detail: "상담원 6명이 대응 중",
    icon: Clock3,
  },
  {
    label: "오늘 해결",
    value: "27",
    detail: "첫 응답 중앙값 22분",
    icon: CheckCircle2,
  },
  {
    label: "내부 메모",
    value: "84",
    detail: "운영 맥락을 팀 내부에 기록",
    icon: MessageSquareText,
  },
];

const tickets = [
  {
    id: "SUP-1048",
    title: "2분기 청구서 내보내기가 실패합니다",
    customer: "노스스타랩스",
    status: "in_progress",
    priority: "urgent",
    assignee: "박미나",
  },
  {
    id: "SUP-1047",
    title: "SSO 사용자가 간헐적으로 로그인 화면으로 돌아갑니다",
    customer: "아틀라스클라우드",
    status: "open",
    priority: "high",
    assignee: "미배정",
  },
  {
    id: "SUP-1046",
    title: "워크스페이스 권한 변경 이력이 필요합니다",
    customer: "브라이트옵스",
    status: "resolved",
    priority: "medium",
    assignee: "김다니엘",
  },
];

const statusLabels: Record<string, string> = {
  open: "접수",
  in_progress: "처리 중",
  resolved: "해결",
  closed: "종료",
};

const priorityLabels: Record<string, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
};

function priorityTone(priority: string) {
  if (priority === "urgent") return "border-red-200 bg-red-50 text-red-700";
  if (priority === "high") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-sky-200 bg-sky-50 text-sky-800";
}

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-6 lg:px-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-zinc-950 text-white">
                <Activity className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">SupportFlow</p>
                <h1 className="text-2xl font-semibold tracking-normal text-zinc-950">
                  고객지원 운영 대시보드
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className={buttonVariants({ variant: "outline" })} href="/login">
                로그인
              </Link>
              <Link className={buttonVariants()} href="/dashboard">
                대시보드 열기
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </header>

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
                <CardContent className="text-sm text-zinc-500">
                  {metric.detail}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>우선 처리 문의</CardTitle>
            <CardDescription>
              문의 목록을 중심으로 담당자, 상태, 우선순위를 빠르게 확인하는 운영 화면입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>문의</TableHead>
                  <TableHead>고객사</TableHead>
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
                      <div className="text-sm text-zinc-500">
                        {ticket.title}
                      </div>
                    </TableCell>
                    <TableCell>{ticket.customer}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{statusLabels[ticket.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={priorityTone(ticket.priority)}
                        variant="outline"
                      >
                        {priorityLabels[ticket.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.assignee}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6">
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
                고객, 상담원, 관리자의 접근 범위가 분리된 운영 구조를 준비합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span>고객</span>
                <Badge variant="secondary">내 문의</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>상담원</span>
                <Badge variant="secondary">배정 문의</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>관리자</span>
                <Badge variant="secondary">전체 운영</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle
                  className="size-5 text-amber-600"
                  aria-hidden="true"
                />
                다음 구현 단계
              </CardTitle>
              <CardAction>
                <Badge variant="outline">Phase 2</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600">
              Supabase 인증과 실제 문의 데이터를 연결하고 TanStack Query 기반 화면으로 확장합니다.
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
