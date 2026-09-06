import { useQuery } from "@tanstack/react-query";

import type { Tables } from "@/types/database";

import { listTickets, type TicketListFilters } from "../api/tickets-api";

type UseTicketsParams = {
  profile: Pick<Tables<"profiles">, "id" | "role">;
  filters: TicketListFilters;
};

export function useTickets({ profile, filters }: UseTicketsParams) {
  return useQuery({
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    queryKey: ["tickets", profile.id, profile.role, filters],
    queryFn: () => listTickets({ profile, filters }),
  });
}
