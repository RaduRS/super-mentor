import { NextResponse } from "next/server";
import { z } from "zod";

import { getRecipeNutrition } from "@/lib/nutrition/food-api";

const ParamsSchema = z.object({
  recipeId: z.string().regex(/^\d+$/),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ recipeId?: string }> }
) {
  const params = await context.params;
  const parsed = ParamsSchema.safeParse({ recipeId: params.recipeId ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid recipeId" }, { status: 400 });
  }

  try {
    const nutrition = await getRecipeNutrition(Number(parsed.data.recipeId));
    return NextResponse.json({ ok: true, nutrition });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Nutrition fetch failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

