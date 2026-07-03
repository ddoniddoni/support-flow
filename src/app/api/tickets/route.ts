import { NextResponse } from "next/server";

import { generateTicketAIAnalysis } from "@/features/ai/api/generate-ticket-ai-analysis";
import { createTicketSchema } from "@/features/tickets/schemas/ticket-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createSupabaseServiceRoleClient,
  hasSupabaseServiceRoleKey,
} from "@/lib/supabase/service-role";

type CreateTicketResponse = {
  aiTriageStatus: "completed" | "failed" | "skipped";
  id: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected server error.";
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsedPayload = createTicketSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      { message: "Invalid ticket payload." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json({ message: userError.message }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { message: profileError.message },
      { status: 500 },
    );
  }

  if (!profile || profile.role !== "customer") {
    return NextResponse.json(
      { message: "Customers can create support tickets." },
      { status: 403 },
    );
  }

  const input = parsedPayload.data;
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      title: input.title,
      content: input.content,
      category: input.category,
      customer_id: user.id,
    })
    .select("id")
    .single();

  if (ticketError) {
    return NextResponse.json(
      { message: ticketError.message },
      { status: 500 },
    );
  }

  let aiTriageStatus: CreateTicketResponse["aiTriageStatus"] = "skipped";

  if (hasSupabaseServiceRoleKey()) {
    try {
      const serviceRoleSupabase = createSupabaseServiceRoleClient();

      await generateTicketAIAnalysis({
        actorId: user.id,
        supabase: serviceRoleSupabase,
        ticketId: ticket.id,
      });
      aiTriageStatus = "completed";
    } catch (error) {
      console.error("Ticket intake AI triage failed", {
        error: getErrorMessage(error),
        ticketId: ticket.id,
      });
      aiTriageStatus = "failed";
    }
  }

  return NextResponse.json({
    aiTriageStatus,
    id: ticket.id,
  } satisfies CreateTicketResponse);
}
