import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-zinc-500">403</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950">
          접근 권한이 없습니다
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          현재 계정 역할로는 이 업무 공간을 볼 수 없습니다.
        </p>
        <Link
          className={buttonVariants({ className: "mt-6 w-full sm:w-auto" })}
          href="/dashboard"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    </main>
  );
}
