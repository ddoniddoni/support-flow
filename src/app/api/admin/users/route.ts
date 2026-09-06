import { NextResponse } from "next/server";
import { authorizeAdmin, userManagementError } from "@/features/admin/api/admin-request";
import { createManagedUserSchema, userListSchema } from "@/features/admin/schemas/user-management-schema";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleKey } from "@/lib/supabase/service-role";

export async function GET(request: Request) {
  try {
    const auth = await authorizeAdmin(request);
    if (auth.response) return auth.response;
    const parsed = userListSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return NextResponse.json({ message: "검색 조건을 확인해 주세요." }, { status: 400 });
    const { q, role, page } = parsed.data;
    let query = auth.supabase.from("profiles").select("id,name,email,role,created_at", { count: "exact" });
    // Keep PostgREST filter operators out of the user-provided search term.
    const search = q.replace(/[^\p{L}\p{N}@.+ -]/gu, " ").trim();
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    if (role !== "all") query = query.eq("role", role);
    const [users, events] = await Promise.all([
      query.order("created_at", { ascending: false }).order("id").range((page - 1) * 20, page * 20 - 1),
      auth.supabase.from("user_management_events").select("*").order("created_at", { ascending: false }).order("id").limit(10),
    ]);
    if (users.error) throw users.error;
    if (events.error) throw events.error;
    return NextResponse.json({ users: users.data, total: users.count ?? 0, events: events.data, canCreate: hasSupabaseServiceRoleKey() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return userManagementError(error); }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeAdmin(request);
    if (auth.response) return auth.response;
    const parsed = createManagedUserSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "입력을 확인해 주세요." }, { status: 400 });
    if (!hasSupabaseServiceRoleKey()) return NextResponse.json({ message: "계정 추가 기능의 서버 설정이 필요합니다." }, { status: 503 });
    const service = createSupabaseServiceRoleClient();
    const { name, email, password, role } = parsed.data;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
    if (created.error) {
      const duplicate = ["email_exists", "user_already_exists", "email_address_exists"].includes(created.error.code ?? "") || /already.*registered/i.test(created.error.message);
      return NextResponse.json({ message: duplicate ? "이미 등록된 이메일입니다. 사용자 목록에서 검색해 주세요." : "계정을 생성하지 못했습니다. 이메일과 비밀번호 조건을 확인해 주세요." }, { status: duplicate ? 409 : 400 });
    }
    const finalized = await service.rpc("admin_finalize_user", { p_actor: auth.profile.id, p_target: created.data.user.id, p_role: role });
    if (finalized.error) {
      const cleanup = await service.auth.admin.deleteUser(created.data.user.id);
      if (cleanup.error) {
        console.error("Managed user creation cleanup failed", { userId: created.data.user.id, code: cleanup.error.code });
        return NextResponse.json({ message: "계정은 생성됐지만 역할 설정에 실패했습니다. 목록을 새로고침한 뒤 해당 계정의 역할을 확인해 주세요." }, { status: 500 });
      }
      throw finalized.error;
    }
    return NextResponse.json({ user: finalized.data }, { status: 201 });
  } catch (error) { return userManagementError(error); }
}
