import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  computeFreeTimeWindows,
  dayOfWeekFromDateOnly,
  parseTimeToMinutes,
} from "@/lib/utils";

const BodySchema = z.object({
  userId: z.string().min(1),
  planDate: z.string().optional(),
});

const WorkoutTypeSchema = z.enum([
  "strength",
  "cardio",
  "hiit",
  "yoga",
  "active_recovery",
  "rest",
]);
const IntensitySchema = z.enum(["low", "moderate", "high"]);

const ForgePlanSchema = z
  .object({
    scheduled_time: z.string().optional(),
    workout_type: WorkoutTypeSchema,
    focus_areas: z.array(z.string()).optional(),
    exercises: z.array(z.record(z.unknown())).optional(),
    total_duration_minutes: z.number().int().positive(),
    intensity: IntensitySchema,
  })
  .passthrough();

const MealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

const OliveMealSchema = z
  .object({
    meal_type: MealTypeSchema,
    scheduled_time: z.string(),
    name: z.string().min(1),
    ingredients: z.array(z.unknown()).optional(),
    preparation_steps: z.array(z.string()).optional(),
    calories: z.number().optional(),
    protein_g: z.number().optional(),
    carbs_g: z.number().optional(),
    fats_g: z.number().optional(),
  })
  .passthrough();

const OlivePlanSchema = z
  .object({
    meals: z.array(OliveMealSchema),
  })
  .passthrough();

function formatPlanDateInTimeZone(timeZone: string | null | undefined) {
  const tz =
    typeof timeZone === "string" && timeZone.trim() ? timeZone.trim() : "UTC";
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return formatted;
}

function safeJsonString(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "null";
  }
}

type ManagerKey = "forge" | "olive" | "lexicon" | "atlas";

function getClientAndModelForManager(manager: ManagerKey) {
  const openaiKey = process.env.OPENAI_API_KEY || null;
  const kimiKey = process.env.KIMI_API_KEY || null;
  const deepseekKey = process.env.DEEPSEEK_API_KEY || null;

  if (manager === "forge" && deepseekKey) {
    return {
      client: new OpenAI({
        apiKey: deepseekKey,
        baseURL: "https://api.deepseek.com",
      }),
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      provider: "deepseek" as const,
    };
  }

  if ((manager === "olive" || manager === "lexicon") && kimiKey) {
    return {
      client: new OpenAI({
        apiKey: kimiKey,
        baseURL: process.env.KIMI_BASE_URL || "https://api.moonshot.ai/v1",
      }),
      model: process.env.KIMI_MODEL || "kimi-k2-0905-preview",
      provider: "kimi" as const,
    };
  }

  if (!openaiKey) {
    return null;
  }

  return {
    client: new OpenAI({ apiKey: openaiKey }),
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    provider: "openai" as const,
  };
}

function getTeamContextLines() {
  return [
    "TEAM CONTEXT:",
    "- This is a 4-manager system:",
    '  - Atlas: master coordinator and final decision maker (the "big boss")',
    "  - Forge: fitness, workouts, recovery, balanced muscle development",
    "  - Olive: nutrition, meal planning, micronutrients, health-first guidance",
    "  - Lexicon: reading, learning, deep discussion, habit-building",
  ];
}

