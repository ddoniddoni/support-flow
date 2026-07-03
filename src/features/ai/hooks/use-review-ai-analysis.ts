import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  reviewAIAnalysis,
  sendAIAnalysisToReview,
  type ReviewAIAnalysisInput,
  type SendAIAnalysisToReviewInput,
} from "../api/review-ai-analysis";

function useInvalidateAIAnalysisQueries() {
  const queryClient = useQueryClient();

  return async (ticketId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["ticket-ai-analysis", ticketId],
      }),
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] }),
      queryClient.invalidateQueries({ queryKey: ["tickets"] }),
      queryClient.invalidateQueries({ queryKey: ["ai-review-queue"] }),
      queryClient.invalidateQueries({ queryKey: ["ai-dashboard-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
    ]);
  };
}

export function useReviewAIAnalysis() {
  const invalidateQueries = useInvalidateAIAnalysisQueries();

  return useMutation({
    mutationFn: reviewAIAnalysis,
    onSuccess: async (_analysis, input: ReviewAIAnalysisInput) => {
      await invalidateQueries(input.ticketId);
    },
  });
}

export function useSendAIAnalysisToReview() {
  const invalidateQueries = useInvalidateAIAnalysisQueries();

  return useMutation({
    mutationFn: sendAIAnalysisToReview,
    onSuccess: async (_analysis, input: SendAIAnalysisToReviewInput) => {
      await invalidateQueries(input.ticketId);
    },
  });
}
