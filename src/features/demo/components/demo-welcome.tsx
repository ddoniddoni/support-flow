"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowRight, Compass, X } from "lucide-react";
import type { Role } from "@/types/domain";
import { demoGuides, getDemoAccount } from "../demo-accounts";
const eventName = "supportflow:demo-guide-dismissed";
function subscribe(callback: () => void) {
  window.addEventListener(eventName, callback);
  return () => window.removeEventListener(eventName, callback);
}
function getServerSnapshot() {
  return true;
}
function isDismissed(key: string) {
  try {
    return sessionStorage.getItem(key) === "dismissed";
  } catch {
    return false;
  }
}
export function DemoWelcome({
  profileId,
  role,
}: {
  profileId: string;
  role: Role;
}) {
  const key = `supportflow:demo-guide:v1:${profileId}:${role}`;
  const storedDismissed = useSyncExternalStore(
    subscribe,
    () => isDismissed(key),
    getServerSnapshot,
  );
  const [closed, setClosed] = useState(false);
  if (storedDismissed || closed) return null;
  const guide = demoGuides[role];
  return (
    <aside
      aria-label="데모 체험 안내"
      className="mx-auto mt-5 w-[calc(100%-2.5rem)] max-w-6xl rounded-xl border border-blue-200 bg-blue-50 p-4 text-slate-800 sm:mt-6 sm:p-5 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-slate-100"
    >
      <div className="flex items-start gap-3">
        <Compass
          className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-300"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-medium text-blue-700 dark:text-blue-300">
            {getDemoAccount(role)?.label} 데모 가이드
          </p>
          <h2 className="text-sm font-semibold leading-6">{guide.title}</h2>
          <p className="mt-1 max-w-3xl text-xs leading-6 text-slate-600 dark:text-slate-300">
            {guide.description}
          </p>
          <Link
            href={guide.href}
            className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-md text-xs font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 dark:text-blue-300"
          >
            {guide.action}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <button
          type="button"
          aria-label="데모 체험 안내 닫기"
          className="-mr-1 -mt-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-md text-slate-500 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-slate-300 dark:hover:bg-blue-400/20"
          onClick={() => {
            setClosed(true);
            try {
              sessionStorage.setItem(key, "dismissed");
              window.dispatchEvent(new Event(eventName));
            } catch {
              /* Closing still works when browser storage is unavailable. */
            }
          }}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
