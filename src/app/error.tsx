"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/60 p-6">
      <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 size-5" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-semibold">화면을 불러오지 못했습니다</h1>
            <p className="mt-2 text-sm leading-6 text-red-600">
              네트워크 상태나 권한 정책을 확인한 뒤 다시 시도해 주세요.
            </p>
            <Button
              className="mt-5"
              type="button"
              variant="outline"
              onClick={() => reset()}
            >
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
