"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { TicketReplyInput } from "../schemas/ticket-schema";
import { parseReplyDraft, replyDraftKey } from "../utils/reply-draft-storage";

type DraftForm = Pick<UseFormReturn<TicketReplyInput>, "watch" | "reset">;
export function useReplyDraft({ accountId, ticketId, internal, sourceRef, watch, reset }: DraftForm & {
  accountId: string; ticketId: string; internal: boolean;
  sourceRef: RefObject<"manual" | "ai_draft">;
}) {
  const [store] = useState(() => {
    let value = "이 브라우저에 7일간 임시 저장됩니다.";
    const listeners = new Set<() => void>();
    return {
      getSnapshot: () => value,
      subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
      update: (next: string) => { value = next; listeners.forEach(listener => listener()); },
    };
  });
  const status = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const key = replyDraftKey(accountId, ticketId, internal);
  useEffect(() => {
    try {
      const draft = parseReplyDraft(localStorage.getItem(key));
      if (draft) {
        sourceRef.current = draft.source;
        reset({ content: draft.content });
        store.update("저장된 내용을 복구했습니다 · 이 브라우저에만 저장됩니다.");
      } else localStorage.removeItem(key);
    } catch { store.update("임시 저장을 사용할 수 없습니다. 페이지를 떠나기 전에 내용을 복사해 주세요."); }
    const subscription = watch(values => {
      try {
        if (values.content?.trim()) {
          localStorage.setItem(key, JSON.stringify({ content: values.content, source: sourceRef.current, savedAt: Date.now() }));
          store.update("임시 저장됨 · 이 브라우저에 7일간 보관됩니다.");
        } else {
          localStorage.removeItem(key);
          store.update("이 브라우저에 7일간 임시 저장됩니다.");
        }
      } catch { store.update("임시 저장에 실패했습니다. 페이지를 떠나기 전에 내용을 복사해 주세요."); }
    });
    return () => subscription.unsubscribe();
  }, [key, reset, sourceRef, watch, store]);
  return status;
}
