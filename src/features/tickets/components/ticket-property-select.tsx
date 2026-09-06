"use client";

import { Loader2, UserRound } from "lucide-react";

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type TicketPropertyOption = {
  value: string;
  label: string;
  description?: string;
  color?: string;
  avatar?: string;
  disabled?: boolean;
};

function OptionMarker({ option }: { option: TicketPropertyOption }) {
  if (option.color) {
    return <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full ring-4 ring-current/10", option.color)} />;
  }
  return (
    <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
      {option.avatar || <UserRound className="size-3.5" />}
    </span>
  );
}

export function TicketPropertySelect({
  id, label, value, options, disabled, pending, onValueChange,
}: {
  id: string;
  label: string;
  value: string;
  options: TicketPropertyOption[];
  disabled?: boolean;
  pending?: boolean;
  onValueChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value);
  return (
    <div className="grid gap-2">
      <label id={`${id}-label`} htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select
        modal={false}
        value={value}
        items={options}
        disabled={disabled}
        onValueChange={(next) => { if (next !== null && next !== value) onValueChange(next); }}
      >
        <SelectTrigger
          id={id}
          aria-labelledby={`${id}-label ${id}-value`}
          aria-busy={pending || undefined}
          className="group h-12 w-full gap-3 rounded-lg border-border bg-muted/30 px-3 text-foreground shadow-xs hover:border-ring/60 hover:bg-muted/70 data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/15 dark:bg-muted/30 dark:hover:bg-muted/70"
        >
          {selected ? <OptionMarker option={selected} /> : null}
          <SelectValue id={`${id}-value`} className="min-w-0">
            <span className="truncate">{selected?.label ?? "선택해 주세요"}</span>
          </SelectValue>
          {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" /> : null}
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false} sideOffset={6} className="rounded-xl border border-border p-1.5 shadow-xl motion-reduce:animate-none">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              label={option.label}
              className="min-h-11 cursor-pointer gap-3 rounded-lg py-2.5 pr-8 pl-3 data-highlighted:bg-accent data-highlighted:text-accent-foreground data-selected:bg-muted/60 [&>[data-slot]]:min-w-0"
            >
              <span className="flex min-w-0 items-center gap-3">
                <OptionMarker option={option} />
                <span className="grid min-w-0 gap-0.5">
                  <span className="truncate font-medium">{option.label}</span>
                  {option.description ? <span className="truncate text-xs text-muted-foreground">{option.description}</span> : null}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
