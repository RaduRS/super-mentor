import { NextResponse } from "next/server";
import { Resend } from "resend";

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

async function alreadySentProactive(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  userId: string;
  manager: "atlas" | "forge" | "olive" | "lexicon";
  dateOnly: string;
  key: string;
}) {
  const prefix = `[PROACTIVE:${params.dateOnly}:${params.key}]`;
  const { data } = await params.supabase
    .from("conversations")
    .select("id")
    .eq("user_id", params.userId)
    .eq("manager", params.manager)
    .eq("role", "assistant")
    .like("content", `${prefix}%`)
    .limit(1);

  return Array.isArray(data) && data.length > 0;
}

async function sendProactiveMessage(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  userId: string;
  manager: "atlas" | "forge" | "olive" | "lexicon";
  dateOnly: string;
  key: string;
  message: string;
}) {
  const prefix = `[PROACTIVE:${params.dateOnly}:${params.key}]`;
  await params.supabase.from("conversations").insert({
    user_id: params.userId,
    manager: params.manager,
    role: "assistant",
    content: `${prefix} ${params.message}`.trim(),
  });
}

async function sendProactiveEmail(params: {
  userEmail: string;
  userName: string | null;
  manager: "atlas" | "forge" | "olive" | "lexicon";
  message: string;
}) {
  const resendKey =
    typeof process.env.RESEND_API_KEY === "string"
      ? process.env.RESEND_API_KEY.trim()
      : "";
  if (!resendKey) return;

  const to = params.userEmail.trim();
  if (!to) return;

  const from =
    typeof process.env.RESEND_FROM === "string" &&
    process.env.RESEND_FROM.trim()
      ? process.env.RESEND_FROM.trim()
      : "Super Mentor <notifications@supermentor.app>";

  const managerName =
    params.manager === "atlas"
      ? "Atlas"
      : params.manager === "forge"
        ? "Forge"
        : params.manager === "olive"
          ? "Olive"
          : "Lexicon";

  const baseUrl = getAppBaseUrl();
  const chatUrl = baseUrl ? `${baseUrl}/chat?manager=${params.manager}` : "";

  const hello = params.userName?.trim() ? params.userName.trim() : "there";
  const safeMessage = escapeHtml(params.message).replaceAll("\n", "<br />");

  const html = [
    "<!doctype html>",
    "<html>",
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    "</head>",
    '<body style="margin:0;background:#0b0b0c;color:#e6e6e6;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto;">',
    '<div style="max-width:640px;margin:0 auto;padding:24px;">',
    `<div style="color:#a1a1aa;font-size:13px;margin-bottom:8px;">${escapeHtml(managerName)} checking in</div>`,
    `<h1 style="margin:0 0 12px;font-size:18px;line-height:1.3;">Hi ${escapeHtml(hello)},</h1>`,
    '<div style="background:#111113;border:1px solid #27272a;border-radius:14px;padding:16px;font-size:14px;line-height:1.5;">',
    safeMessage,
    "</div>",
    chatUrl
      ? `<div style="margin-top:16px;"><a href="${escapeHtml(chatUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-size:14px;">Reply in chat</a></div>`
      : "",
    "</div>",
    "</body>",
    "</html>",
  ].join("");

  const resend = new Resend(resendKey);
  await resend.emails.send({
    from,
    to,
    subject: `${managerName} check-in`,
    html,
  });
}

