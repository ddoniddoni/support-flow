import { requireServerRole } from "@/features/auth/api/server-auth";
import { PolicySettings } from "@/features/response-policy/policy-settings";
export default async function ResponsePolicyPage() {
  const profile = await requireServerRole(["admin"]);
  return <PolicySettings profileId={profile.id} />;
}
