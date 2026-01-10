import { NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  prompt: z.string().min(1).max(800),
  width: z.number().int().min(256).max(1536).default(768),
  height: z.number().int().min(256).max(1536).default(768),
  model: z.string().min(1).default("black-forest-labs/flux-schnell"),
  negativePrompt: z.string().min(1).max(800).optional(),
});

export async function POST(request: Request) {
  const apiKey = process.env.NEBIUS_API_KEY || null;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing NEBIUS_API_KEY" },
      { status: 500 }
    );
  }

  const json: unknown = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const prompt = [
    parsed.data.prompt,
    "CRITICAL: ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO WRITING, NO CAPTIONS, NO TYPOGRAPHY anywhere in the image.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const response = await fetch(
      "https://api.studio.nebius.ai/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: parsed.data.model,
          prompt,
          width: parsed.data.width,
          height: parsed.data.height,
          num_inference_steps: 4,
          negative_prompt: parsed.data.negativePrompt,
          response_extension: "png",
          response_format: "b64_json",
          seed: -1,
        }),
      }
    );

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            typeof payload === "object" && payload !== null && "error" in payload
              ? String((payload as { error?: unknown }).error ?? "Image failed")
              : "Image failed",
        },
        { status: 502 }
      );
    }

    const b64 =
      typeof payload === "object" &&
      payload !== null &&
      "data" in payload &&
      Array.isArray((payload as { data?: unknown }).data) &&
      (payload as { data: Array<Record<string, unknown>> }).data[0] &&
      typeof (payload as { data: Array<Record<string, unknown>> }).data[0]
        ?.b64_json === "string"
        ? String(
            (payload as { data: Array<{ b64_json?: unknown }> }).data[0]
              .b64_json
          )
        : null;

    if (!b64 || !b64.trim()) {
      return NextResponse.json(
        { ok: false, error: "No image returned" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      dataUrl: `data:image/png;base64,${b64}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Image failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

