import { NextResponse } from "next/server";
import { z } from "zod";

import { searchBooks } from "@/lib/books/book-api";

const QuerySchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    query: url.searchParams.get("query") ?? "",
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const results = await searchBooks(parsed.data);
    return NextResponse.json({ ok: true, results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Book search failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

