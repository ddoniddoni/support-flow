import type { Tables } from "@/types/database";

type Message = Pick<Tables<"ticket_replies">, "content" | "author_role" | "reply_order">;

/** Bounded public conversation, ordered oldest to newest; never include internal notes. */
export function buildConversationContext(original: string, messages: Message[]) {
  return [
    `최초 고객 문의: ${original}`,
    ...messages.map(message => `${message.author_role === "customer" ? "고객" : "지원팀"}: ${message.content}`),
  ].join("\n\n");
}

export function isAnalysisOutdated(sourceReplyOrder: number | undefined, latestReplyOrder: number) {
  return (sourceReplyOrder ?? 0) < latestReplyOrder;
}
