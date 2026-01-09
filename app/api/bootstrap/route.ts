import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

const BootstrapBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = BootstrapBodySchema.parse(await request.json());
  const supabase = getSupabaseAdmin();

  const { data: existingUsers, error: existingError } = await supabase
    .from("users")
    .select("*")
    .limit(1);

  if (existingError) {
    return NextResponse.json(
      { ok: false, error: existingError.message },
      { status: 500 },
    );
  }

  const existingUser = existingUsers?.[0];
  if (existingUser) {
    return NextResponse.json({ ok: true, user: existingUser, created: false });
  }

  const { data: createdUser, error: insertError } = await supabase
    .from("users")
    .insert({ name: body.name, email: body.email })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json(
      { ok: false, error: insertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, user: createdUser, created: true });
}

