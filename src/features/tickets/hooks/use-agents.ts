import { useQuery } from "@tanstack/react-query";

import { listAssignableAgents } from "../api/tickets-api";

export function useAgents(enabled: boolean) {
  return useQuery({
    queryKey: ["agents"],
    queryFn: listAssignableAgents,
    enabled,
  });
}
