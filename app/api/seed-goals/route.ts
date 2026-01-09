import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

const SeedGoalsBodySchema = z.object({
  userId: z.string().uuid(),
});

const DefaultGoals = [
  {
    category: "fitness",
    goal_type: "target",
    description:
      "Eliminate belly fat and build balanced, well-defined muscle across all body parts; increase raw power and functional strength.",
  },
  {
    category: "nutrition",
    goal_type: "lifestyle",
    description:
      "Eat healthy, structured meals; optimize organ health; track and improve macro and micronutrients sustainably.",
  },
  {
    category: "reading",
    goal_type: "lifestyle",
    description:
      "Read daily or near-daily; finish the backlog of books and audiobooks; discuss philosophy, psychology, and insights deeply.",
  },
] as const;

export async function POST(request: Request) {
  const body = SeedGoalsBodySchema.parse(await request.json());
  const supabase = getSupabaseAdmin();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("id", body.userId)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ ok: false, error: userError.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  const { count, error: countError } = await supabase
    .from("goals")
    .select("id", { count: "exact", head: true })
    .eq("user_id", body.userId);

  if (countError) {
    return NextResponse.json({ ok: false, error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json({ ok: true, seeded: false, reason: "Goals already exist" });
  }

  const { error: insertError } = await supabase.from("goals").insert(
    DefaultGoals.map((g) => ({
      user_id: body.userId,
      category: g.category,
      goal_type: g.goal_type,
      description: g.description,
    })),
  );

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, seeded: true });
}

