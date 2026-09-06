import { requireServerRole } from "@/features/auth/api/server-auth";
import { UserManagementView } from "@/features/admin/components/user-management-view";

export default async function AdminUsersPage() {
  const profile = await requireServerRole(["admin"]);
  return <UserManagementView currentUserId={profile.id} />;
}
