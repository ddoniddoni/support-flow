import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createTicketReply,
  type CreateTicketReplyInput,
} from "../api/tickets-api";

export function useCreateTicketReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTicketReply,
    onSuccess: async (_data, input: CreateTicketReplyInput) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({
          queryKey: ["ticket", input.ticketId],
        }),
        queryClient.invalidateQueries({ queryKey: ["tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["agent-management"] }),
      ]);
      await queryClient.refetchQueries({
        queryKey: ["ticket", input.ticketId],
      });
    },
  });
}
