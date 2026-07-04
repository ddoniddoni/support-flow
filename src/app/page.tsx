import { redirect } from "next/navigation";

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

  if (profile) {
    redirect(getDefaultAuthenticatedPath(profile.role));
  }

  return (
    <PublicOperationsHome workspaceHref="/login" workspaceLabel="Demo 열기" />
  );
}
