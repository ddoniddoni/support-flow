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
    <main className="min-h-screen bg-muted/40">
      <WorkspaceHeader profile={profile} />

      <div className="mx-auto grid max-w-3xl gap-6 px-5 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <Link className="text-sm font-medium text-muted-foreground" href="/tickets">
            문의 목록
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              새 문의 등록
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              지원팀이 빠르게 파악할 수 있도록 문의 내용을 구체적으로 적어
              주세요.
            </p>
          </div>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>문의 정보</CardTitle>
            <CardDescription>
              접수 후 지원팀이 내용을 검토하고 답변 상태를 안내합니다.
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
