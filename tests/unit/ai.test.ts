import assert from "node:assert/strict";
import { test } from "node:test";
import { createMockAIProvider } from "@/features/ai/providers/mock-ai-provider";
import { ticketAIAnalysisSchema } from "@/features/ai/schemas/ticket-ai-analysis-schema";
import { applyAIReviewRules, getAIConfidenceReviewThreshold } from "@/features/ai/utils/ai-review-rules";

import { validateAIProviderResult } from "@/features/ai/utils/validate-ai-provider-result";

const ticket = { id: "test", title: "결제 확인 부탁드립니다", content: "이번 달 결제 내역과 영수증을 확인하고 싶습니다.", category: "billing", priority: "medium" as const, status: "open" as const };

test("mock provider is deterministic and produces valid Korean output", async () => {
  const provider = createMockAIProvider();
  const input = { ticket, promptVersion: null };
  const first = await provider.analyzeTicket(input);
  assert.deepEqual(first, await provider.analyzeTicket(input));
  const output = ticketAIAnalysisSchema.parse(first.output);
  assert.equal(output.category, "billing");
  assert.match(output.summary, /[가-힣]/);
});

test("empty or invalid review threshold defaults to 0.7, explicit zero is retained", () => {
  const previous = process.env.AI_CONFIDENCE_REVIEW_THRESHOLD;
  try {
    for (const value of ["", " ", "invalid", "-1", "1.1"]) {
      process.env.AI_CONFIDENCE_REVIEW_THRESHOLD = value;
      assert.equal(getAIConfidenceReviewThreshold(), 0.7);
    }
    delete process.env.AI_CONFIDENCE_REVIEW_THRESHOLD;
    assert.equal(getAIConfidenceReviewThreshold(), 0.7);
    process.env.AI_CONFIDENCE_REVIEW_THRESHOLD = "0";
    assert.equal(getAIConfidenceReviewThreshold(), 0);
    process.env.AI_CONFIDENCE_REVIEW_THRESHOLD = "0.9";
    assert.equal(getAIConfidenceReviewThreshold(), 0.9);
  } finally {
    if (previous === undefined) delete process.env.AI_CONFIDENCE_REVIEW_THRESHOLD;
    else process.env.AI_CONFIDENCE_REVIEW_THRESHOLD = previous;
  }
});

test("high-confidence refund, security and legal cases still require review", async () => {
  const { output } = await createMockAIProvider().analyzeTicket({ ticket, promptVersion: null });
  const base = { ...ticketAIAnalysisSchema.parse(output), confidence: 1, needsReview: false };
  for (const content of ["환불 요청", "개인정보 유출", "legal threat", "payment dispute", "계속 안 됩니다"]) {
    const result = applyAIReviewRules({ analysis: base, ticket: { title: "문의", content }, validationFailed: false });
    assert.equal(result.needsReview, true, content);
    ticketAIAnalysisSchema.parse(result);
  }
});

test("malformed or out-of-range AI output is rejected before persistence", async () => {
  const { output } = await createMockAIProvider().analyzeTicket({ ticket, promptVersion: null });
  const base = ticketAIAnalysisSchema.parse(output);
  for (const invalid of ["not JSON", null, { ...base, confidence: 2 }, { ...base, summary: "" }, { ...base, tags: Array(9).fill("tag") }]) {
    assert.equal(ticketAIAnalysisSchema.safeParse(invalid).success, false);
  }
  assert.equal(applyAIReviewRules({ analysis: base, ticket, validationFailed: true }).needsReview, true);
});

test("malformed provider JSON yields a validated fallback requiring human review", () => {
  for (const output of ['{"broken":', { confidence: 2 }, null]) {
    const result = validateAIProviderResult({ output, rawResponse: output, ticket: { ...ticket, latest_ai_analysis_id: null } });
    assert.equal(result.validationStatus, "fallback");
    const fallback = ticketAIAnalysisSchema.parse(result.output);
    assert.equal(fallback.confidence, 0);
    assert.equal(fallback.needsReview, true);
    assert.equal(fallback.replyDraft, null);
  }
});
