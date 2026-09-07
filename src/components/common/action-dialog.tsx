"use client";

import { Dialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function ActionDialog({
  open,
  onClose,
  title,
  description,
  children,
  finalFocus,
  body,
  pending = false,
  closeLabel = "취소",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
  body?: ReactNode;
  pending?: boolean;
  closeLabel?: string;
  finalFocus?: Dialog.Popup.Props["finalFocus"];
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Popup
          finalFocus={finalFocus}
          className="fixed top-1/2 left-1/2 z-50 grid max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto overscroll-contain rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xl"
        >
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="text-sm leading-6 text-muted-foreground">
            {description}
          </Dialog.Description>
          {body}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onClose}
            >
              {closeLabel}
            </Button>
            {children}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
