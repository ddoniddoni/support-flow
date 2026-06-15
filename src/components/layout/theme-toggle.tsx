"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const themeLabels = {
  light: "라이트 모드",
  dark: "다크 모드",
} as const;

type ThemeName = keyof typeof themeLabels;

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function isThemeName(value: string | undefined): value is ThemeName {
  return value === "light" || value === "dark";
}

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const currentTheme: ThemeName = mounted && isThemeName(theme) ? theme : "light";
  const nextTheme = currentTheme === "light" ? "dark" : "light";

  const Icon = currentTheme === "light" ? Sun : Moon;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={`테마 변경: 현재 ${themeLabels[currentTheme]}`}
      title={`현재 ${themeLabels[currentTheme]}`}
      onClick={() => setTheme(nextTheme)}
    >
      <Icon className="size-4" aria-hidden="true" />
    </Button>
  );
}
