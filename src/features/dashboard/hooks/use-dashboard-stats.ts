import { useQuery } from "@tanstack/react-query";

import type { Tables } from "@/types/database";

import { getDashboardStats } from "../api/dashboard-api";

type UseDashboardStatsParams = {
  profile: Pick<Tables<"profiles">, "id" | "role">;
};

export function useDashboardStats({ profile }: UseDashboardStatsParams) {
  return useQuery({
    queryKey: ["dashboard-stats", profile.id, profile.role],
    queryFn: () => getDashboardStats(profile),
  });
}
