import Link from "next/link";

import { WorkspaceHeader } from "@/components/layout/workspace-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireServerRole } from "@/features/auth/api/server-auth";
import { CreateTicketForm } from "@/features/tickets/components/create-ticket-form";

export default async function NewTicketPage() {
  const profile = await requireServerRole(["customer"]);

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <WorkspaceHeader profile={profile} />

      <div className="mx-auto grid max-w-3xl gap-6">
        <div className="flex flex-col gap-2">
          <Link className="text-sm font-medium text-zinc-500" href="/tickets">
            티켓 목록
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-950">
              새 티켓 등록
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              지원팀이 빠르게 파악할 수 있도록 문제 상황과 필요한 조치를
              구체적으로 적어 주세요.
            </p>
          </div>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>문의 정보</CardTitle>
            <CardDescription>
              등록된 티켓은 담당자 배정과 상태 변경 이력을 기준으로 관리됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTicketForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
