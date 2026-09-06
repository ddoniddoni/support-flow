"use client";

import type { Ref } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { cn } from "@/lib/utils";

type SelectOption<T extends string> = { value: T; label: string; disabled?: boolean };

type AppSelectProps<T extends string> = {
  options: readonly SelectOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  id?: string;
  name?: string;
  disabled?: boolean;
  onBlur?: () => void;
  ref?: Ref<HTMLButtonElement>;
  className?: string;
};

/** Standard single-choice control. Use Controller for React Hook Form fields. */
export function AppSelect<T extends string>({ options, value, onValueChange, disabled, name, className, ...triggerProps }: AppSelectProps<T>) {
  return (
    <Select modal={false} items={options} value={value} onValueChange={(next) => { if (next !== null) onValueChange(next); }} disabled={disabled} name={name}>
      <SelectTrigger {...triggerProps} className={cn("w-full min-w-0", className)}><SelectValue /></SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        {options.map(option => <SelectItem key={option.value} value={option.value} disabled={option.disabled}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
