import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Role } from "@/types/domain";
import { changeManagedRole, createManagedUser, getManagedUsers } from "../api/user-management-api";

export function useManagedUsers(filters: { q: string; role: string; page: number }) {
  return useQuery({ queryKey: ["admin-users", filters], queryFn: () => getManagedUsers(filters) });
}
export function useUserManagementMutations() {
  const client = useQueryClient();
  async function refresh() {
    await Promise.all(["admin-users", "agents", "agent-management"].map((key) => client.invalidateQueries({ queryKey: [key] })));
  }
  const create = useMutation({ mutationFn: createManagedUser, onSuccess: refresh });
  const changeRole = useMutation({ mutationFn: ({ id, role }: { id: string; role: Role }) => changeManagedRole(id, role), onSuccess: refresh });
  return { create, changeRole };
}
