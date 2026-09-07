"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
type Collaboration = {
  latestReplyOrder: number;
  participants: { actorId: string; name: string; sessionId: string }[];
};
export function useReplyCollaboration({
  ticketId,
  profileId,
  enabled,
  typing,
}: {
  ticketId: string;
  profileId: string;
  enabled: boolean;
  typing: boolean;
}) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const refresh = () => setVisible(document.visibilityState === "visible");
    refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);
  const active = typing && visible;
  const query = useQuery({
    queryKey: ["reply-collaboration", ticketId, profileId, sessionId],
    enabled,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await createSupabaseBrowserClient().rpc(
        "reply_collaboration",
        { p_ticket_id: ticketId, p_session_id: sessionId, p_typing: active },
      );
      if (error) throw error;
      return data as unknown as Collaboration;
    },
  });
  const refetch = query.refetch;
  useEffect(() => {
    if (enabled) void refetch();
  }, [active, enabled, refetch]);
  useEffect(() => {
    if (!enabled) return;
    return () => {
      void createSupabaseBrowserClient()
        .rpc("reply_collaboration", {
          p_ticket_id: ticketId,
          p_session_id: sessionId,
          p_typing: false,
        })
        .then(() => {});
    };
  }, [enabled, ticketId, sessionId]);
  return query;
}
