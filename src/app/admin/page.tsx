import { BarChart3, ListChecks, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { requireServerRole } from "@/features/auth/api/server-auth";

const adminAreas = [
  {
    title: "전체 문의 운영",
    description: "모든 고객 문의를 확인하고 상태, 우선순위, 담당자를 조정합니다.",
    icon: ListChecks,
  },
  {
    title: "운영 통계",
    description: "접수 대기, 처리 중, 해결 완료와 AI 주의 신호를 확인합니다.",
    icon: BarChart3,
  },
  {
    title: "역할과 권한",
    description: "관리자 권한은 Supabase RLS와 서버 라우트 가드로 보호됩니다.",
    icon: ShieldCheck,
  },
];

export default async function AdminPage() {
  const profile = await requireServerRole(["admin"]);

  return (
    <main className="min-h-screen bg-muted/40">
      <WorkspaceHeader profile={profile} />

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-7 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge variant="secondary">Admin Console</Badge>
              <h1 className="mt-3 text-2xl font-semibold text-foreground">
                지원 운영 관리
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                관리자 기능은 문의 목록, 문의 상세, 운영 대시보드에 연결되어
                있습니다. 실제 지원팀이 쓰는 흐름처럼 문의를 중심으로 배정과
                상태 변경을 처리합니다.
              </p>
            </div>
            <div className="grid gap-2 sm:flex">
              <Link className={buttonVariants()} href="/tickets">
                문의 목록
              </Link>
              <Link
                className={buttonVariants({ variant: "outline" })}
                href="/dashboard"
              >
                운영 현황
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {adminAreas.map((area) => (
            <Card key={area.title} className="rounded-lg">
              <CardHeader>
                <area.icon
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <CardTitle className="text-base">{area.title}</CardTitle>
                <CardDescription>{area.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="size-5 text-muted-foreground" />
              포트폴리오 데모 기준
            </CardTitle>
            <CardDescription>
              사용자 관리 전용 화면은 확장 지점으로 남겨두고, 현재 버전은
              문의 운영 경험의 완성도에 집중합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            관리자 계정으로 로그인하면 전체 문의 조회, 상담원 배정, 우선순위
            변경, 상태 변경, 활동 로그 확인이 가능합니다.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
