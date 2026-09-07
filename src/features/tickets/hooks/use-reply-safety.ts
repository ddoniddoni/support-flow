"use client";
import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/types/database";
import { getTicketDetail } from "../api/tickets-api";
import type { TicketReplyItem } from "../types";
import { useReplyCollaboration } from "./use-reply-collaboration";
import { messageOf } from "@/lib/error-message";
export function useReplySafety({
  ticketId,
  profile,
  latestReplyOrder,
  enabled,
  hasDraft,
  typing,
}: {
  ticketId: string;
  profile: Pick<Tables<"profiles">, "id" | "role">;
  latestReplyOrder: number;
  enabled: boolean;
  hasDraft: boolean;
  typing: boolean;
}) {
  const client = useQueryClient();
  const conversationRef = useRef<number | null>(latestReplyOrder);
  const [reviewedOrder, setReviewedOrder] = useState<number | null>(
    latestReplyOrder,
  );
  const [forced, setForced] = useState(false);
  const [review, setReview] = useState<{
    order: number;
    replies: TicketReplyItem[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const collaboration = useReplyCollaboration({
    ticketId,
    profileId: profile.id,
    enabled,
    typing,
  });
  const latest = Math.max(
    latestReplyOrder,
    collaboration.data?.latestReplyOrder ?? 0,
  );
  const accept = useCallback((version: number | null) => {
    conversationRef.current = version;
    setReviewedOrder(version);
    setForced(false);
  }, []);
  const conflict =
    enabled &&
    hasDraft &&
    (forced || reviewedOrder === null || latest > reviewedOrder);
  async function loadReview(checkAlreadySent: () => Promise<boolean>) {
    setLoading(true);
    setError("");
    try {
      if (await checkAlreadySent()) return;
      const data = await client.fetchQuery({
        queryKey: ["ticket", ticketId, profile.id, profile.role],
        queryFn: () => getTicketDetail({ ticketId, profile }),
        staleTime: 0,
      });
      if (!data.ticket)
        throw new Error(
          "문의를 더 이상 열 수 없습니다. 작성 내용은 보존됩니다.",
        );
      const order = Math.max(
        0,
        ...data.replies.map((reply) => reply.reply_order),
      );
      setReview({
        order,
        replies: data.replies
          .filter(
            (reply) =>
              reviewedOrder === null || reply.reply_order > reviewedOrder,
          )
          .slice(-8),
      });
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }
  return {
    conversationRef,
    onRestoreVersion: accept,
    conflict,
    collaboration,
    latest,
    review,
    loading,
    error,
    loadReview,
    captureIfEmpty: () => {
      if (!hasDraft) accept(latestReplyOrder);
    },
    flagConflict: () => {
      setForced(true);
      void client.invalidateQueries({ queryKey: ["ticket", ticketId] });
    },
    dismissReview: () => setReview(null),
    acceptReview: () => {
      if (review && review.order >= latest) {
        accept(review.order);
        setReview(null);
        return true;
      }
      return false;
    },
    afterSent: () => {
      accept(latest);
      setReview(null);
    },
  };
}
