"use client";

import {
  Activity,
  BarChart3,
  GitBranch,
  Inbox,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Plus,
  ShieldAlert,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
import { ThemeToggle } from "./theme-toggle";

type WorkspaceHeaderProps = {
  profile: Pick<Tables<"profiles">, "email" | "name" | "role">;
};

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  match?: (pathname: string) => boolean;
};

type SidebarMode = "compact" | "expanded" | "hidden";

const sidebarStorageKey = "supportflow:workspace-sidebar";

const sidebarWidths: Record<SidebarMode, string> = {
  compact: "4.5rem",
  expanded: "16rem",
  hidden: "0px",
};

const roleLabels: Record<Tables<"profiles">["role"], string> = {
  customer: "고객",
  agent: "상담원",
  admin: "관리자",
};

function getNavItems(role: Tables<"profiles">["role"]): NavItem[] {
  const items: NavItem[] = [
    {
      href: "/tickets",
      icon: Inbox,
      label: "문의함",
      match: (pathname) =>
        pathname === "/tickets" || pathname.startsWith("/tickets/"),
    },
  ];

  if (role === "customer") {
    items.push({
      href: "/tickets/new",
      icon: Plus,
      label: "문의 등록",
      match: (pathname) => pathname === "/tickets/new",
    });
    return items;
  }

  items.unshift({
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "운영 현황",
    match: (pathname) => pathname === "/dashboard",
  });

  items.push({
    href: "/flow-board",
    icon: GitBranch,
    label: "Flow Board",
    match: (pathname) => pathname === "/flow-board",
  });

  items.push({
    href: "/tickets/ai-review",
    icon: ShieldAlert,
    label: "AI 신호",
    match: (pathname) => pathname.startsWith("/tickets/ai-review"),
  });

  items.push({
    href: "/automations",
    icon: Workflow,
    label: "자동화",
    match: (pathname) => pathname === "/automations",
  });

  items.push({
    href: "/reports",
    icon: BarChart3,
    label: "리포트",
    match: (pathname) => pathname === "/reports",
  });

  items.push({
    href: "/settings/integrations",
    icon: Plug,
    label: "연동 설정",
    match: (pathname) => pathname.startsWith("/settings"),
  });

  if (role === "admin") {
    items.push({
      href: "/admin/agents",
      icon: UsersRound,
      label: "담당자",
      match: (pathname) => pathname.startsWith("/admin/agents"),
    });
  }

  return items;
}

function isSidebarMode(value: string | null): value is SidebarMode {
  return value === "expanded" || value === "compact" || value === "hidden";
}

function WorkspaceLogo({ mode }: { mode: SidebarMode }) {
  const isCompact = mode === "compact";

  return (
    <Link
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/40",
        isCompact && "justify-center",
      )}
      href="/"
      aria-label="SupportFlow 홈으로 이동"
      title={isCompact ? "SupportFlow" : undefined}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <Activity className="size-4" aria-hidden="true" />
      </span>
      <span className={cn("min-w-0", isCompact && "sr-only")}>
        <span className="block truncate text-sm font-semibold text-sidebar-foreground">
          SupportFlow
        </span>
        <span className="block truncate text-xs text-sidebar-foreground/55">
          CS Operations
        </span>
      </span>
    </Link>
  );
}

