import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Resend } from "resend";
import { z } from "zod";

import { getRecipeNutrition, searchRecipes } from "@/lib/nutrition/food-api";
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDailyPlanEmailHtml(params: {
  userName: string;
  planDate: string;
  atlasMorningMessage: string;
}) {
  const titleName = params.userName.trim() ? params.userName.trim() : "there";
  const safeMessage = escapeHtml(params.atlasMorningMessage).replaceAll(
    "\n",
    "<br />"
  );
  const safeDate = escapeHtml(params.planDate);
  return [
    "<!doctype html>",
    "<html>",
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    "<title>Daily Plan</title>",
    "</head>",
    '<body style="margin:0;background:#0b0b0c;color:#e6e6e6;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto;">',
    '<div style="max-width:640px;margin:0 auto;padding:24px;">',
    `<h1 style="margin:0 0 8px;font-size:20px;line-height:1.2;">Good morning, ${escapeHtml(titleName)}.</h1>`,
    `<div style="margin:0 0 16px;color:#a1a1aa;font-size:13px;">Your plan for ${safeDate}</div>`,
    '<div style="background:#111113;border:1px solid #27272a;border-radius:14px;padding:16px;font-size:14px;line-height:1.5;white-space:normal;">',
    safeMessage,
    "</div>",
    '<div style="margin-top:16px;color:#a1a1aa;font-size:12px;">Open the dashboard to log meals, workout, and reading.</div>',
    "</div>",
    "</body>",
    "</html>",
  ].join("");
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

function parseNumberAndUnit(input: unknown) {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw) return null;
  const match = raw.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const unit = match[2]?.trim() ?? "";
  const normalizedUnit = unit
    .replaceAll("µg", "mcg")
    .replaceAll("μg", "mcg")
    .replaceAll("ug", "mcg")
    .replaceAll(" ", "");
  return { value, unit: normalizedUnit };
}

function convertAmount(
  parsed: { value: number; unit: string },
  toUnit: "mcg" | "mg" | "g"
) {
  const value = parsed.value;
  const unit = parsed.unit.toLowerCase();
  if (!Number.isFinite(value)) return null;

  const baseToMcg = () => {
    if (unit === "mcg") return value;
    if (unit === "mg") return value * 1000;
    if (unit === "g") return value * 1_000_000;
    if (unit === "iu") return value * 0.025;
    return null;
  };

  const baseToMg = () => {
    if (unit === "mg") return value;
    if (unit === "mcg") return value / 1000;
    if (unit === "g") return value * 1000;
    return null;
  };

  const baseToG = () => {
    if (unit === "g") return value;
    if (unit === "mg") return value / 1000;
    if (unit === "mcg") return value / 1_000_000;
    return null;
  };

  if (toUnit === "mcg") return baseToMcg();
  if (toUnit === "mg") return baseToMg();
  return baseToG();
}

function extractNutritionWidgetItems(widget: unknown) {
  if (!widget || typeof widget !== "object") return [];
  const record = widget as Record<string, unknown>;
  const groups = [record.good, record.bad, record.nutrients].filter(Boolean);
  const items: Array<Record<string, unknown>> = [];
  for (const group of groups) {
    if (Array.isArray(group)) {
      for (const entry of group) {
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          items.push(entry as Record<string, unknown>);
        }
      }
    }
  }
  return items;
}

