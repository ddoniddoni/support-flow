import { redirect } from "next/navigation";
import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/types/domain";

import { getCurrentProfile } from "./auth-api";

export function getDefaultAuthenticatedPath(role: Role) {
  return role === "customer" ? "/tickets" : "/dashboard";
}

export const getServerProfile = cache(async () => {
  const supabase = await createSupabaseServerClient();

  return getCurrentProfile(supabase);
});

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
    redirect(getDefaultAuthenticatedPath(profile.role));
  }
}

export async function requireServerRole(allowedRoles: Role[]) {
  const profile = await requireServerProfile();

  if (!allowedRoles.includes(profile.role)) {
    redirect("/unauthorized");
  }

  return profile;
}
