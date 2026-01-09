import { NextResponse } from "next/server";
import OpenAI from "openai";

type ProviderName = "openai" | "kimi" | "deepseek";

async function checkProvider(input: {
  provider: ProviderName;
  apiKey: string | null;
  baseURL?: string;
}) {
  if (!input.apiKey) {
    return { ok: false, configured: false, error: "Missing API key" as const };
  }

  const client = new OpenAI({
    apiKey: input.apiKey,
    baseURL: input.baseURL,
  });

  try {
    const models = await client.models.list();
    const ids = models.data
      .map((m) => m.id)
      .filter((id): id is string => typeof id === "string")
      .slice(0, 10);
    return { ok: true, configured: true, models: ids };
  } catch (err) {
    const status =
      typeof (err as { status?: unknown })?.status === "number"
        ? ((err as { status?: unknown }).status as number)
        : null;
    const type =
      typeof (err as { type?: unknown })?.type === "string"
        ? String((err as { type?: unknown }).type)
        : null;
    const message =
      typeof (err as { message?: unknown })?.message === "string"
        ? String((err as { message?: unknown }).message)
        : "Provider request failed";

    return {
      ok: false,
      configured: true,
      error:
        `${status ? `status ${status} ` : ""}${type ? `${type} ` : ""}${message}`.trim(),
    };
  }
}

async function probeChat(input: {
  provider: ProviderName;
  apiKey: string | null;
  baseURL?: string;
  model: string;
}) {
  if (!input.apiKey) {
    return { ok: false, configured: false, error: "Missing API key" as const };
  }
  const client = new OpenAI({
    apiKey: input.apiKey,
    baseURL: input.baseURL,
  });
  try {
    const completion = await client.chat.completions.create({
      model: input.model,
      messages: [{ role: "user", content: "Reply with OK." }],
      temperature: 0,
      max_tokens: 10,
    });
    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    return { ok: text.toLowerCase().includes("ok"), configured: true, text };
  } catch (err) {
    const status =
      typeof (err as { status?: unknown })?.status === "number"
        ? ((err as { status?: unknown }).status as number)
        : null;
    const type =
      typeof (err as { type?: unknown })?.type === "string"
        ? String((err as { type?: unknown }).type)
        : null;
    const message =
      typeof (err as { message?: unknown })?.message === "string"
        ? String((err as { message?: unknown }).message)
        : "Provider request failed";

    return {
      ok: false,
      configured: true,
      error:
        `${status ? `status ${status} ` : ""}${type ? `${type} ` : ""}${message}`.trim(),
    };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const runProbe = url.searchParams.get("probe") === "chat";

  const openai = await checkProvider({
    provider: "openai",
    apiKey: process.env.OPENAI_API_KEY || null,
  });

  const kimi = await checkProvider({
    provider: "kimi",
    apiKey: process.env.KIMI_API_KEY || null,
    baseURL: process.env.KIMI_BASE_URL || "https://api.moonshot.ai/v1",
  });

  const deepseek = await checkProvider({
    provider: "deepseek",
    apiKey: process.env.DEEPSEEK_API_KEY || null,
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  });

  const openaiChat = runProbe
    ? await probeChat({
        provider: "openai",
        apiKey: process.env.OPENAI_API_KEY || null,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      })
    : null;
  const kimiChat = runProbe
    ? await probeChat({
        provider: "kimi",
        apiKey: process.env.KIMI_API_KEY || null,
        baseURL: process.env.KIMI_BASE_URL || "https://api.moonshot.ai/v1",
        model: process.env.KIMI_MODEL || "kimi-k2-0905-preview",
      })
    : null;
  const deepseekChat = runProbe
    ? await probeChat({
        provider: "deepseek",
        apiKey: process.env.DEEPSEEK_API_KEY || null,
        baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      })
    : null;

  const ok = !!openai.ok || !!kimi.ok || !!deepseek.ok;
  return NextResponse.json({
    ok,
    openai,
    kimi,
    deepseek,
    probe: runProbe ? { openaiChat, kimiChat, deepseekChat } : null,
  });
}
