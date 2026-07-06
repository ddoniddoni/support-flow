"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Inbox,
  Plug,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  UsersRound,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

type OperationProfile = Pick<Tables<"profiles">, "email" | "name" | "role">;

type Tone =
  | "amber"
  | "blue"
  | "emerald"
  | "muted"
  | "orange"
  | "red"
  | "slate";

type MockTicket = {
  id: string;
  title: string;
  customer: string;
  assignee: string;
  priority: "긴급" | "높음" | "보통" | "낮음";
  sla: string;
  status: string;
  tags: string[];
  sentiment: "부정" | "중립" | "긍정";
};

const operationTagLabels: Record<string, string> = {
  account: "계정",
  api: "API",
  billing: "결제",
  invoice: "인보이스",
  negative: "부정 감정",
  payment: "결제",
  product: "제품",
  sso: "SSO",
  team: "팀 관리",
  technical: "기술 지원",
};

const flowColumns = [
  {
    key: "new",
    title: "신규 접수",
    description: "AI가 분류 중",
  },
  {
    key: "triage",
    title: "분류 완료",
    description: "담당자 지정 필요",
  },
  {
    key: "assigned",
    title: "담당자 배정",
    description: "답변 작성 중",
  },
  {
    key: "waiting",
    title: "고객 확인",
    description: "고객 응답 대기",
  },
  {
    key: "resolved",
    title: "답변 완료",
    description: "종료 전 확인",
  },
] as const;

const boardTickets: Record<(typeof flowColumns)[number]["key"], MockTicket[]> =
  {
    new: [
      {
        id: "SF-1042",
        title: "결제 후 플랜이 활성화되지 않음",
        customer: "Minerva Labs",
        assignee: "담당자 필요",
        priority: "긴급",
        sla: "1h 남음",
        status: "신규",
        tags: ["billing", "payment", "negative"],
        sentiment: "부정",
      },
      {
        id: "SF-1041",
        title: "SSO 설정 중 redirect 오류",
        customer: "Northstar AI",
        assignee: "담당자 필요",
        priority: "높음",
        sla: "3h 남음",
        status: "신규",
        tags: ["technical", "sso"],
        sentiment: "중립",
      },
    ],
    triage: [
      {
        id: "SF-1038",
        title: "인보이스 수신 이메일 변경 요청",
        customer: "Beacon Works",
        assignee: "Jiyoon",
        priority: "보통",
        sla: "16h 남음",
        status: "분류 완료",
        tags: ["account", "invoice"],
        sentiment: "중립",
      },
    ],
    assigned: [
      {
        id: "SF-1035",
        title: "API rate limit 상향 가능 여부",
        customer: "Plainware",
        assignee: "Doni",
        priority: "높음",
        sla: "5h 남음",
        status: "답변 작성",
        tags: ["product", "api"],
        sentiment: "중립",
      },
      {
        id: "SF-1032",
        title: "환불 정책 확인 요청",
        customer: "Pylon Studio",
        assignee: "Mina",
        priority: "높음",
        sla: "7h 남음",
        status: "답변 작성",
        tags: ["refund", "policy"],
        sentiment: "부정",
      },
    ],
    waiting: [
      {
        id: "SF-1029",
        title: "첨부 로그 재요청",
        customer: "Frontier Desk",
        assignee: "Jiyoon",
        priority: "보통",
        sla: "대기 중",
        status: "고객 대기",
        tags: ["technical", "logs"],
        sentiment: "중립",
      },
    ],
    resolved: [
      {
        id: "SF-1026",
        title: "팀 멤버 초대 제한 문의",
        customer: "Zendesk Ops",
        assignee: "Doni",
        priority: "낮음",
        sla: "충족",
        status: "답변 완료",
        tags: ["account", "team"],
        sentiment: "긍정",
      },
    ],
  };

const automationRules = [
  {
    name: "결제 실패 긴급 라우팅",
    trigger: "결제 실패, 청구, 인보이스 관련 표현이 포함된 문의",
    action: "우선순위를 긴급으로 올리고 결제 담당자에게 배정",
    status: "활성",
    lastRun: "오늘 09:42",
    runCount: "18",
  },
  {
    name: "부정 감정 SLA 단축",
    trigger: "AI가 부정 감정이거나 긴급 검토가 필요하다고 판단한 문의",
    action: "응답 목표를 4시간으로 줄이고 관리자에게 알림",
    status: "활성",
    lastRun: "오늘 08:18",
    runCount: "7",
  },
  {
    name: "기술 문의 자동 태깅",
    trigger: "오류, 버그, 장애 관련 표현이 포함된 문의",
    action: "기술 지원과 오류 신고 태그 추가",
    status: "초안",
    lastRun: "미실행",
    runCount: "0",
  },
  {
    name: "답변 완료 후 종료 후보",
    trigger: "답변 완료 7일 경과",
    action: "종료 후보로 표시",
    status: "활성",
    lastRun: "어제 18:05",
    runCount: "31",
  },
];

