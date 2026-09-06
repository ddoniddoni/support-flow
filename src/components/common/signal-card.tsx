import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SignalTone = "neutral" | "info" | "warning" | "danger" | "success";
const tones: Record<SignalTone, string> = {
  neutral: "border-border bg-card [--signal-accent:var(--foreground)]",
  info: "border-blue-100 bg-slate-50 [--signal-accent:#315d94] dark:border-[#2d3b50] dark:bg-[#171f2e] dark:[--signal-accent:#a0bee7]",
  warning: "border-amber-200/60 bg-amber-50/40 [--signal-accent:#876125] dark:border-[#4a4030] dark:bg-[#242329] dark:[--signal-accent:#dfbf85]",
  danger: "border-rose-200/70 bg-rose-50/50 [--signal-accent:#a33f4b] dark:border-[#513440] dark:bg-[#28212b] dark:[--signal-accent:#eea5ad]",
  success: "border-emerald-200/60 bg-emerald-50/40 [--signal-accent:#2e7055] dark:border-[#30453f] dark:bg-[#1b272a] dark:[--signal-accent:#9acdb7]",
};

export function SignalCard({ label, value, description, tone = "neutral", icon: Icon }: {
  label: string;
  value: string;
  description: string;
  tone?: SignalTone;
  icon: LucideIcon;
}) {
  return (
    <div className={cn("min-w-0 rounded-xl border p-4", tones[tone])}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Icon className="size-4 shrink-0 text-[var(--signal-accent)]" aria-hidden="true" />{label}</div>
      <p className="mt-2 break-words text-lg font-semibold leading-7 text-[var(--signal-accent)]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}
