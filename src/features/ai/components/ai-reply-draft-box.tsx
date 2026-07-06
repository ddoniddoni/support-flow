import { Check, Clipboard, Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AIReplyDraftBox({
  draft,
  canUseDraft,
  onUseDraft,
}: {
  draft: string | null;
  canUseDraft: boolean;
  onUseDraft: (draft: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!draft) {
    return (
      <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
        AI가 고객 답변 초안을 만들지 않았습니다.
      </div>
    );
  }

  async function copyDraft() {
    await navigator.clipboard.writeText(draft ?? "");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-background p-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.015625rem] text-muted-foreground">
          답변 초안
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
          {draft}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
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
          disabled={!canUseDraft}
          onClick={() => onUseDraft(draft)}
        >
          <Send className="size-4" aria-hidden="true" />
          답변에 사용
        </Button>
      </div>
      {!canUseDraft ? (
        <p className="text-xs text-muted-foreground">
          이미 공개 답변이 등록된 문의에는 초안을 다시 넣지 않습니다.
        </p>
      ) : null}
    </div>
  );
}