const reportRows = [
  ["답변 대기 문의", "42", "+8%", "SLA 위험 6건"],
  ["평균 첫 응답 시간", "2h 14m", "-12%", "목표 4h 이내"],
  ["AI 자동 분류율", "91%", "+5%", "수동 수정 9%"],
  ["부정 감정 문의", "11", "+3건", "결제 이슈 집중"],
  ["이번 주 완료", "128", "+18%", "재오픈 4건"],
];

const weeklyReportTrend = [
  { day: "월", tickets: 18, slaRisk: 4, firstResponseHours: 3.1 },
  { day: "화", tickets: 24, slaRisk: 5, firstResponseHours: 2.7 },
  { day: "수", tickets: 20, slaRisk: 3, firstResponseHours: 2.4 },
  { day: "목", tickets: 31, slaRisk: 8, firstResponseHours: 2.9 },
  { day: "금", tickets: 28, slaRisk: 6, firstResponseHours: 2.2 },
  { day: "토", tickets: 15, slaRisk: 2, firstResponseHours: 1.9 },
  { day: "일", tickets: 17, slaRisk: 3, firstResponseHours: 2.1 },
];

const categoryReportRows = [
  { category: "결제", tickets: 34, negativeRate: "24%" },
  { category: "기술 지원", tickets: 28, negativeRate: "18%" },
  { category: "계정", tickets: 21, negativeRate: "9%" },
  { category: "제품 문의", tickets: 17, negativeRate: "7%" },
  { category: "환불", tickets: 12, negativeRate: "31%" },
];

const integrations = [
  {
    name: "Slack",
    description: "긴급 문의와 SLA 위험 신호를 운영 채널로 전송합니다.",
    status: "연결됨",
    owner: "Admin",
  },
  {
    name: "Email Inbox",
    description: "support@ 도메인으로 들어온 이메일을 문의로 변환합니다.",
    status: "연결됨",
    owner: "Support Ops",
  },
  {
    name: "Linear",
    description: "버그 리포트를 제품팀 이슈로 연결합니다.",
    status: "설정 필요",
    owner: "Product",
  },
  {
    name: "OpenAI Provider",
    description: "실서비스 AI provider로 전환할 때 사용하는 연결입니다.",
    status: "준비 중",
    owner: "System",
  },
];

function PageShell({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mx-auto grid max-w-[1600px] gap-4 px-3 py-4 sm:px-4 lg:px-6">
      <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Badge variant="secondary">{eyebrow}</Badge>
          <h1 className="mt-2 text-xl font-semibold text-foreground">
            {title}
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className={buttonVariants({ size: "sm", variant: "outline" })}
            href="/tickets"
          >
            <Inbox className="size-4" aria-hidden="true" />
            문의함
          </Link>
          <Link className={buttonVariants({ size: "sm" })} href="/tickets">
            문의 처리
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}

function ToneBadge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-background",
        tone === "blue" && "border-blue-200 bg-blue-50 text-blue-700",
        tone === "emerald" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "orange" && "border-orange-200 bg-orange-50 text-orange-700",
        tone === "red" && "border-red-200 bg-red-50 text-red-700",
        tone === "slate" && "border-slate-200 bg-slate-50 text-slate-700",
        tone === "muted" && "border-border bg-muted text-muted-foreground",
      )}
    >
      {children}
    </Badge>
  );
}

function priorityTone(priority: MockTicket["priority"]): Tone {
  if (priority === "긴급") {
    return "red";
  }

  if (priority === "높음") {
    return "orange";
  }

  if (priority === "보통") {
    return "blue";
  }

  return "muted";
}

function sentimentTone(sentiment: MockTicket["sentiment"]): Tone {
  if (sentiment === "부정") {
    return "red";
  }

  if (sentiment === "긍정") {
    return "emerald";
  }

  return "muted";
}