function nutritionFromWidget(widget: unknown) {
  const items = extractNutritionWidgetItems(widget);
  const pick = (
    matcher: (title: string) => boolean,
    toUnit: "mcg" | "mg" | "g"
  ) => {
    for (const item of items) {
      const title = typeof item.title === "string" ? item.title.trim() : "";
      if (!title) continue;
      if (!matcher(title)) continue;
      const parsed = parseNumberAndUnit(item.amount);
      if (!parsed) continue;
      const converted = convertAmount(parsed, toUnit);
      if (
        typeof converted === "number" &&
        Number.isFinite(converted) &&
        converted >= 0
      ) {
        return converted;
      }
    }
    return null;
  };

  const lowerIncludes = (needle: string) => (title: string) =>
    title.toLowerCase().includes(needle);

  return {
    fiber_g: pick(
      (t) => lowerIncludes("fiber")(t) || lowerIncludes("dietary fiber")(t),
      "g"
    ),
    vitamin_b12_mcg: pick((t) => lowerIncludes("vitamin b12")(t), "mcg"),
    vitamin_d_mcg: pick((t) => lowerIncludes("vitamin d")(t), "mcg"),
    iron_mg: pick((t) => lowerIncludes("iron")(t), "mg"),
    calcium_mg: pick((t) => lowerIncludes("calcium")(t), "mg"),
    magnesium_mg: pick((t) => lowerIncludes("magnesium")(t), "mg"),
    omega3_g: pick(
      (t) =>
        lowerIncludes("omega-3")(t) ||
        lowerIncludes("omega 3")(t) ||
        lowerIncludes("omega 3 fatty")(t),
      "g"
    ),
  };
}

type ShoppingIngredient = {
  name: string;
  quantity: number;
  unit: string;
};

type ShoppingListItem = {
  name: string;
  totalQuantity: number;
  unit: string;
  category: string;
  estimatedCost: number;
  checked: boolean;
};

