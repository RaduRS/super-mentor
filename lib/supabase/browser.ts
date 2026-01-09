"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseBrowser: SupabaseClient | undefined;

export function getSupabaseBrowser(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabasePublishableKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  if (!supabaseBrowser) {
    supabaseBrowser = createClient(supabaseUrl, supabasePublishableKey);
  }

  return supabaseBrowser;
}

