"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Tables } from "@/types/database";
import type { ReplyTemplateInput } from "./schema";
export type ReplyTemplate = Tables<"reply_templates">;
export function useReplyTemplates(
  profileId: string,
  search = "",
  status = "active",
  page = 1,
  enabled = true,
) {
  return useQuery({
    queryKey: ["reply-templates", profileId, search, status, page],
    enabled,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      let query = createSupabaseBrowserClient()
        .from("reply_templates")
        .select("*", { count: "exact" })
        .order("updated_at", { ascending: false })
        .order("id");
      if (search.trim()) query = query.ilike("title", `%${search.trim()}%`);
      if (status !== "all") query = query.eq("is_active", status === "active");
      const { data, error, count } = await query.range(
        (page - 1) * 20,
        page * 20 - 1,
      );
      if (error) throw error;
      return { items: data ?? [], total: count ?? 0 };
    },
  });
}
export function useSaveReplyTemplate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: ReplyTemplateInput & { id: string; updatedAt?: string },
    ) => {
      const { data, error } = await createSupabaseBrowserClient().rpc(
        "save_reply_template",
        { p_id: input.id, p_payload: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["reply-templates"] }),
  });
}
