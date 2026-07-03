import { useQuery } from "@tanstack/react-query";

import type { Tables } from "@/types/database";

import { getAIDashboardStats } from "../api/get-ai-dashboard-stats";

type UseAIDashboardStatsParams = {
  profile: Pick<Tables<"profiles">, "id" | "role">;
};

export function useAIDashboardStats({ profile }: UseAIDashboardStatsParams) {
  return useQuery({
    queryKey: ["ai-dashboard-stats", profile.id, profile.role],
    queryFn: () => getAIDashboardStats(profile),
    enabled: profile.role !== "customer",
  });
}
