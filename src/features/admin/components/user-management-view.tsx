"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSelect } from "@/components/ui/app-select";
import { ActionDialog } from "@/components/common/action-dialog";
import type { Role } from "@/types/domain";
import { managedRoleLabels, userListSchema } from "../schemas/user-management-schema";
import { useManagedUsers, useUserManagementMutations } from "../hooks/use-user-management";
import type { ManagedUser } from "../api/user-management-api";
import { CreateUserForm } from "./create-user-form";

const roleOptions = Object.entries(managedRoleLabels).map(([value, label]) => ({ value: value as Role, label }));
const filterOptions = [{ value: "all", label: "전체 역할" }, ...roleOptions];
function formatDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export function UserManagementView({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const parsed = userListSchema.safeParse(Object.fromEntries(params));
  const filters = parsed.success ? parsed.data : { q: "", role: "all", page: 1 };
  const users = useManagedUsers(filters);
  const { changeRole } = useUserManagementMutations();
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");
  const [pendingRole, setPendingRole] = useState<{ user: ManagedUser; role: Role } | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  function navigate(next: Partial<typeof filters>) {
    const value = { ...filters, ...next };
    const query = new URLSearchParams();
    if (value.q) query.set("q", value.q);
    if (value.role !== "all") query.set("role", value.role);
    if (value.page > 1) query.set("page", String(value.page));
    router.push(`/admin/users?${query}`, { scroll: false });
  }
  async function confirmRole() {
    if (!pendingRole) return;
    try {
      await changeRole.mutateAsync({ id: pendingRole.user.id, role: pendingRole.role });
      setNotice(`${pendingRole.user.name}님의 역할을 ${managedRoleLabels[pendingRole.role]}(으)로 변경했습니다.`);
      setPendingRole(null);
    } catch { /* Keep the dialog open and show the server error. */ }
  }
  return (
    <div className="mx-auto grid max-w-[1360px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><Badge variant="secondary"><ShieldCheck className="size-3" aria-hidden="true" />관리자 전용</Badge><h1 className="mt-3 text-2xl font-semibold">사용자 관리</h1><p className="mt-2 text-sm text-muted-foreground">계정을 추가하고 고객·상담원·관리자 권한을 관리합니다.</p></div>
        <Button ref={addButton} disabled={adding || !users.data?.canCreate} onClick={() => { setAdding(true); setNotice(""); }}><Plus className="size-4" aria-hidden="true" />사용자 추가</Button>
      </div>
      {notice ? <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{notice}</p> : null}
      {users.data && !users.data.canCreate ? <p className="text-sm text-amber-800 dark:text-amber-200">계정 추가 기능의 서버 설정이 필요합니다. 기존 사용자 역할은 변경할 수 있습니다.</p> : null}
      {adding ? <CreateUserForm onCancel={() => { setAdding(false); addButton.current?.focus(); }} onCreated={() => { setAdding(false); setNotice("사용자를 추가했습니다. 초기 비밀번호를 해당 사용자에게 전달해 주세요."); navigate({ q: "", role: "all", page: 1 }); }} /> : null}
      <section aria-label="사용자 목록" className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <form key={filters.q} className="flex w-full min-w-0 gap-2 sm:w-auto sm:flex-1" onSubmit={(event) => { event.preventDefault(); navigate({ q: String(new FormData(event.currentTarget).get("q") ?? "").trim(), page: 1 }); }}>
            <Input aria-label="이름 또는 이메일 검색" name="q" defaultValue={filters.q} placeholder="이름 또는 이메일 검색…" maxLength={100} className="min-w-0 max-w-sm" />
            <Button type="submit" variant="outline"><Search className="size-4" aria-hidden="true" />검색</Button>
          </form>
          <AppSelect aria-label="역할 필터" className="w-full sm:w-36" value={filters.role} options={filterOptions} onValueChange={(value) => navigate({ role: value, page: 1 })} />
        </div>
        {users.isPending ? <div className="grid gap-4 p-5" aria-label="사용자 불러오는 중">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : users.isError ? (
          <div className="p-5"><p role="alert" className="text-sm text-red-600 dark:text-red-400">{users.error.message}</p><Button className="mt-3" variant="outline" onClick={() => void users.refetch()}>다시 시도</Button></div>
        ) : users.data?.users.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">사용자</th><th className="px-5 py-3 font-medium">역할</th><th className="px-5 py-3 font-medium">가입일</th></tr></thead>
              <tbody className="divide-y divide-border">{users.data.users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20">
                  <td className="max-w-xs px-5 py-4"><p className="font-medium">{user.name}{user.id === currentUserId ? <span className="ml-2 text-xs text-muted-foreground">나</span> : null}</p><p className="mt-1 break-words text-[13px] text-muted-foreground">{user.email}</p></td>
                  <td className="px-5 py-4">{user.id === currentUserId ? <Badge variant="outline">관리자 · 본인</Badge> : (
                    <AppSelect aria-label={`${user.name} 역할`} className="min-w-28" value={user.role} options={roleOptions} disabled={changeRole.isPending} onValueChange={(role) => { if (role !== user.role) { changeRole.reset(); setPendingRole({ user, role }); } }} />
                  )}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-[13px] text-muted-foreground">{formatDate(user.created_at)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="px-5 py-12 text-center text-sm text-muted-foreground">검색 조건에 맞는 사용자가 없습니다.</p>}
        {users.data ? <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm text-muted-foreground"><span>총 {users.data.total}명 · {filters.page}페이지</span><div className="flex gap-2"><Button variant="outline" disabled={filters.page <= 1} onClick={() => navigate({ page: filters.page - 1 })}>이전</Button><Button variant="outline" disabled={filters.page * 20 >= users.data.total} onClick={() => navigate({ page: filters.page + 1 })}>다음</Button></div></div> : null}
      </section>
      <p className="text-sm leading-6 text-muted-foreground">고객은 본인 문의만, 상담원은 배정된 문의를, 관리자는 전체 운영과 사용자 관리를 이용합니다. 본인 역할은 변경할 수 없으며, 상담원의 역할 변경 전에는 배정된 문의를 이관해야 합니다.</p>
      <details className="rounded-xl border border-border bg-card p-5">
        <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-ring">최근 사용자 관리 이력</summary>
        <ul className="mt-4 grid gap-3">{users.data?.events.map((event) => <li key={event.id} className="border-t border-border pt-3 text-sm"><p className="break-words font-medium">{event.target_email} · {event.action === "user_created" ? "계정 추가" : "역할 변경"}</p><p className="mt-1 text-muted-foreground">{event.previous_role ? `${managedRoleLabels[event.previous_role]} → ` : ""}{managedRoleLabels[event.next_role]} · {formatDate(event.created_at)}</p><p className="mt-1 text-xs text-muted-foreground" title={event.actor_id ?? ""}>처리 관리자: {event.actor_id === currentUserId ? "나" : event.actor_id ?? "삭제된 계정"}</p></li>)}</ul>
        {users.data && !users.data.events.length ? <p className="mt-3 text-sm text-muted-foreground">아직 변경 이력이 없습니다.</p> : null}
      </details>
      <ActionDialog open={pendingRole !== null} onClose={() => { if (!changeRole.isPending) setPendingRole(null); }} title="사용자 역할을 변경할까요?" description={pendingRole ? `${pendingRole.user.name} (${pendingRole.user.email}): ${managedRoleLabels[pendingRole.user.role]} → ${managedRoleLabels[pendingRole.role]}. 변경된 역할의 접근 권한이 즉시 적용됩니다.` : ""}>
        {changeRole.error ? <p role="alert" className="w-full text-sm text-red-600 dark:text-red-400">{changeRole.error.message}</p> : null}
        <Button disabled={changeRole.isPending} onClick={() => void confirmRole()}>{changeRole.isPending ? "변경 중…" : "역할 변경"}</Button>
      </ActionDialog>
    </div>
  );
}