function BoardTicketCard({ ticket }: { ticket: MockTicket }) {
  return (
    <article className="rounded-lg border border-border bg-card p-3 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {ticket.id} · {ticket.customer}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">
            {ticket.title}
          </h3>
        </div>
        <ToneBadge tone={priorityTone(ticket.priority)}>
          {ticket.priority}
        </ToneBadge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">담당자</p>
          <p className="mt-0.5 truncate font-medium text-foreground">
            {ticket.assignee}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">SLA</p>
          <p className="mt-0.5 truncate font-medium text-foreground">
            {ticket.sla}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <ToneBadge tone={sentimentTone(ticket.sentiment)}>
          {ticket.sentiment}
        </ToneBadge>
        {ticket.tags.slice(0, 3).map((tag) => (
          <ToneBadge key={tag}>{operationTagLabels[tag] ?? tag}</ToneBadge>
        ))}
      </div>
    </article>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-xs">
      <table className="min-w-[760px] w-full text-sm">
        <thead className="border-b border-border bg-muted/60 text-xs text-muted-foreground">
          <tr>
            {headers.map((header) => (
              <th className="px-3 py-2 text-left font-semibold" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr className="border-b border-border last:border-b-0" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="px-3 py-2 align-middle" key={cellIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FlowBoardView({ profile }: { profile: OperationProfile }) {
  return (
    <PageShell
      eyebrow={profile.role === "admin" ? "Admin Flow" : "Agent Flow"}
      title="처리 흐름"
      description="접수, AI 분류, 담당자 배정, 응답, 완료까지 문의가 어디에 머무는지 확인합니다."
    >
      <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <p className="text-sm font-semibold text-foreground">Flow Health</p>
          <div className="mt-3 grid gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">SLA 위험</p>
              <p className="mt-1 text-lg font-semibold text-foreground">6건</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">담당자 필요</p>
              <p className="mt-1 text-lg font-semibold text-foreground">2건</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">부정 감정</p>
              <p className="mt-1 text-lg font-semibold text-foreground">3건</p>
            </div>
          </div>
        </aside>

        <div className="grid gap-3 overflow-x-auto pb-1 lg:grid-cols-5">
          {flowColumns.map((column) => (
            <section
              className="min-w-[240px] rounded-lg border border-border bg-muted/40"
              key={column.key}
            >
              <div className="border-b border-border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    {column.title}
                  </h2>
                  <ToneBadge>{boardTickets[column.key].length}</ToneBadge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {column.description}
                </p>
              </div>
              <div className="grid gap-2 p-2">
                {boardTickets[column.key].map((ticket) => (
                  <BoardTicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function AutomationRulesView({
  profile,
}: {
  profile: OperationProfile;
}) {
  return (
    <PageShell
      eyebrow={profile.role === "admin" ? "Flow Rules" : "Rule Visibility"}
      title="자동화 규칙"
      description="AI 분류 결과와 문의 속성을 기준으로 담당자, 우선순위, SLA, 태그를 자동 제안하는 운영 규칙 화면입니다."
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <DataTable
          headers={["규칙", "조건", "액션", "상태", "최근 실행", "실행"]}
          rows={automationRules.map((rule) => [
            <span className="font-medium text-foreground" key="name">
              {rule.name}
            </span>,
            <span className="text-muted-foreground" key="trigger">
              {rule.trigger}
            </span>,
            <span className="text-muted-foreground" key="action">
              {rule.action}
            </span>,
            <ToneBadge
              key="status"
              tone={rule.status === "활성" ? "emerald" : "muted"}
            >
              {rule.status}
            </ToneBadge>,
            <span className="tabular-nums text-muted-foreground" key="lastRun">
              {rule.lastRun}
            </span>,
            <span className="tabular-nums font-medium" key="runCount">
              {rule.runCount}
            </span>,
          ])}
        />

        <aside className="rounded-lg border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Workflow className="size-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">
              규칙 미리보기
            </h2>
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-md border border-border bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground">조건</p>
              <p className="mt-1 text-foreground">
                고객 감정이 부정이고 우선순위가 긴급인 문의
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground">처리</p>
              <p className="mt-1 text-foreground">
                응답 목표를 4시간으로 줄이고 관리자에게 알린 뒤 결제 담당 큐로 보냅니다.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

export function ReportsView({ profile }: { profile: OperationProfile }) {
  return (
    <PageShell
      eyebrow={profile.role === "admin" ? "Operations Report" : "Team Report"}
      title="리포트"
      description="지원팀의 응답 속도, SLA 위험, AI 분류 품질, 부정 감정 트렌드를 추적하는 리포트 화면입니다."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {reportRows.map(([label, value, change, detail]) => (
          <div
            className="rounded-lg border border-border bg-card p-3 shadow-xs"
            key={label}
          >
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {change} · {detail}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                문의량과 응답 위험 추이
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                접수량, SLA 위험, 평균 첫 응답 시간을 함께 봅니다.
              </p>
            </div>
            <ToneBadge tone="blue">최근 7일</ToneBadge>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={weeklyReportTrend}
                margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
              >
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  axisLine={false}
                  dataKey="day"
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  domain={[0, 4]}
                  orientation="right"
                  tickFormatter={(value) => `${value}h`}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  yAxisId="time"
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    boxShadow: "var(--shadow-xs)",
                    color: "var(--foreground)",
                  }}
                  formatter={(value, name) => {
                    const labels: Record<string, string> = {
                      firstResponseHours: "평균 첫 응답",
                      slaRisk: "SLA 위험",
                      tickets: "접수 문의",
                    };
                    const suffix = name === "firstResponseHours" ? "h" : "건";

                    return [`${value}${suffix}`, labels[String(name)] ?? name];
                  }}
                />
                <Bar
                  dataKey="tickets"
                  fill="var(--chart-1)"
                  name="접수 문의"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="slaRisk"
                  fill="var(--chart-5)"
                  name="SLA 위험"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  dataKey="firstResponseHours"
                  dot={{ fill: "var(--card)", r: 3, strokeWidth: 2 }}
                  name="평균 첫 응답"
                  stroke="var(--chart-3)"
                  strokeWidth={2.5}
                  type="monotone"
                  yAxisId="time"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--chart-1)]" />
              접수 문의
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--chart-5)]" />
              SLA 위험
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full bg-[var(--chart-3)]" />
              평균 첫 응답
            </span>
          </div>
        </section>

        <aside className="grid gap-3">
          <section className="rounded-lg border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">
                카테고리별 문의
              </h2>
              <ToneBadge>이번 주</ToneBadge>
            </div>
            <div className="mt-4 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryReportRows}
                  layout="vertical"
                  margin={{ top: 0, right: 8, bottom: 0, left: 12 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    type="number"
                  />
                  <YAxis
                    axisLine={false}
                    dataKey="category"
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    type="category"
                    width={64}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      boxShadow: "var(--shadow-xs)",
                      color: "var(--foreground)",
                    }}
                    formatter={(value) => [`${value}건`, "문의"]}
                  />
                  <Bar
                    dataKey="tickets"
                    fill="var(--chart-1)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
              {categoryReportRows.slice(0, 3).map((row) => (
                <div
                  className="flex items-center justify-between gap-3"
                  key={row.category}
                >
                  <span>{row.category}</span>
                  <span className="tabular-nums">
                    부정 감정 {row.negativeRate}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-xs">
            <h2 className="text-sm font-semibold text-foreground">
              이번 주 운영 신호
            </h2>
            <div className="mt-4 grid gap-3">
            {[
              ["결제 문의 증가", "결제 태그가 전주 대비 24% 증가했습니다."],
              ["SLA 위험 집중", "긴급 문의 6건이 4시간 이내 응답을 기다립니다."],
              ["AI 수정률 안정", "수동 수정률이 9%로 목표 범위 안에 있습니다."],
            ].map(([title, detail]) => (
              <div className="rounded-md border border-border bg-muted/40 p-3" key={title}>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {detail}
                </p>
              </div>
            ))}
            </div>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}

export function IntegrationsSettingsView({
  profile,
}: {
  profile: OperationProfile;
}) {
  return (
    <PageShell
      eyebrow={profile.role === "admin" ? "Settings" : "Workspace Settings"}
      title="연동 설정"
      description="지원 운영에 연결된 외부 도구와 AI provider, 알림 채널, 이메일 inbox를 관리합니다."
    >
      <div className="grid gap-3 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-border bg-card p-2 shadow-xs">
          {[
            ["연동", Plug],
            ["AI 설정", Bot],
            ["SLA 정책", Clock3],
            ["팀 권한", UsersRound],
            ["보안", ShieldAlert],
          ].map(([label, Icon]) => {
            const ItemIcon = Icon as typeof Plug;

            return (
              <button
                className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                key={label as string}
                type="button"
              >
                <ItemIcon className="size-4" aria-hidden="true" />
                {label as string}
              </button>
            );
          })}
        </aside>

        <DataTable
          headers={["연동", "설명", "상태", "소유자", "액션"]}
          rows={integrations.map((integration) => [
            <span className="font-medium text-foreground" key="name">
              {integration.name}
            </span>,
            <span className="text-muted-foreground" key="description">
              {integration.description}
            </span>,
            <ToneBadge
              key="status"
              tone={
                integration.status === "연결됨"
                  ? "emerald"
                  : integration.status === "준비 중"
                    ? "blue"
                    : "amber"
              }
            >
              {integration.status}
            </ToneBadge>,
            <span className="text-muted-foreground" key="owner">
              {integration.owner}
            </span>,
            <button
              className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
              key="action"
              type="button"
            >
              설정
            </button>,
          ])}
        />
      </div>
    </PageShell>
  );
}

export function PublicOperationsHome({
  workspaceHref,
  workspaceLabel,
}: {
  workspaceHref: string;
  workspaceLabel: string;
}) {
  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-sidebar-border bg-sidebar p-3 text-sidebar-foreground lg:block">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Activity className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">SupportFlow</p>
              <p className="text-xs text-sidebar-foreground/55">CS Ops</p>
            </div>
          </div>
          <nav className="mt-6 grid gap-1 text-sm">
            {[
              ["운영 현황", Activity],
              ["문의함", Inbox],
              ["자동화", Workflow],
              ["리포트", SlidersHorizontal],
              ["연동 설정", Settings2],
            ].map(([label, Icon], index) => {
              const ItemIcon = Icon as typeof Activity;

              return (
                <div
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-md px-2.5 text-sidebar-foreground/72",
                    index === 0 && "bg-sidebar-accent text-sidebar-foreground",
                  )}
                  key={label as string}
                >
                  <ItemIcon className="size-4" aria-hidden="true" />
                  {label as string}
                </div>
              );
            })}
          </nav>
        </aside>

        <section className="grid content-start gap-4 px-3 py-4 sm:px-4 lg:px-6">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge variant="secondary">B2B Support Operations</Badge>
              <h1 className="mt-2 text-xl font-semibold text-foreground">
                고객 문의 Flow를 운영하는 SupportFlow
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                문의함, SLA, 담당자, AI 분류, 고객 정보를 한 화면에서
                확인하는 CS 운영툴입니다.
              </p>
            </div>
            <Link className={buttonVariants()} href={workspaceHref}>
              {workspaceLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  ["답변 대기", "42", Inbox],
                  ["SLA 위험", "6", AlertTriangle],
                  ["AI 검토", "9", Bot],
                  ["오늘 완료", "31", CheckCircle2],
                ].map(([label, value, Icon]) => {
                  const ItemIcon = Icon as typeof Inbox;

                  return (
                    <div
                      className="rounded-lg border border-border bg-card p-3 shadow-xs"
                      key={label as string}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          {label as string}
                        </p>
                        <ItemIcon
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {value as string}
                      </p>
                    </div>
                  );
                })}
              </div>

              <DataTable
                headers={[
                  "문의",
                  "상태",
                  "우선순위",
                  "SLA",
                  "담당자",
                  "태그",
                ]}
                rows={[
                  [
                    "SF-1042 결제 후 플랜 미활성화",
                    <ToneBadge tone="blue" key="status">답변 대기</ToneBadge>,
                    <ToneBadge tone="red" key="priority">긴급</ToneBadge>,
                    "1h 남음",
                    "담당자 필요",
                    "결제 · 결제 확인",
                  ],
                  [
                    "SF-1035 API rate limit 문의",
                    <ToneBadge tone="blue" key="status">답변 대기</ToneBadge>,
                    <ToneBadge tone="orange" key="priority">높음</ToneBadge>,
                    "5h 남음",
                    "Doni",
                    "제품 · API",
                  ],
                  [
                    "SF-1026 팀 멤버 초대 제한",
                    <ToneBadge tone="emerald" key="status">답변 완료</ToneBadge>,
                    <ToneBadge key="priority">낮음</ToneBadge>,
                    "응답 완료",
                    "Doni",
                    "계정 · 팀 관리",
                  ],
                ]}
              />
            </div>

            <aside className="rounded-lg border border-border bg-card p-4 shadow-xs">
              <p className="text-xs font-medium text-muted-foreground">
                고객 정보
              </p>
              <h2 className="mt-1 text-base font-semibold text-foreground">
                Minerva Labs
              </h2>
              <div className="mt-4 grid gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">최근 문의</p>
                  <p className="mt-1 font-medium text-foreground">
                    결제 후 플랜이 활성화되지 않음
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">AI 요약</p>
                  <p className="mt-1 leading-6 text-muted-foreground">
                    결제 성공 후 권한 동기화가 지연되어 고객이 강한 불만을
                    표현했습니다. 결제 담당자의 빠른 확인이 필요합니다.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <ToneBadge tone="red">부정</ToneBadge>
                  <ToneBadge tone="red">긴급</ToneBadge>
                  <ToneBadge>결제</ToneBadge>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
