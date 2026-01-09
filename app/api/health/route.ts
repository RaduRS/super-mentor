import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { error, count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      { ok: false, supabase: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, supabase: true, usersCount: count ?? 0 });
}

