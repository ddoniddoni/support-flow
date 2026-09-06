import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { z } from "zod";

const resultSchema = z.object({ changed: z.number().int().nonnegative(), unchanged: z.number().int().nonnegative() });
export function useBulkAssignTickets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketIds, assigneeId }: { ticketIds: string[]; assigneeId: string }) => {
      const { data, error } = await createSupabaseBrowserClient().rpc("bulk_assign_tickets", { p_ticket_ids: ticketIds, p_assignee_id: assigneeId });
      if (error) throw new Error(["42501", "22023", "P0002"].includes(error.code) ? error.message : "일괄 배정 결과를 확인하지 못했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.");
      return resultSchema.parse(data);
    },
    onSuccess: async () => {
      await Promise.all(["tickets", "ticket", "agent-management", "dashboard-stats", "ai-dashboard-stats", "ai-review-queue", "ticket-ai-analysis"].map(key => queryClient.invalidateQueries({ queryKey: [key] })));
    },
  });
}
