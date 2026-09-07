"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { TicketReplyInput } from "../schemas/ticket-schema";
import { parseReplyDraft, replyDraftKey } from "../utils/reply-draft-storage";

type DraftForm = Pick<UseFormReturn<TicketReplyInput>, "watch" | "reset">;
export function useReplyDraft({ accountId, ticketId, internal, sourceRef, watch, reset, conversationRef, onRestoreVersion }: DraftForm & {
  accountId: string; ticketId: string; internal: boolean;
  sourceRef: RefObject<"manual" | "ai_draft">;
  conversationRef?: RefObject<number | null>;
  onRestoreVersion?: (version: number | null) => void;
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
    let ownedSnapshot: string | null = null;
    try {
      let raw: string | null = null;
      try { raw = sessionStorage.getItem(key); } catch { /* Fall back to persistent draft. */ }
      ownedSnapshot = raw ?? localStorage.getItem(key);
      const draft = parseReplyDraft(ownedSnapshot);
      if (draft) {
        sourceRef.current = draft.source;
        if (conversationRef) conversationRef.current = draft.expectedReplyOrder ?? null;
        onRestoreVersion?.(draft.expectedReplyOrder ?? null);
        reset({ content: draft.content });
        store.update("저장된 내용을 복구했습니다 · 이 브라우저에만 저장됩니다.");
      } else {
        try { sessionStorage.removeItem(key); } catch { /* Storage may be blocked. */ }
        if (localStorage.getItem(key) === ownedSnapshot) localStorage.removeItem(key);
      }
    } catch { store.update("임시 저장을 사용할 수 없습니다. 페이지를 떠나기 전에 내용을 복사해 주세요."); }
    const subscription = watch(values => {
      try {
        if (values.content?.trim()) {
          ownedSnapshot = JSON.stringify({ content: values.content, source: sourceRef.current, savedAt: Date.now(), expectedReplyOrder: conversationRef?.current });
          try { sessionStorage.setItem(key, ownedSnapshot); } catch { /* Persistent fallback remains available. */ }
          localStorage.setItem(key, ownedSnapshot);
          store.update("임시 저장됨 · 이 브라우저에 7일간 보관됩니다.");
        } else {
          try { sessionStorage.removeItem(key); } catch { /* Storage may be blocked. */ }
          if (localStorage.getItem(key) === ownedSnapshot) localStorage.removeItem(key);
          ownedSnapshot = null;
          store.update("이 브라우저에 7일간 임시 저장됩니다.");
        }
      } catch { store.update("임시 저장에 실패했습니다. 페이지를 떠나기 전에 내용을 복사해 주세요."); }
    });
    return () => subscription.unsubscribe();
  }, [key, reset, sourceRef, watch, store, conversationRef, onRestoreVersion]);
  return status;
}
