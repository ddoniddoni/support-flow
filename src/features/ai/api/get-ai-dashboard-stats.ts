import { collectPages } from "@/lib/data/pagination";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Tables } from "@/types/database";
import {
  aiCategories,
  type AICategory,
  type AISentiment,
  type AIUrgency,
} from "@/types/domain";

type SupportProfile = Pick<Tables<"profiles">, "id" | "role">;

export type AIDashboardCategoryItem = {
  key: AICategory;
  label: string;
  count: number;
  percentage: number;
};

export type AIDashboardStats = {
  totalAnalyses: number;
  reviewRequiredCount: number;
  negativeSentimentCount: number;
  highUrgencyCount: number;
  averageConfidence: number | null;
  analysesThisWeek: number;
  topCategories: AIDashboardCategoryItem[];
};

type AIStatsAnalysis = Pick<
  Tables<"ticket_ai_analyses">,
  "category" | "sentiment" | "urgency" | "confidence" | "needs_review" | "created_at"
>;

const categoryLabels: Record<AICategory, string> = {
  technical: "기술",
  billing: "결제",
  account: "계정",
  product: "제품",
  shipping: "배송",
  refund: "환불",
  complaint: "불만",
  other: "기타",
};

function getWeekStart() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildCategoryDistribution(analyses: AIStatsAnalysis[]) {
  const total = analyses.length;

  return aiCategories
    .map((category) => {
      const count = analyses.filter(
        (analysis) => analysis.category === category,
      ).length;

      return {
        key: category,
        label: categoryLabels[category],
        count,
        percentage: total ? Math.round((count / total) * 100) : 0,
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
}

function getAverageConfidence(analyses: AIStatsAnalysis[]) {
  if (!analyses.length) {
    return null;
  }

  const total = analyses.reduce(
    (sum, analysis) => sum + Number(analysis.confidence),
    0,
  );

  return Number((total / analyses.length).toFixed(2));
}

export async function getAIDashboardStats(
  profile: SupportProfile,
): Promise<AIDashboardStats> {
  if (profile.role === "customer") {
    return {
      totalAnalyses: 0,
      reviewRequiredCount: 0,
      negativeSentimentCount: 0,
      highUrgencyCount: 0,
      averageConfidence: null,
      analysesThisWeek: 0,
      topCategories: [],
    };
  }

  const supabase = createSupabaseBrowserClient();
  const weekStart = getWeekStart();
  const [tickets, countResult] = await Promise.all([
    collectPages((from, to) => supabase.from("ticket_workspace").select("ai_analysis")
      .order("id", { ascending: true }).range(from, to)),
    supabase.from("ticket_ai_analyses").select("id", { count: "exact", head: true })
      .gte("created_at", weekStart.toISOString()),
  ]);
  if (countResult.error) throw countResult.error;
  const analyses: AIStatsAnalysis[] = tickets.flatMap(ticket => ticket.ai_analysis && ticket.ai_analysis.review_decision !== "rejected" ? [ticket.ai_analysis] : []);
  const highUrgencies: AIUrgency[] = ["high", "critical"];
  const negativeSentiment: AISentiment = "negative";

  return {
    totalAnalyses: analyses.length,
    reviewRequiredCount: analyses.filter((analysis) => analysis.needs_review)
      .length,
    negativeSentimentCount: analyses.filter(
      (analysis) => analysis.sentiment === negativeSentiment,
    ).length,
    highUrgencyCount: analyses.filter((analysis) =>
      highUrgencies.includes(analysis.urgency),
    ).length,
    averageConfidence: getAverageConfidence(analyses),
    analysesThisWeek: countResult.count ?? 0,
    topCategories: buildCategoryDistribution(analyses),
  };
}
