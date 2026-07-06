import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

const envPath = resolve(process.cwd(), ".env.local");

function loadLocalEnv() {
  try {
    const env = readFileSync(envPath, "utf8");

    for (const line of env.split("\n")) {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmedLine.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmedLine.slice(0, separatorIndex);
      const rawValue = trimmedLine.slice(separatorIndex + 1);
      const value = rawValue.replace(/^["']|["']$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // The script also works when variables are provided by the shell.
  }
}

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const categoryLabels = {
  technical: "기술 지원",
  billing: "결제",
  account: "계정",
  product: "제품",
  shipping: "배송",
  refund: "환불",
  complaint: "불만",
  other: "기타",
};

const intentLabels = {
  question: "일반 문의",
  complaint: "불만 접수",
  refund_request: "환불 요청",
  bug_report: "오류 신고",
  account_help: "계정 지원",
  billing_issue: "결제 문제",
  cancellation_request: "해지 요청",
  feature_request: "기능 요청",
  praise: "칭찬",
  other: "기타 요청",
};

const sentimentLabels = {
  positive: "긍정",
  neutral: "중립",
  negative: "부정",
};

const urgencyLabels = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  critical: "긴급 검토",
};

const tagLabels = {
  technical: "기술 지원",
  billing: "결제",
  account: "계정",
  product: "제품",
  shipping: "배송",
  refund: "환불",
  complaint: "불만",
  other: "기타",
  question: "일반 문의",
  refund_request: "환불 요청",
  bug_report: "오류 신고",
  account_help: "계정 지원",
  billing_issue: "결제 문제",
  cancellation_request: "해지 요청",
  feature_request: "기능 요청",
  praise: "칭찬",
  "priority-review": "검토 필요",
  "needs-human-review": "검토 필요",
  "vip-customer": "VIP",
  "repeat-contact": "반복 문의",
};

function label(map, value, fallback) {
  return map[value] ?? fallback;
}

function buildSummary(analysis) {
  const category = label(categoryLabels, analysis.category, "기타");
  const intent = label(intentLabels, analysis.intent, "기타 요청");
  const sentiment = label(sentimentLabels, analysis.sentiment, "중립");
  const urgency = label(urgencyLabels, analysis.urgency, "보통");
  const title = analysis.ticket?.title ?? "접수된 문의";

  return `${title} 문의는 ${category} 영역의 ${intent}로 분류됩니다. 감정은 ${sentiment}, 긴급도는 ${urgency}입니다.`;
}

function buildReason(analysis) {
  const category = label(categoryLabels, analysis.category, "기타");
  const intent = label(intentLabels, analysis.intent, "기타 요청");
  const sentiment = label(sentimentLabels, analysis.sentiment, "중립");
  const urgency = label(urgencyLabels, analysis.urgency, "보통");
  const confidence = Math.round(Number(analysis.confidence ?? 0) * 100);

  return `${category} 관련 표현과 ${intent} 의도가 함께 감지되었습니다. 고객 감정은 ${sentiment}, 처리 긴급도는 ${urgency}로 판단했으며 신뢰도는 ${confidence}%입니다.`;
}

function buildReplyDraft(analysis) {
  const category = label(categoryLabels, analysis.category, "기타");

  if (analysis.sentiment === "negative") {
    return `문의 주셔서 감사합니다. 이용 중 불편을 겪으신 점 먼저 확인했습니다. ${category} 관련 내용을 우선 검토한 뒤, 확인되는 원인과 다음 조치 방법을 바로 안내드리겠습니다.`;
  }

  return `문의 주셔서 감사합니다. 남겨주신 내용을 확인했으며, ${category} 담당 기준에 따라 필요한 정보를 검토해 다음 단계로 안내드리겠습니다.`;
}

function buildEscalationReason(analysis) {
  if (!analysis.needs_review) {
    return null;
  }

  if (analysis.urgency === "critical") {
    return "긴급 검토가 필요한 문의로 감지되었습니다.";
  }

  if (Number(analysis.confidence ?? 0) < 0.7) {
    return "AI 분석 신뢰도가 낮아 상담원 확인이 필요합니다.";
  }

  return "상담원 확인이 필요한 문의로 분류되었습니다.";
}

function buildTags(analysis) {
  const tags = Array.isArray(analysis.tags) ? analysis.tags : [];
  const translatedTags = tags.map((tag) => tagLabels[tag] ?? tag);
  const defaultTags = [
    label(categoryLabels, analysis.category, "기타"),
    label(intentLabels, analysis.intent, "기타 요청"),
  ];

  if (analysis.needs_review) {
    defaultTags.push("검토 필요");
  }

  return Array.from(new Set([...translatedTags, ...defaultTags])).slice(0, 8);
}

function getSuggestedAssigneeRole(analysis) {
  if (analysis.category === "billing" || analysis.category === "refund") {
    return "결제 담당자";
  }

  return "지원 담당자";
}

async function main() {
  const { data: analyses, error } = await supabase
    .from("ticket_ai_analyses")
    .select(
      "id,ticket_id,category,sentiment,urgency,intent,tags,confidence,needs_review,ticket:tickets!ticket_ai_analyses_ticket_id_fkey(title)",
    );

  if (error) {
    throw error;
  }

  let updatedCount = 0;

  for (const analysis of analyses ?? []) {
    const { error: updateError } = await supabase
      .from("ticket_ai_analyses")
      .update({
        summary: buildSummary(analysis),
        reason: buildReason(analysis),
        reply_draft: buildReplyDraft(analysis),
        escalation_reason: buildEscalationReason(analysis),
        tags: buildTags(analysis),
        suggested_assignee_role: getSuggestedAssigneeRole(analysis),
      })
      .eq("id", analysis.id);

    if (updateError) {
      throw updateError;
    }

    updatedCount += 1;
  }

  const { data: remainingRows, error: verifyError } = await supabase
    .from("ticket_ai_analyses")
    .select("id,summary,reason,reply_draft,escalation_reason");

  if (verifyError) {
    throw verifyError;
  }

  const englishDraftPattern =
    /thank you|flagging this|frustrating|recommend the next step|review the account/i;
  const remainingEnglishDrafts = (remainingRows ?? []).filter((analysis) =>
    [
      analysis.summary,
      analysis.reason,
      analysis.reply_draft,
      analysis.escalation_reason,
    ].some(
      (value) =>
        typeof value === "string" && englishDraftPattern.test(value),
    ),
  );

  console.log(`AI analysis Korean backfill completed: ${updatedCount} rows`);
  console.log(
    `Remaining English draft-like rows: ${remainingEnglishDrafts.length}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
