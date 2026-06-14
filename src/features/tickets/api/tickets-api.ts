import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

import type { CreateTicketInput } from "../schemas/ticket-schema";

export async function createTicket(input: CreateTicketInput) {
  const supabase = createSupabaseBrowserClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      title: input.title,
      content: input.content,
      category: input.category,
      priority: input.priority,
      customer_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