async function runChecks() {
  const now = new Date();
  const supabase = getSupabaseAdmin();

  const { data: users } = await supabase
    .from("users")
    .select("id, timezone, email, name")
    .limit(500);

  const results: Array<{
    userId: string;
    dateOnly: string;
    sent: Array<{ manager: string; key: string }>;
  }> = [];

  for (const userRow of (users ?? []) as Array<Record<string, unknown>>) {
    const userId = String(userRow.id ?? "");
    if (!userId) continue;
    const tz = typeof userRow.timezone === "string" ? userRow.timezone : null;
    const userEmail = typeof userRow.email === "string" ? userRow.email : "";
    const userName = typeof userRow.name === "string" ? userRow.name : null;

    const dateOnly = formatDateOnlyInTimeZone(tz, now);
    const localTime = formatTimeHHMMInTimeZone(tz, now);
    const localMinutes = parseTimeToMinutes(localTime) ?? 0;

    const { data: dailyPlan } = await supabase
      .from("daily_plans")
      .select("id, meal_plan_id, workout_plan_id, reading_goal_id")
      .eq("user_id", userId)
      .eq("plan_date", dateOnly)
      .maybeSingle();

    if (!dailyPlan?.id) continue;

    const sent: Array<{ manager: string; key: string }> = [];

    const mealPlanId = dailyPlan.meal_plan_id
      ? String((dailyPlan as { meal_plan_id?: unknown }).meal_plan_id)
      : null;
    if (mealPlanId) {
      const { data: meals } = await supabase
        .from("meals")
        .select(
          "id, name, meal_type, scheduled_time, logged_at, actually_eaten, reminded_at, status"
        )
        .eq("user_id", userId)
        .eq("meal_plan_id", mealPlanId)
        .eq("scheduled_date", dateOnly)
        .eq("status", "active")
        .order("scheduled_time", { ascending: true });

      for (const meal of (meals ?? []) as Array<Record<string, unknown>>) {
        const mealId = String(meal.id ?? "");
        if (!mealId) continue;

        const mealType =
          typeof meal.meal_type === "string" ? meal.meal_type : "meal";
        const mealName =
          typeof meal.name === "string" && meal.name.trim()
            ? meal.name.trim()
            : mealType;
        const isLogged = !!meal.logged_at || !!meal.actually_eaten;
        const alreadyReminded = !!meal.reminded_at;

        const scheduled = parseTimeToMinutes(
          typeof meal.scheduled_time === "string" ? meal.scheduled_time : null
        );

        if (
          !isLogged &&
          !alreadyReminded &&
          scheduled !== null &&
          localMinutes >= scheduled + 120
        ) {
          const key = `olive_${mealType}_not_logged_${mealId}`;
          const alreadySent = await alreadySentProactive({
            supabase,
            userId,
            manager: "olive",
            dateOnly,
            key,
          });
          if (!alreadySent) {
            const message = `Hey! I noticed you haven’t logged ${mealType} yet. Did you eat “${mealName}”, or did you have something else?`;
            await sendProactiveMessage({
              supabase,
              userId,
              manager: "olive",
              dateOnly,
              key,
              message,
            });
            try {
              await sendProactiveEmail({
                userEmail,
                userName,
                manager: "olive",
                message,
              });
            } catch {}
            await supabase
              .from("meals")
              .update({ reminded_at: now.toISOString() })
              .eq("id", mealId)
              .eq("user_id", userId);
            sent.push({ manager: "olive", key });
          }
        }
      }
    }

    const workoutPlanId = dailyPlan.workout_plan_id
      ? String((dailyPlan as { workout_plan_id?: unknown }).workout_plan_id)
      : null;
    if (workoutPlanId) {
      const { data: workout } = await supabase
        .from("workout_plans")
        .select("id, workout_type, scheduled_time, completed, reminded_at")
        .eq("id", workoutPlanId)
        .eq("user_id", userId)
        .maybeSingle();

      const scheduled = parseTimeToMinutes(
        typeof workout?.scheduled_time === "string"
          ? workout.scheduled_time
          : null
      );

      if (
        workout?.id &&
        !workout?.completed &&
        !workout?.reminded_at &&
        scheduled !== null &&
        localMinutes >= scheduled + 30
      ) {
        const key = "forge_workout_not_completed";
        const alreadySent = await alreadySentProactive({
          supabase,
          userId,
          manager: "forge",
          dateOnly,
          key,
        });
        if (!alreadySent) {
          const when =
            typeof workout.scheduled_time === "string"
              ? workout.scheduled_time.slice(0, 5)
              : localTime;
          const message = `Hey — your ${String(workout.workout_type ?? "workout")} was scheduled for ${when}. Everything okay? Want to adjust today’s plan?`;
          await sendProactiveMessage({
            supabase,
            userId,
            manager: "forge",
            dateOnly,
            key,
            message,
          });
          try {
            await sendProactiveEmail({
              userEmail,
              userName,
              manager: "forge",
              message,
            });
          } catch {}
          await supabase
            .from("workout_plans")
            .update({ reminded_at: now.toISOString() })
            .eq("id", String(workout.id))
            .eq("user_id", userId);
          sent.push({ manager: "forge", key });
        }
      }
    }

    const readingSessionId = dailyPlan.reading_goal_id
      ? String((dailyPlan as { reading_goal_id?: unknown }).reading_goal_id)
      : null;
    if (readingSessionId) {
      const { data: session } = await supabase
        .from("reading_sessions")
        .select("id, scheduled_time, started_at, book:books(title)")
        .eq("id", readingSessionId)
        .eq("user_id", userId)
        .maybeSingle();

      const scheduled = parseTimeToMinutes(
        typeof session?.scheduled_time === "string"
          ? session.scheduled_time
          : null
      );

      if (
        session?.id &&
        !session.started_at &&
        scheduled !== null &&
        localMinutes >= scheduled
      ) {
        const key = "lexicon_reading_not_started";
        const alreadySent = await alreadySentProactive({
          supabase,
          userId,
          manager: "lexicon",
          dateOnly,
          key,
        });
        if (!alreadySent) {
          const title =
            typeof (session as { book?: unknown })?.book === "object" &&
            (session as { book?: { title?: unknown } }).book &&
            typeof (session as { book?: { title?: unknown } }).book?.title ===
              "string"
              ? String((session as { book?: { title?: unknown } }).book?.title)
              : "your book";

          const message = `Quick nudge: your reading session was scheduled for now. Ready to dive into “${title}”? Even 10 minutes counts.`;
          await sendProactiveMessage({
            supabase,
            userId,
            manager: "lexicon",
            dateOnly,
            key,
            message,
          });
          try {
            await sendProactiveEmail({
              userEmail,
              userName,
              manager: "lexicon",
              message,
            });
          } catch {}
          sent.push({ manager: "lexicon", key });
        }
      }
    }

    if (sent.length) {
      results.push({ userId, dateOnly, sent });
    }
  }

  return results;
}

function assertCronAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;
  const got = request.headers.get("x-cron-secret");
  return got === expected;
}

export async function GET(request: Request) {
  if (!assertCronAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  const results = await runChecks();
  return NextResponse.json({ ok: true, results });
}

export async function POST(request: Request) {
  return GET(request);
}
