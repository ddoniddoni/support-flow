import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { TicketActionInput } from "../api/tickets-api";
import { updateTicketAction } from "../api/tickets-api";
import type { TicketDetailData } from "../types";

export function useUpdateTicketAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTicketAction,
    onMutate: async (input: TicketActionInput) => {
      const detailKey = [
        "ticket",
        input.ticketId,
        input.profile.id,
        input.profile.role,
      ];

      await queryClient.cancelQueries({ queryKey: detailKey });

      const previousDetail =
        queryClient.getQueryData<TicketDetailData>(detailKey);

      queryClient.setQueryData<TicketDetailData>(detailKey, (current) => {
        if (!current?.ticket) {
          return current;
        }

        return {
          ...current,
          ticket: {
            ...current.ticket,
            status: input.status ?? current.ticket.status,
            priority: input.priority ?? current.ticket.priority,
            assignee_id:
              input.assigneeId === undefined
                ? current.ticket.assignee_id
                : input.assigneeId,
          },
        };
      });

      return { detailKey, previousDetail };
    },
    onError: (_error, _input, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(context.detailKey, context.previousDetail);
      }
    },
    onSettled: (_data, _error, input) => {
      void queryClient.invalidateQueries({
        queryKey: ["ticket", input.ticketId],
      });
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["ai-review-queue"] });
      void queryClient.invalidateQueries({ queryKey: ["ai-dashboard-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["agent-management"] });
      void queryClient.invalidateQueries({ queryKey: ["ticket-ai-analysis", input.ticketId] });
    },
  });
}
