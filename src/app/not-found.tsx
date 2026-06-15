import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/60 p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          요청한 페이지가 삭제되었거나 주소가 변경되었습니다.
        </p>
        <Link
          className={buttonVariants({ className: "mt-6 w-full sm:w-auto" })}
          href="/dashboard"
        >
          대시보드로 이동
        </Link>
      </div>
    </main>
  );
}
