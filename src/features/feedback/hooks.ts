"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
export function useTicketFeedback(
  ticketId: string,
  replyId: string,
  profileId: string,
) {
  return useQuery({
    queryKey: ["ticket-feedback", ticketId, profileId, replyId],
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await createSupabaseBrowserClient()
        .from("ticket_feedback")
        .select("*")
        .eq("ticket_id", ticketId)
        .eq("reply_id", replyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
export function useSubmitFeedback() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      ticketId: string;
      replyId: string;
      helpful: boolean;
      comment: string;
    }) => {
      const { data, error } = await createSupabaseBrowserClient().rpc(
        "submit_ticket_feedback",
        {
          p_ticket_id: input.ticketId,
          p_reply_id: input.replyId,
          p_helpful: input.helpful,
          p_comment: input.comment,
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () =>
      Promise.all(
        [
          "ticket-feedback",
          "feedback",
          "ticket",
          "tickets",
          "notifications",
          "dashboard-stats",
          "agent-management",
          "ai-review-queue",
          "ai-dashboard-stats",
          "ticket-ai-analysis",
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      ),
  });
}
export function useFeedbackOverview(
  profileId: string,
  rating: string,
  page: number,
) {
  const stats = useQuery({
    queryKey: ["feedback", "stats", profileId],
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await createSupabaseBrowserClient().rpc(
        "support_feedback_stats",
        {},
      );
      if (error) throw error;
      return data as { total: number; helpful: number; unresolved: number };
    },
  });
  const list = useQuery({
    queryKey: ["feedback", "list", profileId, rating, page],
    refetchOnWindowFocus: true,
    queryFn: async () => {
      let query = createSupabaseBrowserClient()
        .from("ticket_feedback")
        .select(
          "*,ticket:tickets!ticket_feedback_ticket_id_fkey(title,ticket_number,status),customer:profiles!ticket_feedback_customer_id_fkey(name),responder:profiles!ticket_feedback_responder_id_fkey(name)",
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .order("id");
      if (rating !== "all") query = query.eq("helpful", rating === "helpful");
      const { data, error, count } = await query.range(
        (page - 1) * 20,
        page * 20 - 1,
      );
      if (error) throw error;
      return { items: data ?? [], total: count ?? 0 };
    },
  });
  return { stats, list };
}
