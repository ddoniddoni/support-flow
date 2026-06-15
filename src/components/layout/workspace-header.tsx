import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components/logout-button";
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
    <header className="mx-auto mb-5 flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{roleLabels[profile.role]}</Badge>
          <span className="truncate text-sm text-muted-foreground">
            {profile.email}
          </span>
        </div>
        <p className="mt-1 text-lg font-semibold text-foreground">
          {profile.name}
        </p>
      </div>

      <nav className="grid gap-2 sm:flex sm:items-center">
        <ThemeToggle />
        {canViewDashboard ? (
          <Link
            className={buttonVariants({
              variant: "outline",
              className: "w-full sm:w-auto",
            })}
            href="/dashboard"
          >
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
          문의 목록
        </Link>
        <LogoutButton />
      </nav>
    </header>
  );
}
