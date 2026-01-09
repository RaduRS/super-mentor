import type { SupabaseClient } from "@supabase/supabase-js";

export type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export async function fetchUserById(
  supabase: SupabaseClient,
  userId: string,
): Promise<AppUser> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { id: userId };
  return data ?? { id: userId };
}

export async function fetchUserByName(
  supabase: SupabaseClient,
  name: string,
): Promise<AppUser | null> {
  const normalizedName = name.trim();
  if (!normalizedName) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("name", normalizedName)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return data?.[0] ?? null;
}

