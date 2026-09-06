"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type FormActionsProps = {
  submitLabel: string;
  pendingLabel: string;
  secondaryLabel: string;
  onSecondary: () => void;
  pending: boolean;
  submitIcon?: ReactNode;
};

/** Form footer: secondary first, submit last, with matching button dimensions. */
export function FormActions({ submitLabel, pendingLabel, secondaryLabel, onSecondary, pending, submitIcon }: FormActionsProps) {
  return (
    <div data-slot="form-actions" className="grid gap-3 border-t border-border pt-6 sm:flex sm:items-center sm:justify-end">
      <Button size="form" variant="outline" type="button" disabled={pending} onClick={onSecondary} className="w-full sm:w-auto">
        {secondaryLabel}
      </Button>
      <Button size="form" type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : submitIcon}
        {pending ? pendingLabel : submitLabel}
      </Button>
    </div>
  );
}
