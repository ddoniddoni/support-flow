import { useQuery } from "@tanstack/react-query";

import type { Tables } from "@/types/database";

import { getAgentManagement } from "../api/agent-management-api";

export function useAgentManagement({
  profile,
}: {
  profile: Pick<Tables<"profiles">, "id" | "role">;
}) {
  return useQuery({
    queryKey: ["agent-management", profile.id, profile.role],
    queryFn: () => getAgentManagement({ profile }),
  });
}
