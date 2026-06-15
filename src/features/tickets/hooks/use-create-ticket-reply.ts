import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createTicketReply,
  type CreateTicketReplyInput,
} from "../api/tickets-api";

export function useCreateTicketReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTicketReply,
    onSuccess: (_data, input: CreateTicketReplyInput) => {
      void queryClient.invalidateQueries({
        queryKey: ["ticket", input.ticketId],
      });
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
