import OpenAI from "openai";

import type { getSupabaseAdmin } from "@/lib/supabase/admin";

function parseVector(value: unknown) {
  if (!value) return null;
  if (Array.isArray(value) && value.every((n) => typeof n === "number")) {
    return value as number[];
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) {
        return parsed as number[];
      }
    } catch {}
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const parts = trimmed
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim());
      const numbers = parts
        .map((p) => Number(p))
        .filter((n) => Number.isFinite(n));
      return numbers.length === parts.length ? numbers : null;
    }
  }
  return null;
}

function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) return null;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (!na || !nb) return null;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function generateEmbedding(content: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
  const response = await openai.embeddings.create({
    model,
    input: content,
  });
  const embedding = response.data[0]?.embedding;
  return Array.isArray(embedding) ? embedding : null;
}

type MatchEmbeddingsRow = {
  id: string;
  content_chunk: string;
  similarity: number;
};

export async function semanticSearch(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  userId: string;
  query: string;
  manager?: string;
  category?: string;
  limit?: number;
  threshold?: number;
}) {
  const queryEmbedding = await generateEmbedding(params.query);
  if (!queryEmbedding) return [];

  const limit = Math.max(1, Math.min(100, params.limit ?? 8));
  const threshold = typeof params.threshold === "number" ? params.threshold : 0.78;

  const { data: rpcData, error: rpcError } = await params.supabase
    .rpc("match_embeddings", {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter_user_id: params.userId,
      filter_manager: params.manager ?? null,
      filter_category: params.category ?? null,
    })
    .select("*");

  if (!rpcError && Array.isArray(rpcData)) {
    return (rpcData as unknown[]).map((row) => {
      const r = row as Partial<MatchEmbeddingsRow>;
      return {
        id: String(r.id ?? ""),
        content: String(r.content_chunk ?? ""),
        similarity: Number(r.similarity ?? 0),
      };
    });
  }

  const { data: embeddingsRows } = await params.supabase
    .from("embeddings")
    .select("id, content_chunk, embedding, manager, category, created_at")
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false })
    .limit(params.manager || params.category ? 1500 : 800);

  const scored = (embeddingsRows ?? [])
    .map((row) => {
      const manager = String((row as { manager?: unknown }).manager ?? "");
      const category = String((row as { category?: unknown }).category ?? "");
      if (params.manager && manager !== params.manager) return null;
      if (params.category && category !== params.category) return null;
      const vec = parseVector((row as { embedding?: unknown }).embedding);
      if (!vec) return null;
      const sim = cosineSimilarity(queryEmbedding, vec);
      if (typeof sim !== "number") return null;
      return {
        id: String((row as { id?: unknown }).id ?? ""),
        content: String((row as { content_chunk?: unknown }).content_chunk ?? ""),
        similarity: sim,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => b.similarity - a.similarity)
    .filter((x) => x.similarity >= threshold && x.content.trim())
    .slice(0, limit);

  return scored;
}

