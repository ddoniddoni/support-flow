"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  showLabel?: boolean;
  size?: "default" | "icon" | "icon-sm";
};

export function LogoutButton({
  className,
  showLabel = true,
  size = "default",
}: LogoutButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      className={cn(className)}
      disabled={isPending}
      onClick={handleLogout}
      size={size}
      variant="outline"
    >
      <LogOut className="size-4" aria-hidden="true" />
      {showLabel ? "로그아웃" : <span className="sr-only">로그아웃</span>}
    </Button>
  );
}
