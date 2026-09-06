"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

export function CustomerHeader({ name }: { name: string }) {
  const pathname = usePathname();
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-4 sm:px-8">
        <Link href="/tickets/new" aria-label="SupportFlow 고객센터 홈" className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-ring">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><MessageCircle className="size-5" aria-hidden="true" /></span>
          <span><span className="block text-base font-semibold">SupportFlow</span><span className="block text-xs text-muted-foreground">고객센터</span></span>
        </Link>
        <div className="flex items-center gap-2"><span className="mr-2 hidden max-w-40 truncate text-sm text-muted-foreground sm:block">{name}님</span><ThemeToggle /><LogoutButton /></div>
        <nav aria-label="고객센터 메뉴" className="flex w-full gap-2 sm:order-none">
          {[{ href: "/tickets/new", label: "문의하기", active: pathname === "/tickets/new" }, { href: "/tickets", label: "내 문의", active: pathname === "/tickets" || (pathname.startsWith("/tickets/") && pathname !== "/tickets/new") }].map(item => (
            <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined} className={cn("rounded-lg px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring", item.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>{item.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
