import assert from "node:assert/strict";
import test from "node:test";
import { buildConversationContext, isAnalysisOutdated } from "../../src/features/ai/utils/conversation-context";
import { createMockAIProvider } from "../../src/features/ai/providers/mock-ai-provider";
import { parseReplyDraft, replyDraftKey } from "../../src/features/tickets/utils/reply-draft-storage";

test("latest customer request drives mock classification after a staff response", async () => {
  const conversation = [
    { content: "환불 부탁드립니다. payment refund", author_role: "customer" as const, reply_order: 1 },
    { content: "계정 비밀번호 설정을 안내드립니다.", author_role: "agent" as const, reply_order: 2 },
  ];
  const result = await createMockAIProvider().analyzeTicket({ ticket: { id: "test", title: "계정 문의", content: "비밀번호 변경", category: "account", priority: "medium", status: "open" }, conversation, promptVersion: null });
  assert.match(JSON.stringify(result.output), /refund/);
  assert.match(JSON.stringify(result.output), /최근 고객 메시지/);
  const context = buildConversationContext("최초 내용", conversation);
  assert(context.indexOf("고객: 환불") < context.indexOf("지원팀:"));
  assert.equal(isAnalysisOutdated(1, 2), true);
  assert.equal(isAnalysisOutdated(2, 2), false);
  assert.equal(isAnalysisOutdated(undefined, 1), true);
});

test("draft keys isolate account, ticket and public/internal destination", () => {
  const keys = [replyDraftKey("a", "t", false), replyDraftKey("b", "t", false), replyDraftKey("a", "u", false), replyDraftKey("a", "t", true)];
  assert.equal(new Set(keys).size, 4);
});

test("draft recovery rejects expired, corrupt and oversized data and preserves AI provenance", () => {
  const draft = { content: "작성 중 답변", source: "ai_draft", savedAt: 1000 };
  assert.deepEqual(parseReplyDraft(JSON.stringify(draft), 2000), { ...draft, expectedReplyOrder: null });
  assert.equal(parseReplyDraft(JSON.stringify(draft), 8 * 86400000), null);
  assert.equal(parseReplyDraft("{broken"), null);
  assert.equal(parseReplyDraft(JSON.stringify({ ...draft, content: "x".repeat(4001) }), 2000), null);
  assert.equal(parseReplyDraft(JSON.stringify({ ...draft, source: "unknown" }), 2000), null);
});
