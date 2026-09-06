import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  analyzeTicket,
  type AnalyzeTicketInput,
} from "../api/analyze-ticket";

export function useAnalyzeTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyzeTicket,
    onSuccess: async (_analysis, input: AnalyzeTicketInput) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ticket-ai-analysis", input.ticketId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ticket", input.ticketId],
        }),
        queryClient.invalidateQueries({ queryKey: ["tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["ai-review-queue"] }),
        queryClient.invalidateQueries({ queryKey: ["ai-dashboard-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["agent-management"] }),
      ]);
    },
  });
}
