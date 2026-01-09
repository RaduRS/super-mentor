import { NextResponse } from "next/server";
import { z } from "zod";

import { searchRecipes } from "@/lib/nutrition/food-api";

const QuerySchema = z.object({
  query: z.string().min(1),
  calories: z.coerce.number().positive().optional(),
  protein: z.coerce.number().positive().optional(),
  diet: z.string().min(1).optional(),
  intolerances: z.string().min(1).optional(),
  cuisine: z.string().min(1).optional(),
  number: z.coerce.number().int().min(1).max(25).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    query: url.searchParams.get("query") ?? "",
    calories: url.searchParams.get("calories") ?? undefined,
    protein: url.searchParams.get("protein") ?? undefined,
    diet: url.searchParams.get("diet") ?? undefined,
    intolerances: url.searchParams.get("intolerances") ?? undefined,
    cuisine: url.searchParams.get("cuisine") ?? undefined,
    number: url.searchParams.get("number") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const intolerances = parsed.data.intolerances
      ? parsed.data.intolerances
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const results = await searchRecipes({
      query: parsed.data.query,
      calories: parsed.data.calories,
      protein: parsed.data.protein,
      diet: parsed.data.diet,
      intolerances,
      cuisine: parsed.data.cuisine,
      number: parsed.data.number,
    });

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Food search failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

