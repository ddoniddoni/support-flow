import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components/logout-button";
import type { Tables } from "@/types/database";

type WorkspaceHeaderProps = {
  profile: Pick<Tables<"profiles">, "email" | "name" | "role">;
};

const roleLabels: Record<Tables<"profiles">["role"], string> = {
  customer: "Customer",
  agent: "Agent",
  admin: "Admin",
};

export function WorkspaceHeader({ profile }: WorkspaceHeaderProps) {
  const canViewDashboard = profile.role !== "customer";

  return (
    <header className="mx-auto mb-5 flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{roleLabels[profile.role]}</Badge>
          <span className="truncate text-sm text-zinc-500">{profile.email}</span>
        </div>
        <p className="mt-1 text-lg font-semibold text-zinc-950">
          {profile.name}
        </p>
      </div>

      <nav className="grid gap-2 sm:flex sm:items-center">
        {canViewDashboard ? (
          <Link
            className={buttonVariants({
              variant: "outline",
              className: "w-full sm:w-auto",
            })}
            href="/dashboard"
          >
            대시보드
          </Link>
        ) : null}
        <Link
          className={buttonVariants({
            variant: "outline",
            className: "w-full sm:w-auto",
          })}
          href="/tickets"
        >
          티켓
        </Link>
        <LogoutButton />
      </nav>
    </header>
  );
}
