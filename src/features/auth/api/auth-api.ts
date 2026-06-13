import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/database";

export type CurrentUser = User;
export type CurrentProfile = Tables<"profiles">;

export async function getCurrentUser(
  supabase: SupabaseClient<Database>,
): Promise<CurrentUser | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

export async function getCurrentProfile(
  supabase: SupabaseClient<Database>,
): Promise<CurrentProfile | null> {
  const user = await getCurrentUser(supabase);

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut(supabase: SupabaseClient<Database>) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
