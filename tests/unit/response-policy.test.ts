import assert from "node:assert/strict";
import test from "node:test";
import {
  policyInput,
  policyPayload,
  responsePolicySchema,
  type ResponsePolicy,
} from "../../src/features/response-policy/schema";
import { getResponseTarget } from "../../src/features/tickets/utils/response-target";
import { parseReplyDraft } from "../../src/features/tickets/utils/reply-draft-storage";
const policy: ResponsePolicy = {
  id: "policy",
  calendar: {
    mode: "business",
    timeZone: "Asia/Seoul",
    days: [1, 2, 3, 4, 5].map((day) => ({ day, start: "09:00", end: "18:00" })),
    holidays: [],
  },
  targets: { urgent: 60, high: 120, medium: 240, low: 480 },
  warning_minutes: 15,
  created_at: "2026-09-07T00:00:00Z",
  created_by: null,
  alerts_enabled: true,
};
test("policy form validates real dates, open intervals and priority ordering", () => {
  const input = policyInput(policy, true);
  assert(responsePolicySchema.safeParse(input).success);
  assert(
    !responsePolicySchema.safeParse({ ...input, holidays: "2026-02-30" })
      .success,
  );
  assert(
    !responsePolicySchema.safeParse({
      ...input,
      days: input.days.map((day) => ({ ...day, enabled: false })),
    }).success,
  );
  assert(!responsePolicySchema.safeParse({ ...input, urgent: 10 }).success);
  assert(
    !responsePolicySchema.safeParse({ ...input, warningMinutes: 60 }).success,
  );
  assert(
    !responsePolicySchema.safeParse({
      ...input,
      days: input.days.map((day) => ({ ...day, start: "18:00", end: "09:00" })),
    }).success,
  );
  const calendarInput = {
    ...input,
    mode: "calendar" as const,
    holidays: "not-a-date",
    days: input.days.map((day) => ({
      ...day,
      enabled: false,
      start: "",
      end: "",
    })),
  };
  assert(responsePolicySchema.safeParse(calendarInput).success);
  assert.deepEqual(
    policyPayload(calendarInput, policy.calendar).calendar.days,
    policy.calendar.days,
  );
  const payload = policyPayload({
    ...input,
    holidays: "2026-12-25\n2026-12-25\n2026-09-25",
  });
  assert.deepEqual(payload.calendar.holidays, ["2026-09-25", "2026-12-25"]);
  assert.equal(payload.targets.urgent, 60);
});
test("business countdown uses server business minutes and saved deadlines, not overnight wall time", () => {
  const ticket = {
    status: "open" as const,
    priority: "medium" as const,
    created_at: "2026-09-04T08:00:00Z",
    response_due_at: "2026-09-07T01:00:00Z",
    response_warning_at: "2026-09-07T00:45:00Z",
    response_calendar: policy.calendar,
    response_target_minutes: 120,
    response_remaining_minutes: 60,
  };
  assert.equal(
    getResponseTarget(ticket, Date.parse("2026-09-05T00:00:00Z")).label,
    "1시간 남음",
  );
  assert.equal(
    getResponseTarget(ticket, Date.parse("2026-09-06T12:00:00Z")).label,
    "1시간 남음",
  );
  assert.equal(
    getResponseTarget(
      { ...ticket, response_remaining_minutes: -15 },
      Date.parse("2026-09-07T01:15:00Z"),
    ).label,
    "1일 미만 초과",
  );
  assert.equal(
    getResponseTarget({ ...ticket, response_due_at: null }).label,
    "시간 확인 필요",
  );
});
test("restored reply drafts retain the reviewed conversation and require review for legacy drafts", () => {
  const draft = {
    content: "작성 중인 답변",
    source: "manual",
    savedAt: 1000,
    expectedReplyOrder: 42,
  };
  assert.equal(
    parseReplyDraft(JSON.stringify(draft), 2000)?.expectedReplyOrder,
    42,
  );
  assert.equal(
    parseReplyDraft(JSON.stringify({ ...draft, expectedReplyOrder: -1 }), 2000)
      ?.expectedReplyOrder,
    null,
  );
  assert.equal(
    parseReplyDraft(
      JSON.stringify({ ...draft, expectedReplyOrder: undefined }),
      2000,
    )?.expectedReplyOrder,
    null,
  );
});
