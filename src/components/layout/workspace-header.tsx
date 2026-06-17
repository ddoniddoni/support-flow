import { Activity, LayoutDashboard, ListChecks } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
import { ThemeToggle } from "./theme-toggle";

type WorkspaceHeaderProps = {
  profile: Pick<Tables<"profiles">, "email" | "name" | "role">;
};

const roleLabels: Record<Tables<"profiles">["role"], string> = {
  customer: "고객",
  agent: "상담원",
  admin: "관리자",
};

export function WorkspaceHeader({ profile }: WorkspaceHeaderProps) {
  const canViewDashboard = profile.role !== "customer";

  return (
    <header className="mx-auto mb-5 max-w-6xl rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Link
          className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          href="/"
          aria-label="SupportFlow 홈으로 이동"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Activity className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-foreground">SupportFlow</p>
              <Badge variant="secondary">{roleLabels[profile.role]}</Badge>
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {profile.name} · {profile.email}
            </p>
          </div>
        </Link>

        <nav className="grid gap-2 sm:flex sm:items-center">
          <ThemeToggle />
          {canViewDashboard ? (
            <Link
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className: "w-full sm:w-auto",
                }),
              )}
              href="/dashboard"
            >
              <LayoutDashboard className="size-4" aria-hidden="true" />
              운영 현황
            </Link>
          ) : null}
          <Link
            className={buttonVariants({
              variant: "outline",
              className: "w-full sm:w-auto",
            })}
            href="/tickets"
          >
            <ListChecks className="size-4" aria-hidden="true" />
            문의 목록
          </Link>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
