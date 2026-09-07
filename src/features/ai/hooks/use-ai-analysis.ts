import { useQuery } from "@tanstack/react-query";

import type { Tables } from "@/types/database";

import { getLatestTicketAIAnalysis } from "../api/analyze-ticket";

type UseAIAnalysisParams = {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
};

export function useAIAnalysis({ ticketId, profile }: UseAIAnalysisParams) {
  return useQuery({
    queryKey: ["ticket-ai-analysis", ticketId, profile.id, profile.role],
    queryFn: () => getLatestTicketAIAnalysis({ ticketId, profile }),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    enabled: profile.role !== "customer",
  });
}
