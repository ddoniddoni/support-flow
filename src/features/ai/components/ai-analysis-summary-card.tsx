import { Badge } from "@/components/ui/badge";
import type { TicketAIAnalysis } from "@/features/ai/types";
import { cn } from "@/lib/utils";
import type { AISentiment, AIUrgency, TicketPriority, TicketStatus } from "@/types/domain";

import { AIConfidenceBadge } from "./ai-confidence-badge";

const sentimentLabels: Record<AISentiment, string> = {
  positive: "긍정",
  neutral: "중립",
  negative: "부정",
};

const urgencyLabels: Record<AIUrgency, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  critical: "긴급 검토",
};

const priorityLabels: Record<TicketPriority, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
};

const statusLabels: Record<TicketStatus, string> = {
  open: "답변 대기",
  in_progress: "답변 대기",
  resolved: "답변 완료",
  closed: "종료",
};

function SentimentBadge({ sentiment }: { sentiment: AISentiment }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        sentiment === "negative" && "border-red-200 bg-red-50 text-red-700",
        sentiment === "neutral" && "border-border bg-muted/60 text-foreground",
        sentiment === "positive" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {sentimentLabels[sentiment]}
    </Badge>
  );
}

function UrgencyBadge({ urgency }: { urgency: AIUrgency }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        urgency === "critical" && "border-red-200 bg-red-50 text-red-700",
        urgency === "high" && "border-orange-200 bg-orange-50 text-orange-700",
        urgency === "medium" && "border-sky-200 bg-sky-50 text-sky-700",
        urgency === "low" && "border-border bg-muted/60 text-muted-foreground",
      )}
    >
      {urgencyLabels[urgency]}
    </Badge>
  );
}

export function AIAnalysisSummaryCard({
  analysis,
}: {
  analysis: TicketAIAnalysis;
}) {
  return (
    <div className="grid gap-4 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex flex-wrap gap-2">
        <SentimentBadge sentiment={analysis.sentiment} />
        <UrgencyBadge urgency={analysis.urgency} />
        <AIConfidenceBadge confidence={analysis.confidence} />
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.015625rem] text-muted-foreground">
          Summary
        </p>
        <p className="text-sm leading-6 text-foreground">{analysis.summary}</p>
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.015625rem] text-muted-foreground">
          Reason
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          {analysis.reason}
        </p>
      </div>

      <div className="grid gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Category</span>
          <span className="font-medium text-foreground">
            {analysis.category}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Intent</span>
          <span className="font-medium text-foreground">{analysis.intent}</span>
        </div>
        {analysis.suggested_priority ? (
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Suggested priority</span>
            <span className="font-medium text-foreground">
              {priorityLabels[analysis.suggested_priority]}
            </span>
          </div>
        ) : null}
        {analysis.suggested_status ? (
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Suggested status</span>
            <span className="font-medium text-foreground">
              {statusLabels[analysis.suggested_status]}
            </span>
          </div>
        ) : null}
      </div>

      {analysis.tags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {analysis.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
