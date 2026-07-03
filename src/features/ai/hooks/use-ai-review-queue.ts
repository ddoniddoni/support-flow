import { useQuery } from "@tanstack/react-query";

import type { Tables } from "@/types/database";

import {
  listAIReviewQueue,
  type AIReviewQueueFilters,
} from "../api/get-ai-review-queue";

type UseAIReviewQueueParams = {
  profile: Pick<Tables<"profiles">, "id" | "role">;
  filters: AIReviewQueueFilters;
};

export function useAIReviewQueue({
  profile,
  filters,
}: UseAIReviewQueueParams) {
  return useQuery({
    queryKey: ["ai-review-queue", profile.id, profile.role, filters],
    queryFn: () => listAIReviewQueue({ profile, filters }),
    enabled: profile.role !== "customer",
  });
}
