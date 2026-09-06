import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/features/auth/api/auth-api";
import { generateTicketAIAnalysis } from "@/features/ai/api/generate-ticket-ai-analysis";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({ regenerate: z.boolean().optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = requestSchema.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !payload.success) {
    return NextResponse.json({ message: "잘못된 분석 요청입니다." }, { status: 400 });
  }
  try {
    const supabase = await createSupabaseServerClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    if (profile.role === "customer") {
      return NextResponse.json({ message: "AI 분석을 실행할 권한이 없습니다." }, { status: 403 });
    }
    // Session-scoped client: ticket access is checked by RLS and again by the RPC.
    const { data: ticket, error } = await supabase.from("ticket_workspace").select("id").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!ticket) return NextResponse.json({ message: "문의를 찾을 수 없습니다." }, { status: 404 });
    const analysis = await generateTicketAIAnalysis({
      actorId: profile.id, ticketId: id, supabase, regenerate: payload.data.regenerate,
    });
    return NextResponse.json({ analysis });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "40001") {
      return NextResponse.json({ message: "다른 분석이 먼저 저장되었습니다. 새로고침 후 확인해 주세요." }, { status: 409 });
    }
    if (code === "42501") {
      return NextResponse.json({ message: "문의 접근 권한이 변경되었습니다. 새로고침해 주세요." }, { status: 403 });
    }
    console.error("AI analysis failed", { ticketId: id, code });
    return NextResponse.json({ message: "AI 분석을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
