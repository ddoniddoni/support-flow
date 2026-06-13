import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/types/domain";

import { getCurrentProfile } from "./auth-api";

export async function getServerProfile() {
  const supabase = await createSupabaseServerClient();

  return getCurrentProfile(supabase);
}

export async function requireServerProfile() {
  const profile = await getServerProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}

export async function redirectAuthenticatedUser() {
  const profile = await getServerProfile();

  if (profile) {
    redirect("/dashboard");
  }
}

export async function requireServerRole(allowedRoles: Role[]) {
  const profile = await requireServerProfile();

  if (!allowedRoles.includes(profile.role)) {
    redirect("/unauthorized");
  }

  return profile;
}
