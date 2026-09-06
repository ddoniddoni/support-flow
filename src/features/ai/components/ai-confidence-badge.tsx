import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AIConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);

  return (
    <Badge
      variant="outline"
      className={cn(
        confidence < 0.7 && "border-red-200 bg-red-50 text-red-700",
        confidence >= 0.7 &&
          confidence < 0.85 &&
          "border-amber-200 bg-amber-50 text-amber-700",
        confidence >= 0.85 &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      신뢰도 {percentage}%
    </Badge>
  );
}
