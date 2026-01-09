import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Resend } from "resend";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { parseTimeToMinutes } from "@/lib/utils";

function formatDateOnlyInTimeZone(
  timeZone: string | null | undefined,
  now: Date
) {
  const tz =
    typeof timeZone === "string" && timeZone.trim() ? timeZone.trim() : "UTC";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function formatTimeHHMMInTimeZone(
  timeZone: string | null | undefined,
  now: Date
) {
  const tz =
    typeof timeZone === "string" && timeZone.trim() ? timeZone.trim() : "UTC";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

function assertCronAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;
  const got = request.headers.get("x-cron-secret");
  return got === expected;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getAppBaseUrl() {
  const fromPublic =
    typeof process.env.NEXT_PUBLIC_APP_URL === "string"
      ? process.env.NEXT_PUBLIC_APP_URL.trim()
      : "";
  if (fromPublic) return fromPublic.replace(/\/+$/, "");

  const vercelUrl =
    typeof process.env.VERCEL_URL === "string"
      ? process.env.VERCEL_URL.trim()
      : "";
  if (vercelUrl) return `https://${vercelUrl.replace(/\/+$/, "")}`;

  return "";
}

function getOpenAIClient() {
  const openaiKey =
    typeof process.env.OPENAI_API_KEY === "string"
      ? process.env.OPENAI_API_KEY.trim()
      : "";
  if (!openaiKey) return null;
  return {
    client: new OpenAI({ apiKey: openaiKey }),
    model:
      typeof process.env.OPENAI_MODEL === "string" &&
      process.env.OPENAI_MODEL.trim()
        ? process.env.OPENAI_MODEL.trim()
        : "gpt-4o-mini",
  };
}

function formatEveningSummaryEmailHtml(params: {
  userName: string;
  dateOnly: string;
  summaryText: string;
  completionScore: number;
}) {
  const hello = params.userName.trim() ? params.userName.trim() : "there";
  const safeText = escapeHtml(params.summaryText).replaceAll("\n", "<br />");
  const safeDate = escapeHtml(params.dateOnly);
  const baseUrl = getAppBaseUrl();
  const dashboardUrl = baseUrl ? `${baseUrl}/dashboard` : "";
  return [
    "<!doctype html>",
    "<html>",
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    "<title>Evening Summary</title>",
    "</head>",
    '<body style="margin:0;background:#0b0b0c;color:#e6e6e6;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto;">',
    '<div style="max-width:640px;margin:0 auto;padding:24px;">',
    `<div style="color:#a1a1aa;font-size:13px;margin-bottom:8px;">Atlas evening recap</div>`,
    `<h1 style="margin:0 0 12px;font-size:18px;line-height:1.3;">Good evening, ${escapeHtml(hello)}.</h1>`,
    `<div style="margin:0 0 16px;color:#a1a1aa;font-size:13px;">${safeDate} • Completion score: ${params.completionScore}/100</div>`,
    '<div style="background:#111113;border:1px solid #27272a;border-radius:14px;padding:16px;font-size:14px;line-height:1.5;">',
    safeText,
    "</div>",
    dashboardUrl
      ? `<div style="margin-top:16px;"><a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-size:14px;">Open dashboard</a></div>`
      : "",
    "</div>",
    "</body>",
    "</html>",
  ].join("");
}

function safeJsonString(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "null";
  }
}

function buildFallbackSummary(params: {
  dateOnly: string;
  workoutPlanned: boolean;
  workoutCompleted: boolean;
  readingPlanned: boolean;
  readingCompleted: boolean;
  mealsPlanned: number;
  mealsLogged: number;
  completionScore: number;
}) {
  const lines = [
    `Daily summary for ${params.dateOnly}:`,
    "",
    `- Meals: ${params.mealsLogged}/${params.mealsPlanned} logged`,
    `- Workout: ${
      params.workoutPlanned
        ? params.workoutCompleted
          ? "completed"
          : "not completed"
        : "not planned"
    }`,
    `- Reading: ${
      params.readingPlanned
        ? params.readingCompleted
          ? "completed"
          : "not completed"
        : "not planned"
    }`,
    "",
    `Completion score: ${params.completionScore}/100`,
  ];
  return lines.join("\n");
}

const QuerySchema = z.object({
  userId: z.string().optional(),
  date: z.string().optional(),
});

export async function GET(request: Request) {
  if (!assertCronAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    userId: url.searchParams.get("userId") ?? undefined,
    date: url.searchParams.get("date") ?? undefined,
  });
  const query = parsed.success
    ? parsed.data
    : { userId: undefined, date: undefined };

  const now = new Date();
  const supabase = getSupabaseAdmin();
  const ai = getOpenAIClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, timezone, name, email")
    .limit(500);

  const results: Array<{
    userId: string;
    dateOnly: string;
    updated: boolean;
    completionScore: number | null;
  }> = [];

  for (const userRow of (users ?? []) as Array<Record<string, unknown>>) {
    const userId = String(userRow.id ?? "");
    if (!userId) continue;
    if (query.userId && query.userId !== userId) continue;

    const tz = typeof userRow.timezone === "string" ? userRow.timezone : null;
    const dateOnly = query.date?.trim()
      ? query.date.trim()
      : formatDateOnlyInTimeZone(tz, now);
    const localTime = formatTimeHHMMInTimeZone(tz, now);
    const localMinutes = parseTimeToMinutes(localTime) ?? 0;
    const allowEarlyRun = !!query.date?.trim();
    if (!allowEarlyRun && localMinutes < 23 * 60 + 30) continue;

    const { data: dailyPlan } = await supabase
      .from("daily_plans")
      .select(
        "id, plan_date, plan_status, workout_plan_id, meal_plan_id, reading_goal_id, atlas_morning_message, generated_evening_summary_at, coordination_log"
      )
      .eq("user_id", userId)
      .eq("plan_date", dateOnly)
      .maybeSingle();

    if (!dailyPlan?.id) continue;
    if (dailyPlan.generated_evening_summary_at) {
      results.push({ userId, dateOnly, updated: false, completionScore: null });
      continue;
    }

    const workoutPlanId = dailyPlan.workout_plan_id
      ? String(dailyPlan.workout_plan_id)
      : null;
    const mealPlanId = dailyPlan.meal_plan_id
      ? String(dailyPlan.meal_plan_id)
      : null;
    const readingSessionId = dailyPlan.reading_goal_id
      ? String(dailyPlan.reading_goal_id)
      : null;

    const workoutPlanned = !!workoutPlanId;
    const readingPlanned = !!readingSessionId;

    const { data: workout } = workoutPlanId
      ? await supabase
          .from("workout_plans")
          .select("id, completed")
          .eq("id", workoutPlanId)
          .eq("user_id", userId)
          .maybeSingle()
      : { data: null };

    const workoutCompleted = !!workout?.completed;

    const { data: reading } = readingSessionId
      ? await supabase
          .from("reading_sessions")
          .select("id, started_at, ended_at, duration_minutes, pages_read")
          .eq("id", readingSessionId)
          .eq("user_id", userId)
          .maybeSingle()
      : { data: null };

    const readingCompleted = !!reading?.ended_at;

    let mealsPlanned = 0;
    let mealsLogged = 0;
    if (mealPlanId) {
      const { data: meals } = await supabase
        .from("meals")
        .select("id, actually_eaten, status")
        .eq("user_id", userId)
        .eq("meal_plan_id", mealPlanId)
        .eq("scheduled_date", dateOnly)
        .eq("status", "active");

      const rows = (meals ?? []) as Array<Record<string, unknown>>;
      mealsPlanned = rows.length;
      mealsLogged = rows.filter((m) => !!m.actually_eaten).length;
    }

    const parts: Array<{ planned: boolean; score: number }> = [];
    if (workoutPlanned)
      parts.push({ planned: true, score: workoutCompleted ? 1 : 0 });
    if (readingPlanned)
      parts.push({ planned: true, score: readingCompleted ? 1 : 0 });
    if (mealPlanId) {
      const mealRatio = mealsPlanned > 0 ? mealsLogged / mealsPlanned : 0;
      parts.push({ planned: true, score: Math.max(0, Math.min(1, mealRatio)) });
    }

    const completionScore =
      parts.length === 0
        ? 0
        : Math.round(
            (parts.reduce((acc, p) => acc + p.score, 0) / parts.length) * 100
          );

    const plannedAllDone =
      (!workoutPlanned || workoutCompleted) &&
      (!readingPlanned || readingCompleted) &&
      (!mealPlanId || mealsPlanned === 0 || mealsLogged === mealsPlanned);

    const plannedAnyDone =
      (workoutPlanned && workoutCompleted) ||
      (readingPlanned && readingCompleted) ||
      (mealPlanId && mealsLogged > 0);

    const planStatus = plannedAllDone
      ? "completed"
      : plannedAnyDone
        ? "partially_completed"
        : "in_progress";

    const userName = typeof userRow.name === "string" ? userRow.name : "";
    const userEmail = typeof userRow.email === "string" ? userRow.email : "";

    const coordinationLogRaw =
      dailyPlan && typeof dailyPlan.coordination_log === "object"
        ? (dailyPlan.coordination_log as unknown)
        : null;
    const coordinationLog =
      coordinationLogRaw &&
      coordinationLogRaw !== null &&
      !Array.isArray(coordinationLogRaw)
        ? (coordinationLogRaw as Record<string, unknown>)
        : {};
    const notificationsRaw = coordinationLog.notifications;
    const notifications =
      notificationsRaw &&
      typeof notificationsRaw === "object" &&
      notificationsRaw !== null &&
      !Array.isArray(notificationsRaw)
        ? (notificationsRaw as Record<string, unknown>)
        : {};
    const alreadyEmailedAt =
      typeof notifications.eveningSummaryEmailSentAt === "string"
        ? notifications.eveningSummaryEmailSentAt
        : null;

    let summaryText = buildFallbackSummary({
      dateOnly,
      workoutPlanned,
      workoutCompleted,
      readingPlanned,
      readingCompleted,
      mealsPlanned,
      mealsLogged,
      completionScore,
    });

    if (ai) {
      try {
        const system = [
          `You are Atlas, the master coordinator for ${userName?.trim() ? userName.trim() : "the user"}.`,
          "Write a short evening summary for today.",
          "Rules:",
          "- Be constructive and specific.",
          "- Include: wins, misses, and one suggested adjustment for tomorrow.",
          "- Keep it under 160 words.",
        ].join("\n");

        const context = {
          dateOnly,
          completionScore,
          workout: { planned: workoutPlanned, completed: workoutCompleted },
          meals: { planned: mealsPlanned, logged: mealsLogged },
          reading: {
            planned: readingPlanned,
            completed: readingCompleted,
            duration_minutes:
              typeof reading?.duration_minutes === "number"
                ? reading.duration_minutes
                : null,
            pages_read:
              typeof reading?.pages_read === "number"
                ? reading.pages_read
                : null,
          },
          morningPlan: dailyPlan.atlas_morning_message ?? null,
        };

        const completion = await ai.client.chat.completions.create({
          model: ai.model,
          messages: [
            { role: "system", content: system },
            {
              role: "system",
              content: "Context (JSON): " + safeJsonString(context),
            },
            { role: "user", content: "Generate the evening summary now." },
          ],
          temperature: 0.4,
        });

        const text = completion.choices[0]?.message?.content?.trim() ?? "";
        if (text) summaryText = text;
      } catch {}
    }

    await supabase
      .from("daily_plans")
      .update({
        atlas_evening_summary: summaryText,
        completion_score: completionScore,
        plan_status: planStatus,
        generated_evening_summary_at: now.toISOString(),
      })
      .eq("id", String(dailyPlan.id))
      .eq("user_id", userId);

    const resendKey =
      typeof process.env.RESEND_API_KEY === "string"
        ? process.env.RESEND_API_KEY.trim()
        : "";
    const resendFrom =
      typeof process.env.RESEND_FROM === "string" &&
      process.env.RESEND_FROM.trim()
        ? process.env.RESEND_FROM.trim()
        : "Super Mentor <notifications@supermentor.app>";

    if (resendKey && userEmail.trim() && !alreadyEmailedAt) {
      try {
        const resend = new Resend(resendKey);
        const { data } = await resend.emails.send({
          from: resendFrom,
          to: userEmail,
          subject: `Evening summary • ${dateOnly}`,
          html: formatEveningSummaryEmailHtml({
            userName,
            dateOnly,
            summaryText,
            completionScore,
          }),
        });

        const nextNotifications: Record<string, unknown> = {
          ...notifications,
          eveningSummaryEmailSentAt: new Date().toISOString(),
          eveningSummaryEmailTo: userEmail,
          eveningSummaryEmailId:
            data && typeof data === "object" && "id" in data
              ? (data as { id?: unknown }).id
              : null,
        };

        await supabase
          .from("daily_plans")
          .update({
            coordination_log: {
              ...coordinationLog,
              notifications: nextNotifications,
            },
          })
          .eq("id", String(dailyPlan.id))
          .eq("user_id", userId);
      } catch {}
    }

    const { data: existingSummary } = await supabase
      .from("ai_summaries")
      .select("id")
      .eq("user_id", userId)
      .eq("summary_type", "daily")
      .eq("start_date", dateOnly)
      .eq("end_date", dateOnly)
      .limit(1);

    if (!Array.isArray(existingSummary) || existingSummary.length === 0) {
      await supabase.from("ai_summaries").insert({
        user_id: userId,
        summary_type: "daily",
        start_date: dateOnly,
        end_date: dateOnly,
        summary_text: summaryText,
        metrics: {
          completionScore,
          mealsPlanned,
          mealsLogged,
          workoutPlanned,
          workoutCompleted,
          readingPlanned,
          readingCompleted,
        },
      });
    }

    results.push({ userId, dateOnly, updated: true, completionScore });
  }

  return NextResponse.json({ ok: true, results });
}
