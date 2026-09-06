"use client";

import { useEffect, useRef } from "react";

export function SelectionCheckbox({ label, checked, indeterminate = false, disabled, onChange }: {
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return <label className="inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center"><input ref={ref} type="checkbox" aria-label={label} aria-checked={indeterminate ? "mixed" : checked} checked={checked} disabled={disabled} onChange={onChange} className="size-4 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50" /></label>;
}