function normalizeIngredientName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function parseIngredient(raw: unknown): ShoppingIngredient | null {
  if (typeof raw === "string") {
    const name = normalizeIngredientName(raw);
    if (!name) return null;
    return { name, quantity: 1, unit: "" };
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const nameRaw = typeof record.name === "string" ? record.name : "";
  const name = normalizeIngredientName(nameRaw);
  if (!name) return null;

  const unit = typeof record.unit === "string" ? record.unit.trim() : "";

  const quantityRaw = record.quantity ?? record.amount ?? record.qty;
  const quantity =
    typeof quantityRaw === "number" && Number.isFinite(quantityRaw)
      ? quantityRaw
      : typeof quantityRaw === "string" && quantityRaw.trim()
        ? Number.parseFloat(quantityRaw)
        : 1;

  return {
    name,
    quantity: Number.isFinite(quantity) ? quantity : 1,
    unit,
  };
}

function categorizeIngredient(name: string) {
  const n = name.toLowerCase();

  const includesAny = (tokens: string[]) => tokens.some((t) => n.includes(t));

  if (
    includesAny([
      "apple",
      "banana",
      "berries",
      "blueberr",
      "strawberr",
      "raspberr",
      "spinach",
      "tomato",
      "lettuce",
      "onion",
      "garlic",
      "broccoli",
      "pepper",
      "cucumber",
      "carrot",
      "avocado",
      "lemon",
      "lime",
    ])
  ) {
    return "produce";
  }

  if (
    includesAny([
      "chicken",
      "turkey",
      "beef",
      "pork",
      "lamb",
      "salmon",
      "tuna",
      "cod",
      "shrimp",
      "egg",
    ])
  ) {
    return "meat";
  }

  if (includesAny(["milk", "yogurt", "cheese", "butter", "kefir"])) {
    return "dairy";
  }

  if (
    includesAny([
      "rice",
      "quinoa",
      "oats",
      "bread",
      "wrap",
      "pasta",
      "tortilla",
      "flour",
    ])
  ) {
    return "grains";
  }

  if (
    includesAny([
      "olive oil",
      "oil",
      "salt",
      "pepper",
      "honey",
      "vinegar",
      "mustard",
      "sauce",
      "spice",
      "paprika",
      "cumin",
      "cinnamon",
    ])
  ) {
    return "pantry";
  }

  return "other";
}

function estimateCost(params: {
  name: string;
  quantity: number;
  unit: string;
}) {
  const unit = params.unit.toLowerCase();
  const q = params.quantity;
  if (!Number.isFinite(q) || q <= 0) return 0;

  const category = categorizeIngredient(params.name);
  const basePerItem =
    category === "meat"
      ? 3.5
      : category === "dairy"
        ? 1.5
        : category === "produce"
          ? 1.0
          : category === "grains"
            ? 0.8
            : 0.5;

  if (unit === "g") return Math.max(0, (q / 1000) * basePerItem * 3);
  if (unit === "kg") return Math.max(0, q * basePerItem * 3);
  if (unit === "ml") return Math.max(0, (q / 1000) * basePerItem * 2);
  if (unit === "l") return Math.max(0, q * basePerItem * 2);

  return Math.max(0, Math.min(20, q * basePerItem));
}

function buildShoppingListFromMeals(params: {
  meals: Array<{ ingredients?: unknown }>;
}) {
  const ingredientMap = new Map<
    string,
    Omit<ShoppingListItem, "category"> & { category: string }
  >();

  for (const meal of params.meals) {
    const ingredients = (meal as { ingredients?: unknown }).ingredients;
    if (!Array.isArray(ingredients)) continue;

    for (const raw of ingredients) {
      const parsed = parseIngredient(raw);
      if (!parsed) continue;

      const nameKey = parsed.name.toLowerCase();
      const unitKey = parsed.unit.toLowerCase();
      const key = `${nameKey}::${unitKey}`;

      const category = categorizeIngredient(parsed.name);
      const estimatedCost = estimateCost({
        name: parsed.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
      });

      const existing = ingredientMap.get(key);
      if (existing) {
        existing.totalQuantity += parsed.quantity;
        existing.estimatedCost += estimatedCost;
      } else {
        ingredientMap.set(key, {
          name: parsed.name,
          totalQuantity: parsed.quantity,
          unit: parsed.unit,
          category,
          estimatedCost,
          checked: false,
        });
      }
    }
  }

  const grouped = Array.from(ingredientMap.values()).reduce(
    (acc, item) => {
      const key = item.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, ShoppingListItem[]>
  );

  for (const items of Object.values(grouped)) {
    items.sort((a, b) => a.name.localeCompare(b.name));
  }

  const totalEstimatedCost = Array.from(ingredientMap.values()).reduce(
    (sum, item) =>
      sum + (Number.isFinite(item.estimatedCost) ? item.estimatedCost : 0),
    0
  );

  return { items: grouped, totalEstimatedCost };
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

  const { data: existingPlan } = await supabase
    .from("daily_plans")
    .select("id, coordination_log")
    .eq("user_id", body.userId)
    .eq("plan_date", planDate)
    .maybeSingle();

  const existingNotifications =
    existingPlan &&
    typeof (existingPlan as { coordination_log?: unknown }).coordination_log ===
      "object" &&
    (existingPlan as { coordination_log?: unknown }).coordination_log !==
      null &&
    !Array.isArray(
      (existingPlan as { coordination_log?: unknown }).coordination_log
    )
      ? (
          (existingPlan as { coordination_log?: unknown })
            .coordination_log as Record<string, unknown>
        ).notifications
      : null;

  const existingDailyPlanEmailSentAt =
    existingNotifications &&
    typeof existingNotifications === "object" &&
    !Array.isArray(existingNotifications) &&
    typeof (existingNotifications as { dailyPlanEmailSentAt?: unknown })
      .dailyPlanEmailSentAt === "string"
      ? String(
          (existingNotifications as { dailyPlanEmailSentAt?: unknown })
            .dailyPlanEmailSentAt
        )
      : null;

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
    notifications:
      existingNotifications &&
      typeof existingNotifications === "object" &&
      !Array.isArray(existingNotifications)
        ? existingNotifications
        : undefined,
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

        const mealsToInsertBase = olivePlan.meals.map((m) => ({
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

        const canEnrich =
          typeof process.env.SPOONACULAR_API_KEY === "string" &&
          process.env.SPOONACULAR_API_KEY.trim();

        const mealsToInsert = canEnrich
          ? await Promise.all(
              mealsToInsertBase.map(async (meal) => {
                try {
                  const results = await searchRecipes({
                    query: meal.name,
                    calories:
                      typeof meal.calories === "number"
                        ? meal.calories
                        : undefined,
                    protein:
                      typeof meal.protein_g === "number"
                        ? meal.protein_g
                        : undefined,
                    number: 1,
                  });
                  const first = Array.isArray(results) ? results[0] : null;
                  const recipeId =
                    first && typeof first === "object" && "id" in first
                      ? Number((first as { id?: unknown }).id)
                      : null;
                  if (!recipeId || !Number.isFinite(recipeId)) return meal;

                  const widget = await getRecipeNutrition(recipeId);
                  const micros = nutritionFromWidget(widget);
                  return {
                    ...meal,
                    fiber_g: micros.fiber_g,
                    vitamin_b12_mcg: micros.vitamin_b12_mcg,
                    vitamin_d_mcg: micros.vitamin_d_mcg,
                    iron_mg: micros.iron_mg,
                    calcium_mg: micros.calcium_mg,
                    magnesium_mg: micros.magnesium_mg,
                    omega3_g: micros.omega3_g,
                  };
                } catch {
                  return meal;
                }
              })
            )
          : mealsToInsertBase;

        if (mealsToInsert.length) {
          await supabase.from("meals").insert(mealsToInsert);

          const shopping = buildShoppingListFromMeals({
            meals: mealsToInsert,
          });

          if (Object.keys(shopping.items).length) {
            const { data: existingList } = await supabase
              .from("shopping_lists")
              .select("id")
              .eq("meal_plan_id", mealPlanId)
              .eq("user_id", body.userId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (existingList?.id) {
              await supabase
                .from("shopping_lists")
                .update({
                  shopping_date: planDate,
                  items: shopping.items,
                  total_estimated_cost: shopping.totalEstimatedCost,
                  completed: false,
                  completed_at: null,
                })
                .eq("id", String((existingList as { id?: unknown }).id))
                .eq("user_id", body.userId);
            } else {
              await supabase.from("shopping_lists").insert({
                meal_plan_id: mealPlanId,
                user_id: body.userId,
                shopping_date: planDate,
                items: shopping.items,
                total_estimated_cost: shopping.totalEstimatedCost,
              });
            }
          }
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

  const userEmail = String((user as { email?: unknown } | null)?.email ?? "");
  const resendKey =
    typeof process.env.RESEND_API_KEY === "string"
      ? process.env.RESEND_API_KEY.trim()
      : "";
  const resendFrom =
    typeof process.env.RESEND_FROM === "string" &&
    process.env.RESEND_FROM.trim()
      ? process.env.RESEND_FROM.trim()
      : "Super Mentor <notifications@supermentor.app>";

  const canSendEmail =
    !!resendKey &&
    !!userEmail.trim() &&
    !!atlasMorningMessage.trim() &&
    !existingDailyPlanEmailSentAt;

  if (canSendEmail && upserted?.id) {
    try {
      const resend = new Resend(resendKey);
      const { data } = await resend.emails.send({
        from: resendFrom,
        to: userEmail,
        subject: `Your plan for ${planDate}`,
        html: formatDailyPlanEmailHtml({
          userName,
          planDate,
          atlasMorningMessage,
        }),
      });

      const notifications = {
        ...(existingNotifications &&
        typeof existingNotifications === "object" &&
        !Array.isArray(existingNotifications)
          ? (existingNotifications as Record<string, unknown>)
          : {}),
        dailyPlanEmailSentAt: new Date().toISOString(),
        dailyPlanEmailTo: userEmail,
        dailyPlanEmailId:
          data && typeof data === "object" && "id" in data
            ? (data as { id?: unknown }).id
            : null,
      };

      await supabase
        .from("daily_plans")
        .update({
          coordination_log: {
            ...(coordinationLog as unknown as Record<string, unknown>),
            notifications,
          },
        })
        .eq("id", String((upserted as { id?: unknown }).id))
        .eq("user_id", body.userId);
    } catch {}
  }

  return NextResponse.json({ ok: true, dailyPlan: upserted });
}