function NavLink({
  item,
  mode,
  pathname,
}: {
  item: NavItem;
  mode: SidebarMode;
  pathname: string;
}) {
  const Icon = item.icon;
  const isActive = item.match ? item.match(pathname) : pathname === item.href;
  const isCompact = mode === "compact";

  return (
    <Link
      className={cn(
        "flex h-9 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-sidebar-foreground/72 transition-[background-color,color] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/35",
        isCompact && "justify-center px-0",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
      href={item.href}
      title={isCompact ? item.label : undefined}
      aria-label={isCompact ? item.label : undefined}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className={cn("truncate", isCompact && "sr-only")}>
        {item.label}
      </span>
    </Link>
  );
}

function MobileNavLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const Icon = item.icon;
  const isActive = item.match ? item.match(pathname) : pathname === item.href;

  return (
    <Link
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/35",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
      href={item.href}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function ProfileBlock({
  mode,
  profile,
}: {
  mode: SidebarMode;
  profile: Pick<Tables<"profiles">, "email" | "name" | "role">;
}) {
  if (mode === "compact") {
    return (
      <div
        className="flex size-9 items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent/60 text-xs font-semibold text-sidebar-foreground"
        title={`${profile.name} · ${roleLabels[profile.role]}`}
      >
        {profile.name.slice(0, 1)}
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-md border border-sidebar-border bg-sidebar-accent/60 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium text-sidebar-foreground">
          {profile.name}
        </p>
        <Badge className="border-sidebar-border bg-transparent text-sidebar-foreground/80">
          {roleLabels[profile.role]}
        </Badge>
      </div>
      <p className="mt-1 truncate text-xs text-sidebar-foreground/55">
        {profile.email}
      </p>
    </div>
  );
}

function getNextSidebarMode(mode: SidebarMode): SidebarMode {
  if (mode === "expanded") {
    return "compact";
  }

  if (mode === "compact") {
    return "hidden";
  }

  return "expanded";
}

function getSidebarToggleLabel(mode: SidebarMode) {
  if (mode === "expanded") {
    return "사이드바 간략히 보기";
  }

  if (mode === "compact") {
    return "사이드바 숨기기";
  }

  return "사이드바 펼치기";
}

function SidebarToggleIcon({ mode }: { mode: SidebarMode }) {
  if (mode === "expanded") {
    return <PanelLeftClose className="size-4" aria-hidden="true" />;
  }

  if (mode === "compact") {
    return (
      <PanelLeftOpen className="size-4 rotate-180" aria-hidden="true" />
    );
  }

  return <PanelLeftOpen className="size-4" aria-hidden="true" />;
}

export function WorkspaceHeader({ profile }: WorkspaceHeaderProps) {
  const pathname = usePathname();
  const navItems = getNavItems(profile.role);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    if (typeof window === "undefined") {
      return "expanded";
    }

    const savedMode = window.localStorage.getItem(sidebarStorageKey);

    return isSidebarMode(savedMode) ? savedMode : "expanded";
  });
  const isCompact = sidebarMode === "compact";
  const isHidden = sidebarMode === "hidden";
  const sidebarToggleLabel = getSidebarToggleLabel(sidebarMode);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--workspace-sidebar-width",
      sidebarWidths[sidebarMode],
    );
    window.localStorage.setItem(sidebarStorageKey, sidebarMode);
  }, [sidebarMode]);

  function toggleSidebarMode() {
    setSidebarMode((currentMode) => getNextSidebarMode(currentMode));
  }

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar py-3 text-sidebar-foreground transition-[width,transform,padding] duration-200 lg:flex",
          sidebarMode === "expanded" && "w-64 px-3",
          sidebarMode === "compact" && "w-[4.5rem] px-2",
          sidebarMode === "hidden" && "w-64 -translate-x-full px-3",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2",
            isCompact ? "justify-center" : "justify-between",
          )}
        >
          <WorkspaceLogo mode={sidebarMode} />
          <div className={cn("flex items-center gap-1", isCompact && "hidden")}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label={sidebarToggleLabel}
              title={sidebarToggleLabel}
              onClick={toggleSidebarMode}
            >
              <SidebarToggleIcon mode={sidebarMode} />
            </Button>
          </div>
        </div>

        {isCompact ? (
          <div className="mt-3 grid gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="mx-auto text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label={sidebarToggleLabel}
              title={sidebarToggleLabel}
              onClick={toggleSidebarMode}
            >
              <SidebarToggleIcon mode={sidebarMode} />
            </Button>
          </div>
        ) : null}

        <nav className="mt-6 grid gap-1" aria-label="워크스페이스 메뉴">
          {navItems.map((item) => (
            <NavLink
              item={item}
              key={item.href}
              mode={sidebarMode}
              pathname={pathname}
            />
          ))}
        </nav>

        <div
          className={cn(
            "mt-auto grid gap-3",
            isCompact && "justify-items-center",
          )}
        >
          <ProfileBlock mode={sidebarMode} profile={profile} />
          <div
            className={cn(
              "grid gap-2",
              isCompact ? "justify-items-center" : "grid-cols-[auto_1fr]",
            )}
          >
            <ThemeToggle />
            <LogoutButton
              showLabel={!isCompact}
              size={isCompact ? "icon" : "default"}
            />
          </div>
        </div>
      </aside>

      {isHidden ? (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="fixed top-3 left-3 z-40 hidden shadow-sm lg:inline-flex"
          aria-label="사이드바 열기"
          title="사이드바 열기"
          onClick={() => setSidebarMode("expanded")}
        >
          <PanelLeftOpen className="size-4" aria-hidden="true" />
        </Button>
      ) : null}

      <header className="sticky top-0 z-30 border-b border-border bg-sidebar px-3 py-2 text-sidebar-foreground lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <WorkspaceLogo mode="expanded" />
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
        <nav
          className="mt-2 flex gap-1 overflow-x-auto pb-1"
          aria-label="워크스페이스 메뉴"
        >
          {navItems.map((item) => (
            <MobileNavLink item={item} key={item.href} pathname={pathname} />
          ))}
        </nav>
      </header>
    </>
  );
}