function getManagerSystemPrompt(manager: ManagerKey, userName: string) {
  const userLabel = userName.trim() ? userName.trim() : "the user";

  if (manager === "forge") {
    return [
      `You are Forge, ${userLabel}'s fitness manager.`,
      "MODEL: DeepSeek-V3.1",
      "",
      ...getTeamContextLines(),
      "",
      "OUTPUT (JSON only, no markdown):",
      "{",
      '  "scheduled_time": "HH:MM",',
      '  "workout_type": "strength" | "cardio" | "hiit" | "yoga" | "active_recovery" | "rest",',
      '  "focus_areas": ["legs", "chest"],',
      '  "exercises": [ { "name": "Exercise", "sets": 3, "reps": 10, "rest_seconds": 90, "form_cues": ["..."] } ],',
      '  "total_duration_minutes": 45,',
      '  "intensity": "low" | "moderate" | "high"',
      "}",
    ].join("\n");
  }

  if (manager === "olive") {
    return [
      `You are Olive, ${userLabel}'s nutrition and health manager.`,
      "MODEL: Kimi K2-0905",
      "",
      ...getTeamContextLines(),
      "",
      "OUTPUT (JSON only, no markdown):",
      "{",
      '  "meals": [',
      "    {",
      '      "meal_type": "breakfast" | "lunch" | "dinner" | "snack",',
      '      "scheduled_time": "HH:MM",',
      '      "name": "Meal name",',
      '      "ingredients": [ { "name": "ingredient", "quantity": 1, "unit": "x" } ],',
      '      "preparation_steps": ["..."],',
      '      "calories": 500,',
      '      "protein_g": 30,',
      '      "carbs_g": 60,',
      '      "fats_g": 15',
      "    }",
      "  ]",
      "}",
    ].join("\n");
  }

  if (manager === "lexicon") {
    return [
      `You are Lexicon, ${userLabel}'s reading and learning manager.`,
      "MODEL: Kimi K2-0905 (long-context reading discussions)",
      "",
      ...getTeamContextLines(),
      "",
      "OUTPUT:",
      "- Provide one realistic reading session suggestion for today (time window + duration).",
      "- Include 2-4 discussion prompts/questions.",
      "- Avoid guilt; focus on consistency.",
    ].join("\n");
  }

  return [
    `You are Atlas, the master coordinator and supreme guardian of ${userLabel}'s holistic health journey.`,
    "MODEL: GPT-5.2",
    "",
    ...getTeamContextLines(),
    "",
    "OUTPUT RULES:",
    "- Write a single morning plan message (plain text).",
    "- Include: Workout, Meals, Reading, and a short rationale.",
    "- Explicitly mention when you modified or rejected a specialist suggestion and why.",
    "- If key info is missing, ask up to 3 clarifying questions at the end.",
  ].join("\n");
}

async function callManager(params: {
  client: OpenAI;
  model: string;
  system: string;
  context: unknown;
  prompt: string;
  temperature: number;
}) {
  const completion = await params.client.chat.completions.create({
    model: params.model,
    messages: [
      { role: "system", content: params.system },
      {
        role: "system",
        content: "User context (JSON): " + safeJsonString(params.context),
      },
      { role: "user", content: params.prompt },
    ],
    temperature: params.temperature,
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice) as unknown;
  } catch {
    return null;
  }
}

function normalizeTime(value: string | null | undefined, fallback: string) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return fallback;
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return fallback;
  const hh = Math.min(23, Math.max(0, Number(match[1])));
  const mm = Math.min(59, Math.max(0, Number(match[2])));
  const ss = match[3] ? Math.min(59, Math.max(0, Number(match[3]))) : 0;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

type ScheduleRow = {
  id: string;
  start_date: string | null;
  end_date: string | null;
  schedule_type: string | null;
  days_of_week: number[] | null;
  event_type: string | null;
  start_time: string | null;
  end_time: string | null;
  specific_date: string | null;
  title: string | null;
  is_flexible: boolean | null;
  priority: number | null;
};

