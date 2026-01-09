import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseAdmin: SupabaseClient | undefined;

export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseSecretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY");
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}

