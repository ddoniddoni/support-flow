"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const polling = {
  refetchInterval: 15000,
  refetchOnWindowFocus: true,
  staleTime: 5000,
};
export type NotificationItem = {
  id: number;
  ticket_id: string;
  kind: string;
  read_at: string | null;
  created_at: string;
  response_due_at: string | null;
  ticket: { title: string; ticket_number: number } | null;
};
export function useNotifications(profileId: string) {
  return useQuery({
    queryKey: ["notifications", profileId, "feed"],
    ...polling,
    queryFn: async () => {
      const db = createSupabaseBrowserClient();
      const [feed, count] = await Promise.all([
        db
          .from("support_notifications")
          .select(
            "id,ticket_id,kind,read_at,created_at,response_due_at,ticket:tickets(title,ticket_number)",
          )
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(50),
        db
          .from("support_notifications")
          .select("id", { head: true, count: "exact" })
          .is("read_at", null),
      ]);
      if (feed.error) throw feed.error;
      if (count.error) throw count.error;
      return {
        items: feed.data as NotificationItem[],
        unread: count.count ?? 0,
      };
    },
  });
}
export function useUnreadTickets(profileId: string, ticketIds: string[]) {
  return useQuery({
    queryKey: ["notifications", profileId, "tickets", ticketIds],
    enabled: ticketIds.length > 0,
    ...polling,
    queryFn: async () => {
      const { data, error } = await createSupabaseBrowserClient().rpc(
        "unread_ticket_notifications",
        { p_ticket_ids: ticketIds },
      );
      if (error) throw error;
      return new Map(
        (data ?? []).map((row) => [row.ticket_id, row.unread_count]),
      );
    },
  });
}
export function useReadNotifications() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: { ticketId: string; replyOrder: number } | { ids: number[] },
    ) => {
      const db = createSupabaseBrowserClient();
      const result =
        "ids" in input
          ? await db
              .from("support_notifications")
              .update({ read_at: new Date().toISOString() })
              .in("id", input.ids)
              .is("read_at", null)
          : await db.rpc("read_ticket_notifications", {
              p_ticket_id: input.ticketId,
              p_reply_order: input.replyOrder,
            });
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
