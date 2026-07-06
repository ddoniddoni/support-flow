import {
  getDefaultAuthenticatedPath,
  getServerProfile,
} from "@/features/auth/api/server-auth";
import { PublicOperationsHome } from "@/features/operations/components/operations-mock-views";
import { hasSupabaseEnv } from "@/lib/env";

async function getLandingProfile() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    return await getServerProfile();
  } catch {
    return null;
  }
}

export default async function Home() {
  const profile = await getLandingProfile();
  const workspaceHref = profile
    ? getDefaultAuthenticatedPath(profile.role)
    : "/login";

  return (
    <PublicOperationsHome
      workspaceHref={workspaceHref}
      workspaceLabel={profile ? "운영 화면 열기" : "Demo 열기"}
    />
  );
}
