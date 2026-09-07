export type ReplyDraft = { content: string; source: "manual" | "ai_draft"; savedAt: number };
const maxAge = 7 * 24 * 60 * 60 * 1000;
export function replyDraftKey(accountId: string, ticketId: string, internal: boolean) {
  return `supportflow:reply-draft:v1:${accountId}:${ticketId}:${internal ? "internal" : "public"}`;
}
export function parseReplyDraft(raw: string | null, now = Date.now()): ReplyDraft | null {
  if (!raw) return null;
  try {
    const draft: unknown = JSON.parse(raw);
    if (!draft || typeof draft !== "object" || !("content" in draft) || !("source" in draft) || !("savedAt" in draft)) return null;
    const { content, source, savedAt } = draft;
    if (typeof content !== "string" || content.length > 4000 || !content.trim() ||
      (source !== "manual" && source !== "ai_draft") || typeof savedAt !== "number" ||
      !Number.isFinite(savedAt) || savedAt > now || now - savedAt > maxAge) return null;
    return { content, source, savedAt };
  } catch { return null; }
}
