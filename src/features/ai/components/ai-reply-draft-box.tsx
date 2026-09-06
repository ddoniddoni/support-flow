import { Check, Clipboard, TextCursorInput, FilePenLine } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AIReplyDraftBox({
  draft,
  canUseDraft,
  disabledReason,
  onUseDraft,
}: {
  draft: string | null;
  canUseDraft: boolean;
  disabledReason?: string;
  onUseDraft: (draft: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  if (!draft) {
    return (
      <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
        AI가 고객 답변 초안을 만들지 않았습니다.
      </div>
    );
  }

  async function copyDraft() {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(draft ?? "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError("복사하지 못했습니다. 초안 내용을 선택해 직접 복사해 주세요.");
    }
  }

  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-[#3b4358] dark:bg-[#20293a]">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-[#c4cde6]"><FilePenLine className="size-4" aria-hidden="true" />답변 초안</p>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-[#2c344a] dark:text-[#b9c4df]">미전송 · 상담원 검토용</span>
        </div>
        <p className="mt-3 max-w-[72ch] whitespace-pre-wrap break-words text-base leading-7 text-foreground">
          {draft}
        </p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void copyDraft()}
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Clipboard className="size-4" aria-hidden="true" />
          )}
          {copied ? "복사됨" : "복사"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="default"
          disabled={!canUseDraft}
          onClick={() => onUseDraft(draft)}
        >
          <TextCursorInput className="size-4" aria-hidden="true" />
          작성란에 넣기
        </Button>
      </div>
      {copyError ? <p role="alert" className="text-xs text-red-600 dark:text-red-400">{copyError}</p> : null}
      <span className="sr-only" role="status">{copied ? "초안을 복사했습니다." : ""}</span>
      {!canUseDraft && disabledReason ? (
        <p className="text-xs text-muted-foreground">
          {disabledReason}
        </p>
      ) : null}
    </div>
  );
}
