import type { Tables } from "@/types/database";
import type { Role } from "@/types/domain";
import type { CreateManagedUserInput } from "../schemas/user-management-schema";

export type ManagedUser = Tables<"profiles">;
export type UserListResult = { users: ManagedUser[]; total: number; events: Tables<"user_management_events">[]; canCreate: boolean };
async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, cache: "no-store", headers: { "Content-Type": "application/json" } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message ?? "요청을 처리하지 못했습니다.");
  return payload as T;
}
export function getManagedUsers(filters: { q: string; role: string; page: number }) {
  return adminFetch<UserListResult>(`/api/admin/users?${new URLSearchParams({ ...filters, page: String(filters.page) })}`);
}
export function createManagedUser(input: CreateManagedUserInput) {
  return adminFetch<{ user: ManagedUser }>("/api/admin/users", { method: "POST", body: JSON.stringify(input) });
}
export function changeManagedRole(id: string, role: Role) {
  return adminFetch<{ user: ManagedUser }>(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) });
}
