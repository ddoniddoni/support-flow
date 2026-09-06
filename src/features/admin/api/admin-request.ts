import "server-only";
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/features/auth/api/auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function authorizeAdmin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return { response: NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 }) };
  }
  const supabase = await createSupabaseServerClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { response: NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }) };
  if (profile.role !== "admin") return { response: NextResponse.json({ message: "관리자만 사용자를 관리할 수 있습니다." }, { status: 403 }) };
  return { supabase, profile };
}

export function userManagementError(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  const messages: Record<string, [number, string]> = {
    "42501": [403, "관리자 권한이 변경되었습니다. 새로고침해 주세요."],
    "22023": [400, "본인의 역할은 변경할 수 없습니다."],
    "23514": [409, "배정된 문의를 다른 상담원에게 이관한 뒤 역할을 변경해 주세요."],
    "P0002": [404, "사용자를 찾을 수 없습니다."],
  };
  const [status, message] = messages[code] ?? [500, "사용자 관리 요청을 처리하지 못했습니다. 다시 시도해 주세요."];
  return NextResponse.json({ message }, { status });
}
