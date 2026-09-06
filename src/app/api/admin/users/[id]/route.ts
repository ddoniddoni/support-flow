import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin, userManagementError } from "@/features/admin/api/admin-request";
import { changeManagedRoleSchema } from "@/features/admin/schemas/user-management-schema";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeAdmin(request);
    if (auth.response) return auth.response;
    const { id } = await params;
    const parsed = changeManagedRoleSchema.safeParse(await request.json().catch(() => null));
    if (!z.uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ message: "사용자와 역할을 확인해 주세요." }, { status: 400 });
    const { data, error } = await auth.supabase.rpc("admin_change_user_role", { p_target: id, p_role: parsed.data.role });
    if (error) throw error;
    return NextResponse.json({ user: data });
  } catch (error) { return userManagementError(error); }
}