function normalizeHHMM(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hh = Math.min(23, Math.max(0, Number(match[1])));
  const mm = Math.min(59, Math.max(0, Number(match[2])));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function chooseTimeWithinWindows(params: {
  desiredTime: string | null | undefined;
  durationMinutes: number;
  freeWindows: Array<{ startTime: string; endTime: string }>;
  fallback: string;
}) {
  const desiredMinutes = parseTimeToMinutes(params.desiredTime ?? null);
  if (desiredMinutes !== null) {
    for (const w of params.freeWindows) {
      const start = parseTimeToMinutes(w.startTime);
      const end = parseTimeToMinutes(w.endTime);
      if (start === null || end === null) continue;
      if (
        desiredMinutes >= start &&
        desiredMinutes + params.durationMinutes <= end
      ) {
        return params.desiredTime as string;
      }
    }
  }

  for (const w of params.freeWindows) {
    const start = parseTimeToMinutes(w.startTime);
    const end = parseTimeToMinutes(w.endTime);
    if (start === null || end === null) continue;
    if (end - start >= params.durationMinutes) return w.startTime;
  }

  return params.fallback;
}

function chooseTimeAfter(params: {
  afterTime: string;
  durationMinutes: number;
  freeWindows: Array<{ startTime: string; endTime: string }>;
  fallback: string;
}) {
  const afterMinutes = parseTimeToMinutes(params.afterTime);
  if (afterMinutes === null) return params.fallback;

  for (const w of params.freeWindows) {
    const start = parseTimeToMinutes(w.startTime);
    const end = parseTimeToMinutes(w.endTime);
    if (start === null || end === null) continue;
    const candidate = Math.max(start, afterMinutes);
    if (candidate + params.durationMinutes <= end) {
      return `${String(Math.floor(candidate / 60)).padStart(2, "0")}:${String(candidate % 60).padStart(2, "0")}`;
    }
  }

  return params.fallback;
}

export async function POST(request: Request) {
  const body = BodySchema.parse(await request.json());

  const hasAnyKey =
    !!process.env.OPENAI_API_KEY ||
    !!process.env.KIMI_API_KEY ||
    !!process.env.DEEPSEEK_API_KEY;
  if (!hasAnyKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing API keys. Set at least one of: OPENAI_API_KEY, KIMI_API_KEY, DEEPSEEK_API_KEY.",
      },
      { status: 500 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select(
      "id, name, age, gender, height_cm, timezone, activity_level, injuries, medical_conditions, dietary_restrictions, food_dislikes, favorite_cuisines, cooking_skill, budget_level, reading_speed_wpm, favorite_genres, sleep_schedule, work_schedule, stress_level"
    )
    .eq("id", body.userId)
    .maybeSingle();

  if (userError) {
    return NextResponse.json(
      { ok: false, error: userError.message },
      { status: 500 }
    );
  }

  const planDate =
    typeof body.planDate === "string" && body.planDate.trim()
      ? body.planDate.trim()
      : formatPlanDateInTimeZone(
          (user as { timezone?: unknown } | null)?.timezone as string | null
        );

  const planDayOfWeek = dayOfWeekFromDateOnly(planDate);

  const sleepObject =
    user &&
    typeof (user as { sleep_schedule?: unknown }).sleep_schedule === "object"
      ? ((user as { sleep_schedule?: unknown }).sleep_schedule as Record<
          string,
          unknown
        >)
      : null;
  const wakeTime = normalizeHHMM(sleepObject?.typicalWakeTime);
  const bedtime = normalizeHHMM(sleepObject?.typicalBedtime);
  const scheduleRangeStart = wakeTime ?? "06:30";
  const scheduleRangeEnd = bedtime ?? "23:00";

  const { data: scheduleRows } = await supabase
    .from("user_schedules")
    .select(
      "id, start_date, end_date, schedule_type, days_of_week, event_type, start_time, end_time, specific_date, title, is_flexible, priority"
    )
    .eq("user_id", body.userId)
    .limit(500);

  const todaySchedule = ((scheduleRows as ScheduleRow[] | null) ?? [])
    .filter((row) => {
      if (row.start_date && row.start_date > planDate) return false;
      if (row.end_date && row.end_date < planDate) return false;
      return true;
    })
    .filter((row) => {
      if (row.specific_date) return row.specific_date === planDate;
      if (planDayOfWeek === null) return false;
      return (row.days_of_week ?? []).includes(planDayOfWeek);
    })
    .filter((row) => !!row.start_time && !!row.end_time)
    .sort((a, b) => {
      const aMin = parseTimeToMinutes(a.start_time) ?? 0;
      const bMin = parseTimeToMinutes(b.start_time) ?? 0;
      return aMin - bMin;
    });

  const freeTimeWindows = computeFreeTimeWindows({
    busy: todaySchedule.map((e) => ({
      startTime: e.start_time,
      endTime: e.end_time,
    })),
    rangeStartTime: scheduleRangeStart,
    rangeEndTime: scheduleRangeEnd,
  });

  const { data: goals } = await supabase
    .from("goals")
    .select(
      "category, goal_type, description, target_weight_kg, target_measurements, status"
    )
    .eq("user_id", body.userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(25);

  const { data: latestMeasurement } = await supabase
    .from("measurements")
    .select(
      "measured_at, weight_kg, belly_cm, chest_cm, biceps_left_cm, biceps_right_cm, calves_left_cm, calves_right_cm, thighs_left_cm, thighs_right_cm, shoulders_cm, neck_cm, body_fat_percentage"
    )
    .eq("user_id", body.userId)
    .order("measured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const context = {
    planDate,
    user,
    goals,
    latestMeasurement,
    schedule: {
      rangeStartTime: scheduleRangeStart,
      rangeEndTime: scheduleRangeEnd,
      events: todaySchedule,
      freeTimeWindows,
    },
  };

  const userName = String((user as { name?: unknown } | null)?.name ?? "");

  const forgeSystem = getManagerSystemPrompt("forge", userName);
  const oliveSystem = getManagerSystemPrompt("olive", userName);
  const lexiconSystem = getManagerSystemPrompt("lexicon", userName);
  const atlasSystem = getManagerSystemPrompt("atlas", userName);

  let forgeSuggestion = "";
  let oliveSuggestion = "";
  let lexiconSuggestion = "";

  let forgePlan: z.infer<typeof ForgePlanSchema> | null = null;
  let olivePlan: z.infer<typeof OlivePlanSchema> | null = null;

  try {
    const forgeClient = getClientAndModelForManager("forge");
    if (!forgeClient) throw new Error("No available client for Forge");
    forgeSuggestion = await callManager({
      client: forgeClient.client,
      model: forgeClient.model,
      system: forgeSystem,
      context,
      prompt: `Provide Forge's workout suggestion for ${planDate}.`,
      temperature: 0.6,
    });
    const parsed = extractJsonObject(forgeSuggestion);
    const validated = ForgePlanSchema.safeParse(parsed);
    if (validated.success) {
      forgePlan = validated.data;
    }
  } catch {}

  try {
    const oliveClient = getClientAndModelForManager("olive");
    if (!oliveClient) throw new Error("No available client for Olive");
    oliveSuggestion = await callManager({
      client: oliveClient.client,
      model: oliveClient.model,
      system: oliveSystem,
      context: { ...context, forgeSuggestion },
      prompt: `Provide Olive's meal plan suggestion for ${planDate}.`,
      temperature: 0.6,
    });
    const parsed = extractJsonObject(oliveSuggestion);
    const validated = OlivePlanSchema.safeParse(parsed);
    if (validated.success) {
      olivePlan = validated.data;
    }
  } catch {}

  try {
    const lexiconClient = getClientAndModelForManager("lexicon");
    if (!lexiconClient) throw new Error("No available client for Lexicon");
    lexiconSuggestion = await callManager({
      client: lexiconClient.client,
      model: lexiconClient.model,
      system: lexiconSystem,
      context,
      prompt: `Provide Lexicon's reading session suggestion for ${planDate}.`,
      temperature: 0.6,
    });
  } catch {}

  const coordinationLog = {
    planDate,
    forge: { suggestion: forgeSuggestion },
    olive: { suggestion: oliveSuggestion },
    lexicon: { suggestion: lexiconSuggestion },
    parsed: {
      forgePlan,
      olivePlan,
    },
  };

  let workoutPlanId: string | null = null;
  let mealPlanId: string | null = null;
  let readingSessionId: string | null = null;

  if (forgePlan) {
    try {
      const duration = Math.max(
        10,
        Math.min(240, forgePlan.total_duration_minutes)
      );
      const chosen = chooseTimeWithinWindows({
        desiredTime: forgePlan.scheduled_time ?? null,
        durationMinutes: duration,
        freeWindows: freeTimeWindows,
        fallback: "07:30",
      });
      const scheduledTime = normalizeTime(chosen, "07:30:00");
      const { data: inserted, error: insertError } = await supabase
        .from("workout_plans")
        .insert({
          user_id: body.userId,
          scheduled_date: planDate,
          scheduled_time: scheduledTime,
          workout_type: forgePlan.workout_type,
          focus_areas: forgePlan.focus_areas ?? [],
          generation_context: {
            source: "daily_planning",
            manager: "forge",
            planDate,
          },
          exercises: forgePlan.exercises ?? [],
          total_duration_minutes: duration,
          intensity: forgePlan.intensity,
          approved_by_atlas: false,
        })
        .select("id")
        .single();

      if (!insertError && inserted?.id) {
        workoutPlanId = String((inserted as { id: unknown }).id);
      }
    } catch {}
  }

  if (olivePlan && olivePlan.meals.length) {
    try {
      const { data: insertedMealPlan, error: mealPlanError } = await supabase
        .from("meal_plans")
        .insert({
          user_id: body.userId,
          start_date: planDate,
          end_date: planDate,
          status: "proposed",
          generation_context: {
            source: "daily_planning",
            manager: "olive",
            planDate,
          },
        })
        .select("id")
        .single();

      if (!mealPlanError && insertedMealPlan?.id) {
        mealPlanId = String((insertedMealPlan as { id: unknown }).id);

        const mealsToInsert = olivePlan.meals.map((m) => ({
          meal_plan_id: mealPlanId,
          user_id: body.userId,
          meal_type: m.meal_type,
          scheduled_date: planDate,
          scheduled_time: normalizeTime(m.scheduled_time, "12:00:00"),
          name: m.name,
          ingredients: m.ingredients ?? [],
          preparation_steps: m.preparation_steps ?? null,
          calories: typeof m.calories === "number" ? m.calories : null,
          protein_g: typeof m.protein_g === "number" ? m.protein_g : null,
          carbs_g: typeof m.carbs_g === "number" ? m.carbs_g : null,
          fats_g: typeof m.fats_g === "number" ? m.fats_g : null,
        }));

        if (mealsToInsert.length) {
          await supabase.from("meals").insert(mealsToInsert);
        }
      }
    } catch {}
  }

  try {
    const { data: currentBook } = await supabase
      .from("books")
      .select("id, status, priority, added_at")
      .eq("user_id", body.userId)
      .eq("status", "reading")
      .order("priority", { ascending: true, nullsFirst: false })
      .order("added_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: fallbackBook } = !currentBook
      ? await supabase
          .from("books")
          .select("id, status, priority, added_at")
          .eq("user_id", body.userId)
          .eq("status", "backlog")
          .order("priority", { ascending: true, nullsFirst: false })
          .order("added_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

    const bookId = (currentBook ?? fallbackBook)?.id
      ? String((currentBook ?? fallbackBook)?.id)
      : null;

    if (bookId) {
      const readingTime = chooseTimeAfter({
        afterTime: "19:00",
        durationMinutes: 30,
        freeWindows: freeTimeWindows,
        fallback: "20:30",
      });
      const { data: inserted, error: insertError } = await supabase
        .from("reading_sessions")
        .insert({
          user_id: body.userId,
          book_id: bookId,
          scheduled_time: normalizeTime(readingTime, "20:30:00"),
          was_scheduled: true,
        })
        .select("id")
        .single();

      if (!insertError && inserted?.id) {
        readingSessionId = String((inserted as { id: unknown }).id);
      }
    }
  } catch {}

  let atlasMorningMessage = "";
  try {
    const atlasClient = getClientAndModelForManager("atlas");
    if (!atlasClient) throw new Error("No available client for Atlas");
    atlasMorningMessage = await callManager({
      client: atlasClient.client,
      model: atlasClient.model,
      system: atlasSystem,
      context: {
        ...context,
        coordinationLog,
        persistedIds: { workoutPlanId, mealPlanId, readingSessionId },
      },
      prompt:
        "You have specialist suggestions from Forge, Olive, and Lexicon in the JSON context. " +
        "Merge them into one coherent plan. Resolve conflicts and keep it realistic.",
      temperature: 0.4,
    });
  } catch {}

  if (!atlasMorningMessage) {
    return NextResponse.json(
      { ok: false, error: "Empty plan from model." },
      { status: 500 }
    );
  }

  try {
    const rows = [
      {
        initiator: "atlas",
        recipient: "forge",
        conversation_context: "daily_planning",
        message: `Workout suggestion request for ${planDate}`,
        response: forgeSuggestion,
        visible_to_user: true,
      },
      {
        initiator: "atlas",
        recipient: "olive",
        conversation_context: "daily_planning",
        message: `Meal plan suggestion request for ${planDate}`,
        response: oliveSuggestion,
        visible_to_user: true,
      },
      {
        initiator: "atlas",
        recipient: "lexicon",
        conversation_context: "daily_planning",
        message: `Reading suggestion request for ${planDate}`,
        response: lexiconSuggestion,
        visible_to_user: true,
      },
    ];
    await supabase.from("manager_conversations").insert(
      rows.map((r) => ({
        ...r,
        response: r.response?.trim() ? r.response : null,
      }))
    );
  } catch {}

  const { data: upserted, error: upsertError } = await supabase
    .from("daily_plans")
    .upsert(
      {
        user_id: body.userId,
        plan_date: planDate,
        atlas_morning_message: atlasMorningMessage,
        coordination_log: coordinationLog,
        workout_plan_id: workoutPlanId,
        meal_plan_id: mealPlanId,
        reading_goal_id: readingSessionId,
        plan_status: "generated",
      },
      { onConflict: "user_id,plan_date" }
    )
    .select(
      "id, plan_date, created_at, atlas_morning_message, plan_status, coordination_log, workout_plan_id, meal_plan_id, reading_goal_id"
    )
    .maybeSingle();

  if (upsertError) {
    return NextResponse.json(
      { ok: false, error: upsertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, dailyPlan: upserted });
}
