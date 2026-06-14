import { useQuery } from "@tanstack/react-query";

import type { Tables } from "@/types/database";

import { getTicketDetail } from "../api/tickets-api";

type UseTicketParams = {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
};

export function useTicket({ ticketId, profile }: UseTicketParams) {
  return useQuery({
    queryKey: ["ticket", ticketId, profile.id, profile.role],
    queryFn: () => getTicketDetail({ ticketId, profile }),
  });
}
