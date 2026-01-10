import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

import { generateEmbedding, semanticSearch } from "@/lib/ai/embeddings";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  computeFreeTimeWindows,
  dayOfWeekFromDateOnly,
  minutesToTime,
  parseTimeToMinutes,
} from "@/lib/utils";

const ChatBodySchema = z.object({
  userId: z.string().min(1),
  manager: z.enum(["atlas", "forge", "olive", "lexicon"]),
  message: z.string().min(1),
});

type ConversationRow = {
  id: string;
  created_at: string;
  manager: z.infer<typeof ChatBodySchema>["manager"];
  role: "user" | "assistant" | "system";
  content: string;
};

function parseMealSwapSelection(text: string) {
  const raw = text.trim().toLowerCase();
  if (!raw) return null;
  if (raw === "1" || raw === "2" || raw === "3") return Number(raw);
  const match = raw.match(/\b(?:option|number|num|numer)\s*([123])\b/);
  if (!match) return null;
  const n = Number(match[1]);
  return n >= 1 && n <= 3 ? n : null;
}

function extractTagValue(text: string, tag: string) {
  const match = text.match(new RegExp(`${tag}=([^\\s]+)`, "i"));
  if (!match) return null;
  const v = String(match[1] ?? "").trim();
  return v ? v : null;
}

function parseMealOptions(text: string) {
  const results = new Map<
    number,
    {
      name: string;
      calories: number | null;
      protein_g: number | null;
      carbs_g: number | null;
      fats_g: number | null;
    }
  >();

  const optionHeaderRegex = /^(\s*)Option\s*([123])\s*[–-]\s*(.+?)\s*$/gim;
  const matches = Array.from(text.matchAll(optionHeaderRegex));
  for (let i = 0; i < matches.length; i += 1) {
    const m = matches[i];
    const num = Number(m[2]);
    const name = String(m[3] ?? "").trim();
    if (!name || !(num >= 1 && num <= 3)) continue;

    const start = (m.index ?? 0) + String(m[0] ?? "").length;
    const end =
      i + 1 < matches.length
        ? (matches[i + 1]?.index ?? text.length)
        : text.length;
    const block = text.slice(start, end);

    const macrosMatch = block.match(
      /(\d+(?:\.\d+)?)\s*kcal\s*\|\s*(\d+(?:\.\d+)?)\s*P\s*\|\s*(\d+(?:\.\d+)?)\s*C\s*\|\s*(\d+(?:\.\d+)?)\s*F/i
    );
    const calories = macrosMatch ? Number(macrosMatch[1]) : null;
    const protein_g = macrosMatch ? Number(macrosMatch[2]) : null;
    const carbs_g = macrosMatch ? Number(macrosMatch[3]) : null;
    const fats_g = macrosMatch ? Number(macrosMatch[4]) : null;

    results.set(num, {
      name,
      calories: Number.isFinite(calories as number)
        ? (calories as number)
        : null,
      protein_g: Number.isFinite(protein_g as number)
        ? (protein_g as number)
        : null,
      carbs_g: Number.isFinite(carbs_g as number) ? (carbs_g as number) : null,
      fats_g: Number.isFinite(fats_g as number) ? (fats_g as number) : null,
    });
  }

  return results;
}

const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const TimeHHMMSchema = z
  .string()
  .regex(/^\d{1,2}:\d{2}(?::\d{2})?$/)
  .transform((v) => {
    const trimmed = v.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return trimmed;
    const hh = Math.min(23, Math.max(0, Number(match[1])));
    const mm = Math.min(59, Math.max(0, Number(match[2])));
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  });

const ScheduleEventTypeSchema = z.enum([
  "meeting",
  "appointment",
  "work",
  "workout",
  "meal",
  "reading",
  "sleep",
  "free_time",
]);

const ScheduleTypeSchema = z.enum(["personal", "work"]);

const ScheduleCreateArgsSchema = z.object({
  date: DateOnlySchema,
  title: z.string().min(1).max(120),
  startTime: TimeHHMMSchema,
  endTime: TimeHHMMSchema,
  scheduleType: ScheduleTypeSchema.default("personal"),
  eventType: ScheduleEventTypeSchema.default("meeting"),
  isFlexible: z.boolean().default(false),
  priority: z.number().int().min(1).max(10).default(7),
});

const ScheduleUpdateArgsSchema = z.object({
  scheduleId: z.string().min(1),
  title: z.string().min(1).max(120).optional(),
  startTime: TimeHHMMSchema.optional(),
  endTime: TimeHHMMSchema.optional(),
  scheduleType: ScheduleTypeSchema.optional(),
  eventType: ScheduleEventTypeSchema.optional(),
  isFlexible: z.boolean().optional(),
  priority: z.number().int().min(1).max(10).optional(),
});

const ScheduleListArgsSchema = z.object({
  startDate: DateOnlySchema.optional(),
  endDate: DateOnlySchema.optional(),
  limit: z.number().int().min(1).max(1000).default(500),
});

const ScheduleDeleteArgsSchema = z.object({
  scheduleId: z.string().min(1),
});

const ScheduleActionBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("schedule_create"),
    userId: z.string().min(1),
    args: ScheduleCreateArgsSchema,
  }),
  z.object({
    action: z.literal("schedule_update"),
    userId: z.string().min(1),
    args: ScheduleUpdateArgsSchema,
  }),
  z.object({
    action: z.literal("schedule_delete"),
    userId: z.string().min(1),
    args: ScheduleDeleteArgsSchema,
  }),
  z.object({
    action: z.literal("schedule_list"),
    userId: z.string().min(1),
    args: ScheduleListArgsSchema.optional().default({}),
  }),
]);

const MealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

const MealSwapArgsSchema = z
  .object({
    mealId: z.string().min(1).optional(),
    mealType: MealTypeSchema.optional(),
    scheduledDate: DateOnlySchema.optional(),
    scheduledTime: TimeHHMMSchema.optional(),
    oldMealName: z.string().min(1).optional(),
    newMealName: z.string().min(1),
    calories: z.number().min(0).optional(),
    protein_g: z.number().min(0).optional(),
    carbs_g: z.number().min(0).optional(),
    fats_g: z.number().min(0).optional(),
  })
  .refine(
    (v) =>
      !!v.mealId ||
      (!!v.mealType &&
        !!v.scheduledDate &&
        (!!v.scheduledTime || !!v.oldMealName)),
    {
      message:
        "Provide mealId, or mealType+scheduledDate+(scheduledTime or oldMealName)",
    }
  );

function formatPlanDateInTimeZone(timeZone: string | null | undefined) {
  const tz =
    typeof timeZone === "string" && timeZone.trim() ? timeZone.trim() : "UTC";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizeHHMM(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hh = Math.min(23, Math.max(0, Number(match[1])));
  const mm = Math.min(59, Math.max(0, Number(match[2])));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function getCategoryForManager(
  manager: z.infer<typeof ChatBodySchema>["manager"]
) {
  if (manager === "forge") return "fitness";
  if (manager === "olive") return "nutrition";
  if (manager === "lexicon") return "reading";
  return "general";
}

type ProviderConfig = {
  client: OpenAI;
  model: string;
  provider: "openai" | "kimi" | "deepseek";
};

function getClientConfigsForManager(
  manager: z.infer<typeof ChatBodySchema>["manager"]
): ProviderConfig[] {
  const openaiKey = process.env.OPENAI_API_KEY || null;
  const kimiKey = process.env.KIMI_API_KEY || null;
  const deepseekKey = process.env.DEEPSEEK_API_KEY || null;

  if (manager === "forge" && deepseekKey) {
    const primary: ProviderConfig = {
      client: new OpenAI({
        apiKey: deepseekKey,
        baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
      }),
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      provider: "deepseek" as const,
    };
    return openaiKey
      ? [
          primary,
          {
            client: new OpenAI({ apiKey: openaiKey }),
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            provider: "openai" as const,
          },
        ]
      : [primary];
  }

  if ((manager === "olive" || manager === "lexicon") && kimiKey) {
    const primary: ProviderConfig = {
      client: new OpenAI({
        apiKey: kimiKey,
        baseURL: process.env.KIMI_BASE_URL || "https://api.moonshot.ai/v1",
      }),
      model: process.env.KIMI_MODEL || "kimi-k2-0905-preview",
      provider: "kimi" as const,
    };
    return openaiKey
      ? [
          primary,
          {
            client: new OpenAI({ apiKey: openaiKey }),
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            provider: "openai" as const,
          },
        ]
      : [primary];
  }

  if (!openaiKey) return [];
  return [
    {
      client: new OpenAI({ apiKey: openaiKey }),
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      provider: "openai" as const,
    },
  ];
}

function getManagerSystemPrompt(
  manager: z.infer<typeof ChatBodySchema>["manager"],
  userName: string
) {
  const userLabel = userName.trim() ? userName.trim() : "the user";

  if (manager === "atlas") {
    return [
      `You are Atlas, the master coordinator and supreme guardian of ${userLabel}'s holistic health journey.`,
      "MODEL: GPT-5.2",
      "",
      "TEAM CONTEXT:",
      "- You lead a team of specialist managers:",
      "  - Forge: fitness, workouts, recovery, balanced muscle development",
      "  - Olive: nutrition, meal planning, micronutrients, health-first guidance",
      "  - Lexicon: reading, learning, deep discussion, habit-building",
      '- You are the final decision maker (the "big boss"): you can override any specialist suggestion',
      "",
      "CORE IDENTITY:",
      "- Wise, protective, and long-term oriented",
      "- Holistic: fitness, nutrition, reading, stress, sleep, work-life balance",
      "- You can veto anything that conflicts with sustainability or safety",
      "",
      "RESPONSIBILITIES:",
      "1. Coordinate priorities across fitness, nutrition, and reading",
      "2. Adapt plans to sleep, stress, recovery, schedule, and constraints",
      "3. Shift goals to maintenance when milestones are reached",
      "4. Be the primary interface: clear decisions and rationale",
      "",
      "DECISION FRAMEWORK:",
      "- Prefer sustainable consistency over intensity",
      "- Poor sleep/high stress/low recovery means lower intensity and simpler targets",
      "- When information is missing, ask 1-3 clarifying questions before prescribing",
      "",
      "COMMUNICATION STYLE:",
      '- Warm but authoritative; use "we" language',
      '- Explain tradeoffs briefly ("I’m choosing X because…")',
      "- Be constructive and honest; celebrate wins; avoid guilt",
      "",
      "SAFETY:",
      "- Do not provide medical diagnosis. If symptoms or serious conditions appear, recommend a clinician.",
      "",
      "CONTEXT:",
      "- You will receive a JSON profile context next. Use it; do not invent data not present.",
    ].join("\n");
  }

  if (manager === "forge") {
    return [
      `You are Forge, ${userLabel}'s personal fitness coach and muscle development specialist.`,
      "MODEL: DeepSeek-V3.1",
      "",
      "TEAM CONTEXT:",
      "- You are part of a 4-manager team: Atlas (boss/coordinator), Forge (fitness), Olive (nutrition), Lexicon (reading)",
      '- Atlas is the master coordinator and final decision maker (the "big boss")',
      "- You support Atlas by providing fitness recommendations aligned with holistic wellbeing",
      "- If the user asks who Atlas is, explain Atlas's role in this app clearly and briefly",
      "",
      "CORE IDENTITY:",
      "- Safety-first and recovery-respecting",
      "- Practical and adaptive (not rigid programs)",
      "- Focus on balanced, functional strength and physique proportion",
      "",
      "WORKOUT RULES:",
      "1. If injury, pain, or limitations exist, provide safe alternatives and regressions",
      "2. If sleep is poor or stress is high, reduce intensity and prioritize recovery",
      "3. Fit the plan to available time and equipment",
      "4. Avoid repeating the same hard muscle groups on consecutive days",
      "",
      "OUTPUT FORMAT (default):",
      "- 1-sentence intent for today",
      "- Warm-up (3-8 minutes)",
      "- Main work (exercises, sets/reps, rest)",
      "- Cooldown (2-5 minutes)",
      "- Duration and intensity label (low/moderate/high)",
      "- Two alternatives: shorter version and joint-friendly version",
      "",
      "COMMUNICATION STYLE:",
      "- Motivating, clear, and realistic",
      "- Explain form cues when relevant",
      "- Ask clarifying questions if needed (time available, equipment, last workout, pain)",
      "",
      "CONTEXT:",
      "- You will receive a JSON profile context next. Use it; do not invent data not present.",
    ].join("\n");
  }

  if (manager === "olive") {
    return [
      `You are Olive, ${userLabel}'s nutrition expert, meal planner, and health advisor.`,
      "MODEL: Kimi K2-0905",
      "",
      "TEAM CONTEXT:",
      "- You are part of a 4-manager team: Atlas (boss/coordinator), Forge (fitness), Olive (nutrition), Lexicon (reading)",
      '- Atlas is the master coordinator and final decision maker (the "big boss")',
      "- You support Atlas by providing nutrition and health recommendations aligned with holistic wellbeing",
      "- If the user asks who Atlas is, explain Atlas's role in this app clearly and briefly",
      "",
      "CORE IDENTITY:",
      "- Food as medicine: organ health, energy, and sustainability",
      "- Structured, precise, and preference-aware",
      "- Practical execution (shopping, prep, timing)",
      "",
      "NUTRITION RULES:",
      "1. Respect dietary restrictions, allergies, dislikes, budget, and cooking skill",
      "2. Align meal timing with the user's schedule when available",
      "3. When giving numbers, state if they are estimates",
      "4. Prefer repeatable staples with planned variety; avoid unnecessary complexity",
      "",
      "DEFAULT OUTPUT (when planning is requested):",
      "- Today’s plan (meals + times) or a 3-day plan if asked",
      "- Ingredients with quantities",
      "- Approx calories and macros per meal (estimate if needed)",
      "- Simple prep steps",
      "- Shopping list grouped by category",
      "",
      "SAFETY:",
      "- Do not diagnose. For medical-condition-specific advice, recommend professional guidance.",
      "",
      "CONTEXT:",
      "- You will receive a JSON profile context next. Use it; do not invent data not present.",
    ].join("\n");
  }

  return [
    `You are Lexicon, ${userLabel}'s reading coach, intellectual companion, and guide to wisdom.`,
    "MODEL: Kimi K2-0905 (long-context reading discussions)",
    "",
    "TEAM CONTEXT:",
    "- You are part of a 4-manager team: Atlas (boss/coordinator), Forge (fitness), Olive (nutrition), Lexicon (reading)",
    '- Atlas is the master coordinator and final decision maker (the "big boss")',
    "- You support Atlas by providing reading/learning guidance aligned with holistic wellbeing",
    "- If the user asks who Atlas is, explain Atlas's role in this app clearly and briefly",
    "",
    "CORE IDENTITY:",
    "- Curious, thoughtful, and discussion-oriented",
    "- Helps build a sustainable reading habit without guilt",
    "- Connects ideas to the user’s real life and other goals",
    "",
    "READING RULES:",
    "1. If backlog exists, help prioritize based on current life context",
    "2. Suggest a realistic reading session length and a specific time window",
    "3. Ask reflective questions and help the user extract takeaways",
    "4. Track progress if the user shares pages/time; otherwise ask",
    "",
    "DEFAULT OUTPUT:",
    "- A short plan for the next session (time, duration, what to read)",
    "- 2-4 discussion questions or prompts",
    "- One small habit suggestion (make it easy to execute)",
    "",
    "CONTEXT:",
    "- You will receive a JSON profile context next. Use it; do not invent data not present.",
  ].join("\n");
}

function safeJsonString(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "null";
  }
}

function isExplicitDeletionRequest(message: string) {
  const raw = message.toLowerCase();
  return (
    raw.includes("delete") ||
    raw.includes("remove") ||
    raw.includes("cancel") ||
    raw.includes("clear") ||
    raw.includes("erase")
  );
}

function buildScheduleTools(params: { allowDelete: boolean }) {
  const tools: OpenAI.Chat.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "schedule_list",
        description:
          "List schedule entries for the user. Use this to read the schedule before planning or confirming conflicts.",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            startDate: {
              type: "string",
              description: "YYYY-MM-DD inclusive start date (optional).",
            },
            endDate: {
              type: "string",
              description: "YYYY-MM-DD inclusive end date (optional).",
            },
            limit: {
              type: "number",
              description: "Max rows to return (default 500, max 1000).",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "schedule_create",
        description:
          "Create a single-day schedule block for the user (one-off event). Do not claim it is scheduled unless this tool succeeds.",
        parameters: {
          type: "object",
          additionalProperties: false,
          required: ["date", "title", "startTime", "endTime"],
          properties: {
            date: { type: "string", description: "YYYY-MM-DD" },
            title: { type: "string", description: "Short event title" },
            startTime: { type: "string", description: "HH:MM (24h)" },
            endTime: { type: "string", description: "HH:MM (24h)" },
            scheduleType: { type: "string", enum: ["personal", "work"] },
            eventType: {
              type: "string",
              enum: [
                "meeting",
                "appointment",
                "work",
                "workout",
                "meal",
                "reading",
                "sleep",
                "free_time",
              ],
            },
            isFlexible: { type: "boolean" },
            priority: { type: "number" },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "schedule_update",
        description:
          "Update an existing schedule entry. Do not delete unless the user explicitly requested it.",
        parameters: {
          type: "object",
          additionalProperties: false,
          required: ["scheduleId"],
          properties: {
            scheduleId: { type: "string" },
            title: { type: "string" },
            startTime: { type: "string" },
            endTime: { type: "string" },
            scheduleType: { type: "string", enum: ["personal", "work"] },
            eventType: {
              type: "string",
              enum: [
                "meeting",
                "appointment",
                "work",
                "workout",
                "meal",
                "reading",
                "sleep",
                "free_time",
              ],
            },
            isFlexible: { type: "boolean" },
            priority: { type: "number" },
          },
        },
      },
    },
  ];

  if (params.allowDelete) {
    tools.push({
      type: "function",
      function: {
        name: "schedule_delete",
        description:
          "Delete a schedule entry. Only use if the user explicitly asked to delete/remove/cancel an event.",
        parameters: {
          type: "object",
          additionalProperties: false,
          required: ["scheduleId"],
          properties: {
            scheduleId: { type: "string" },
          },
        },
      },
    });
  }

  return tools;
}

function buildMealTools() {
  const tools: OpenAI.Chat.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "meal_swap",
        description:
          "Replace a meal in the user's meal plan with a newly chosen alternative. Only say it was swapped after this succeeds.",
        parameters: {
          type: "object",
          additionalProperties: false,
          anyOf: [
            { required: ["mealId", "newMealName"] },
            {
              required: [
                "mealType",
                "scheduledDate",
                "scheduledTime",
                "newMealName",
              ],
            },
          ],
          properties: {
            mealId: { type: "string", description: "Existing meal row id" },
            mealType: {
              type: "string",
              enum: ["breakfast", "lunch", "dinner", "snack"],
            },
            scheduledDate: { type: "string", description: "YYYY-MM-DD" },
            scheduledTime: { type: "string", description: "HH:MM (24h)" },
            oldMealName: { type: "string" },
            newMealName: { type: "string", description: "New meal name" },
            calories: { type: "number" },
            protein_g: { type: "number" },
            carbs_g: { type: "number" },
            fats_g: { type: "number" },
          },
        },
      },
    },
  ];

  return tools;
}

async function getScheduleRowsForUser(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  userId: string;
  limit: number;
}) {
  const { data } = await params.supabase
    .from("user_schedules")
    .select(
      "id, start_date, end_date, schedule_type, days_of_week, event_type, start_time, end_time, specific_date, title, is_flexible, priority"
    )
    .eq("user_id", params.userId)
    .limit(params.limit);

  return ((data as unknown[] | null) ?? []) as Array<Record<string, unknown>>;
}

function filterScheduleRowsForDateOnly(params: {
  rows: Array<Record<string, unknown>>;
  dateOnly: string;
}) {
  const planDay = dayOfWeekFromDateOnly(params.dateOnly);
  return params.rows
    .filter((row) => {
      const startDate =
        typeof row.start_date === "string" ? row.start_date : null;
      const endDate = typeof row.end_date === "string" ? row.end_date : null;
      if (startDate && startDate > params.dateOnly) return false;
      if (endDate && endDate < params.dateOnly) return false;
      return true;
    })
    .filter((row) => {
      const specificDate =
        typeof row.specific_date === "string" ? row.specific_date : null;
      if (specificDate) return specificDate === params.dateOnly;
      if (planDay === null) return false;
      const dows = Array.isArray(row.days_of_week)
        ? (row.days_of_week as unknown[]).filter((n) => typeof n === "number")
        : [];
      return dows.includes(planDay);
    })
    .filter((row) => !!row.start_time && !!row.end_time);
}

function overlapsMinutes(params: {
  aStart: number;
  aEnd: number;
  bStart: number;
  bEnd: number;
}) {
  return params.aStart < params.bEnd && params.aEnd > params.bStart;
}

function pickFirstStartTimeInWindows(params: {
  windows: Array<{ startTime: string; endTime: string }>;
  minDurationMinutes: number;
  notBeforeMinutes: number;
}) {
  const minDuration = Math.max(1, Math.round(params.minDurationMinutes));
  const notBefore = Math.max(0, Math.round(params.notBeforeMinutes));

  for (const w of params.windows) {
    const wStart = parseTimeToMinutes(w.startTime);
    const wEnd = parseTimeToMinutes(w.endTime);
    if (wStart === null || wEnd === null) continue;
    const start = Math.max(wStart, notBefore);
    if (wEnd - start >= minDuration) return minutesToTime(start);
  }
  return null;
}

async function autoReschedulePlanAroundScheduleBlock(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  userId: string;
  planDate: string;
  conflictStartMin: number;
  conflictEndMin: number;
  scheduleRangeStart: string;
  scheduleRangeEnd: string;
  scheduleRowsForDate: Array<Record<string, unknown>>;
}) {
  const { data: plan } = await params.supabase
    .from("daily_plans")
    .select("id, workout_plan_id, meal_plan_id, reading_goal_id")
    .eq("user_id", params.userId)
    .eq("plan_date", params.planDate)
    .maybeSingle();

  if (!plan?.id) return null;

  const workoutPlanId = plan.workout_plan_id
    ? String((plan as { workout_plan_id?: unknown }).workout_plan_id)
    : null;
  const mealPlanId = plan.meal_plan_id
    ? String((plan as { meal_plan_id?: unknown }).meal_plan_id)
    : null;
  const readingSessionId = plan.reading_goal_id
    ? String((plan as { reading_goal_id?: unknown }).reading_goal_id)
    : null;

  const rescheduled: {
    workout?: { from: string; to: string };
    meals?: Array<{ id: string; from: string; to: string }>;
    reading?: { from: string; to: string };
  } = {};

  const busyForRescheduling = params.scheduleRowsForDate
    .map((e) => ({
      startMin: parseTimeToMinutes(
        typeof e.start_time === "string" ? e.start_time : null
      ),
      endMin: parseTimeToMinutes(
        typeof e.end_time === "string" ? e.end_time : null
      ),
    }))
    .filter(
      (w): w is { startMin: number; endMin: number } =>
        typeof w.startMin === "number" &&
        Number.isFinite(w.startMin) &&
        typeof w.endMin === "number" &&
        Number.isFinite(w.endMin)
    );

  const addBusy = (startMin: number, endMin: number) => {
    if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) return;
    if (endMin <= startMin) return;
    busyForRescheduling.push({ startMin, endMin });
  };

  const computeWindowsWithBusy = () =>
    computeFreeTimeWindows({
      busy: busyForRescheduling.map((b) => ({
        startTime: minutesToTime(b.startMin),
        endTime: minutesToTime(b.endMin),
      })),
      rangeStartTime: params.scheduleRangeStart,
      rangeEndTime: params.scheduleRangeEnd,
    });

  if (workoutPlanId) {
    const { data: workoutPlan } = await params.supabase
      .from("workout_plans")
      .select("id, scheduled_time, total_duration_minutes, completed")
      .eq("id", workoutPlanId)
      .eq("user_id", params.userId)
      .maybeSingle();

    const isCompleted =
      typeof (workoutPlan as { completed?: unknown } | null)?.completed ===
      "boolean"
        ? Boolean((workoutPlan as { completed?: unknown } | null)?.completed)
        : false;

    const startMin = parseTimeToMinutes(
      typeof (workoutPlan as { scheduled_time?: unknown } | null)
        ?.scheduled_time === "string"
        ? String(
            (workoutPlan as { scheduled_time?: unknown } | null)?.scheduled_time
          )
        : null
    );
    const duration =
      typeof (workoutPlan as { total_duration_minutes?: unknown } | null)
        ?.total_duration_minutes === "number"
        ? Math.max(
            10,
            Math.min(
              240,
              Number(
                (workoutPlan as { total_duration_minutes?: unknown } | null)
                  ?.total_duration_minutes
              )
            )
          )
        : 45;

    if (!isCompleted && startMin !== null) {
      const endMin = startMin + duration;
      if (
        overlapsMinutes({
          aStart: startMin,
          aEnd: endMin,
          bStart: params.conflictStartMin,
          bEnd: params.conflictEndMin,
        })
      ) {
        const windows = computeWindowsWithBusy();
        const picked =
          pickFirstStartTimeInWindows({
            windows,
            minDurationMinutes: duration,
            notBeforeMinutes: params.conflictEndMin,
          }) ??
          pickFirstStartTimeInWindows({
            windows,
            minDurationMinutes: duration,
            notBeforeMinutes: 0,
          });

        if (picked) {
          const pickedMin = parseTimeToMinutes(picked);
          if (pickedMin !== null) {
            const from = minutesToTime(startMin);
            const to = picked;
            const { error: updateWorkoutError } = await params.supabase
              .from("workout_plans")
              .update({ scheduled_time: toHHMMSS(to) })
              .eq("id", workoutPlanId)
              .eq("user_id", params.userId);
            if (!updateWorkoutError) {
              rescheduled.workout = { from, to };
              addBusy(pickedMin, pickedMin + duration);
            }
          }
        }
      } else {
        addBusy(startMin, endMin);
      }
    }
  }

  if (mealPlanId) {
    const { data: meals } = await params.supabase
      .from("meals")
      .select(
        "id, scheduled_time, scheduled_date, status, actually_eaten, logged_at"
      )
      .eq("meal_plan_id", mealPlanId)
      .eq("user_id", params.userId)
      .eq("scheduled_date", params.planDate)
      .eq("status", "active");

    const rows = ((meals as unknown[] | null) ?? []) as Array<
      Record<string, unknown>
    >;
    for (const meal of rows) {
      const id = String(meal.id ?? "");
      if (!id) continue;
      const alreadyEaten =
        meal.actually_eaten === true || typeof meal.logged_at === "string";
      if (alreadyEaten) continue;
      const startMin = parseTimeToMinutes(
        typeof meal.scheduled_time === "string"
          ? String(meal.scheduled_time)
          : null
      );
      if (startMin === null) continue;
      const duration = 30;
      const endMin = startMin + duration;
      if (
        overlapsMinutes({
          aStart: startMin,
          aEnd: endMin,
          bStart: params.conflictStartMin,
          bEnd: params.conflictEndMin,
        })
      ) {
        const windows = computeWindowsWithBusy();
        const picked =
          pickFirstStartTimeInWindows({
            windows,
            minDurationMinutes: duration,
            notBeforeMinutes: params.conflictEndMin,
          }) ??
          pickFirstStartTimeInWindows({
            windows,
            minDurationMinutes: duration,
            notBeforeMinutes: 0,
          });
        if (!picked) continue;
        const pickedMin = parseTimeToMinutes(picked);
        if (pickedMin === null) continue;
        const from = minutesToTime(startMin);
        const to = picked;
        const { error: updateMealError } = await params.supabase
          .from("meals")
          .update({ scheduled_time: toHHMMSS(to) })
          .eq("id", id)
          .eq("user_id", params.userId);
        if (!updateMealError) {
          rescheduled.meals = rescheduled.meals ?? [];
          rescheduled.meals.push({ id, from, to });
          addBusy(pickedMin, pickedMin + duration);
        }
      } else {
        addBusy(startMin, endMin);
      }
    }
  }

  if (readingSessionId) {
    const { data: readingSession } = await params.supabase
      .from("reading_sessions")
      .select("id, scheduled_time, duration_minutes, ended_at")
      .eq("id", readingSessionId)
      .eq("user_id", params.userId)
      .maybeSingle();

    const isDone = !!(readingSession as { ended_at?: unknown } | null)
      ?.ended_at;
    const startMin = parseTimeToMinutes(
      typeof (readingSession as { scheduled_time?: unknown } | null)
        ?.scheduled_time === "string"
        ? String(
            (readingSession as { scheduled_time?: unknown } | null)
              ?.scheduled_time
          )
        : null
    );
    const duration =
      typeof (readingSession as { duration_minutes?: unknown } | null)
        ?.duration_minutes === "number"
        ? Math.max(
            10,
            Math.min(
              180,
              Number(
                (readingSession as { duration_minutes?: unknown } | null)
                  ?.duration_minutes
              )
            )
          )
        : 25;

    if (!isDone && startMin !== null) {
      const endMin = startMin + duration;
      if (
        overlapsMinutes({
          aStart: startMin,
          aEnd: endMin,
          bStart: params.conflictStartMin,
          bEnd: params.conflictEndMin,
        })
      ) {
        const windows = computeWindowsWithBusy();
        const picked =
          pickFirstStartTimeInWindows({
            windows,
            minDurationMinutes: duration,
            notBeforeMinutes: params.conflictEndMin,
          }) ??
          pickFirstStartTimeInWindows({
            windows,
            minDurationMinutes: duration,
            notBeforeMinutes: 0,
          });
        if (picked) {
          const pickedMin = parseTimeToMinutes(picked);
          if (pickedMin !== null) {
            const from = minutesToTime(startMin);
            const to = picked;
            const { error: updateReadingError } = await params.supabase
              .from("reading_sessions")
              .update({ scheduled_time: toHHMMSS(to) })
              .eq("id", readingSessionId)
              .eq("user_id", params.userId);
            if (!updateReadingError) {
              rescheduled.reading = { from, to };
              addBusy(pickedMin, pickedMin + duration);
            }
          }
        }
      } else {
        addBusy(startMin, endMin);
      }
    }
  }

  if (rescheduled.workout || rescheduled.reading || rescheduled.meals?.length) {
    return { planDate: params.planDate, rescheduled } as const;
  }

  return null;
}

async function scheduleCreateOneOff(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  userId: string;
  args: z.infer<typeof ScheduleCreateArgsSchema>;
}) {
  const startMin = parseTimeToMinutes(params.args.startTime);
  const endMin = parseTimeToMinutes(params.args.endTime);
  if (startMin === null || endMin === null || endMin <= startMin) {
    return { ok: false, error: "Invalid start/end time." } as const;
  }

  const allRows = await getScheduleRowsForUser({
    supabase: params.supabase,
    userId: params.userId,
    limit: 800,
  });
  const todays = filterScheduleRowsForDateOnly({
    rows: allRows,
    dateOnly: params.args.date,
  });
  const conflicts = todays
    .map((row) => {
      const busyStart = parseTimeToMinutes(
        typeof row.start_time === "string" ? row.start_time : null
      );
      const busyEnd = parseTimeToMinutes(
        typeof row.end_time === "string" ? row.end_time : null
      );
      if (busyStart === null || busyEnd === null) return null;
      const overlaps = startMin < busyEnd && endMin > busyStart;
      if (!overlaps) return null;
      return { row, busyStart, busyEnd };
    })
    .filter(Boolean) as Array<{
    row: Record<string, unknown>;
    busyStart: number;
    busyEnd: number;
  }>;

  const { data: user } = await params.supabase
    .from("users")
    .select("sleep_schedule")
    .eq("id", params.userId)
    .maybeSingle();

  const sleepObject =
    user &&
    typeof (user as { sleep_schedule?: unknown }).sleep_schedule === "object"
      ? ((user as { sleep_schedule?: unknown }).sleep_schedule as Record<
          string,
          unknown
        >)
      : null;
  const scheduleRangeStart =
    normalizeHHMM(sleepObject?.typicalWakeTime) ?? "06:00";
  const scheduleRangeEnd =
    normalizeHHMM(sleepObject?.typicalBedtime) ?? "23:00";

  if (conflicts.length) {
    const hardEventTypes = new Set(["work", "meeting", "appointment", "sleep"]);
    const softEventTypes = new Set(["meal", "workout", "reading", "free_time"]);

    const classifyConflict = (row: Record<string, unknown>) => {
      const specificDate =
        typeof row.specific_date === "string" ? row.specific_date : null;
      const isOneOffForDate = specificDate === params.args.date;

      const scheduleType =
        typeof row.schedule_type === "string" ? row.schedule_type : null;
      const eventType =
        typeof row.event_type === "string" ? row.event_type : null;

      const isExplicitInflexible = row.is_flexible === false;
      const isSoftType = eventType ? softEventTypes.has(eventType) : false;
      const isShiftableOneOff =
        isOneOffForDate && isSoftType && row.is_flexible !== false;

      const isHard =
        isExplicitInflexible ||
        scheduleType === "work" ||
        (eventType ? hardEventTypes.has(eventType) : false);

      const isSoftRecurring =
        !isOneOffForDate && isSoftType && row.is_flexible !== false;

      if (isHard) return "hard" as const;
      if (isShiftableOneOff) return "shiftable" as const;
      if (isSoftRecurring) return "soft_recurring" as const;
      return "hard" as const;
    };

    const hardConflicts = conflicts.filter(
      (c) => classifyConflict(c.row) === "hard"
    );
    const shiftableConflicts = conflicts.filter(
      (c) => classifyConflict(c.row) === "shiftable"
    );

    if (hardConflicts.length) {
      return {
        ok: false,
        error: "Time overlaps an existing schedule block.",
      } as const;
    }

    const busyForShifting =
      shiftableConflicts.length > 0
        ? todays
            .filter((row) => {
              const id = String(row.id ?? "");
              return !shiftableConflicts.some(
                (c) => String(c.row.id ?? "") === id
              );
            })
            .map((row) => ({
              startMin: parseTimeToMinutes(
                typeof row.start_time === "string" ? row.start_time : null
              ),
              endMin: parseTimeToMinutes(
                typeof row.end_time === "string" ? row.end_time : null
              ),
            }))
            .filter(
              (w): w is { startMin: number; endMin: number } =>
                typeof w.startMin === "number" &&
                Number.isFinite(w.startMin) &&
                typeof w.endMin === "number" &&
                Number.isFinite(w.endMin)
            )
        : [];

    if (shiftableConflicts.length > 0) {
      busyForShifting.push({ startMin, endMin });
    }

    const moved: Array<{ id: string; from: string; to: string }> = [];

    const addBusy = (s: number, e: number) => {
      if (!Number.isFinite(s) || !Number.isFinite(e)) return;
      if (e <= s) return;
      busyForShifting.push({ startMin: s, endMin: e });
    };

    const computeWindows = () =>
      computeFreeTimeWindows({
        busy: busyForShifting.map((b) => ({
          startTime: minutesToTime(b.startMin),
          endTime: minutesToTime(b.endMin),
        })),
        rangeStartTime: scheduleRangeStart,
        rangeEndTime: scheduleRangeEnd,
      });

    const ordered = shiftableConflicts
      .slice()
      .sort((a, b) => a.busyStart - b.busyStart || a.busyEnd - b.busyEnd);

    for (const c of ordered) {
      const duration = c.busyEnd - c.busyStart;
      const windows = computeWindows();
      const picked =
        pickFirstStartTimeInWindows({
          windows,
          minDurationMinutes: duration,
          notBeforeMinutes: endMin,
        }) ??
        pickFirstStartTimeInWindows({
          windows,
          minDurationMinutes: duration,
          notBeforeMinutes: 0,
        });

      if (!picked) {
        return {
          ok: false,
          error: "Time overlaps an existing schedule block.",
        } as const;
      }

      const pickedMin = parseTimeToMinutes(picked);
      if (pickedMin === null) {
        return {
          ok: false,
          error: "Time overlaps an existing schedule block.",
        } as const;
      }

      const newEndMin = pickedMin + duration;
      const { error: shiftError } = await params.supabase
        .from("user_schedules")
        .update({
          start_time: toHHMMSS(picked),
          end_time: toHHMMSS(minutesToTime(newEndMin)),
        })
        .eq("id", String(c.row.id ?? ""))
        .eq("user_id", params.userId);

      if (shiftError) {
        return {
          ok: false,
          error: "Time overlaps an existing schedule block.",
        } as const;
      }

      moved.push({
        id: String(c.row.id ?? ""),
        from: minutesToTime(c.busyStart),
        to: picked,
      });
      addBusy(pickedMin, newEndMin);
    }
  }

  const { data: inserted, error } = await params.supabase
    .from("user_schedules")
    .insert({
      user_id: params.userId,
      schedule_type: params.args.scheduleType,
      event_type: params.args.eventType,
      title: params.args.title.trim(),
      start_date: params.args.date,
      end_date: params.args.date,
      specific_date: params.args.date,
      start_time: toHHMMSS(params.args.startTime),
      end_time: toHHMMSS(params.args.endTime),
      is_flexible: params.args.isFlexible,
      priority: params.args.priority,
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    return { ok: false, error: error?.message ?? "Insert failed" } as const;
  }

  const rowsAfterInsert = await getScheduleRowsForUser({
    supabase: params.supabase,
    userId: params.userId,
    limit: 800,
  }).catch(() => []);
  const scheduleRowsForDate = filterScheduleRowsForDateOnly({
    rows: rowsAfterInsert,
    dateOnly: params.args.date,
  });

  const planRescheduled = await autoReschedulePlanAroundScheduleBlock({
    supabase: params.supabase,
    userId: params.userId,
    planDate: params.args.date,
    conflictStartMin: startMin,
    conflictEndMin: endMin,
    scheduleRangeStart,
    scheduleRangeEnd,
    scheduleRowsForDate,
  }).catch(() => null);

  if (planRescheduled?.rescheduled) {
    return {
      ok: true,
      scheduleId: String((inserted as { id: unknown }).id),
      planDate: planRescheduled.planDate,
      rescheduled: planRescheduled.rescheduled,
    } as const;
  }

  return {
    ok: true,
    scheduleId: String((inserted as { id: unknown }).id),
  } as const;
}

async function scheduleUpdate(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  userId: string;
  args: z.infer<typeof ScheduleUpdateArgsSchema>;
}) {
  const patch: Record<string, unknown> = {};
  if (typeof params.args.title === "string")
    patch.title = params.args.title.trim();
  if (typeof params.args.startTime === "string")
    patch.start_time = params.args.startTime;
  if (typeof params.args.endTime === "string")
    patch.end_time = params.args.endTime;
  if (typeof params.args.scheduleType === "string")
    patch.schedule_type = params.args.scheduleType;
  if (typeof params.args.eventType === "string")
    patch.event_type = params.args.eventType;
  if (typeof params.args.isFlexible === "boolean")
    patch.is_flexible = params.args.isFlexible;
  if (typeof params.args.priority === "number")
    patch.priority = params.args.priority;

  if (!Object.keys(patch).length) {
    return { ok: false, error: "No fields to update." } as const;
  }

  const { data: existing } = await params.supabase
    .from("user_schedules")
    .select(
      "id, start_date, end_date, schedule_type, days_of_week, event_type, start_time, end_time, specific_date, title, is_flexible, priority"
    )
    .eq("id", params.args.scheduleId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (!existing?.id) {
    return { ok: false, error: "Schedule event not found." } as const;
  }

  const { error } = await params.supabase
    .from("user_schedules")
    .update(patch)
    .eq("id", params.args.scheduleId)
    .eq("user_id", params.userId);

  if (error) {
    return { ok: false, error: error.message } as const;
  }

  const { data: user } = await params.supabase
    .from("users")
    .select("timezone, sleep_schedule")
    .eq("id", params.userId)
    .maybeSingle();

  const timeZone =
    typeof (user as { timezone?: unknown } | null)?.timezone === "string"
      ? String((user as { timezone?: unknown } | null)?.timezone)
      : null;
  const todayDate = formatPlanDateInTimeZone(timeZone);

  const { data: updatedRow } = await params.supabase
    .from("user_schedules")
    .select(
      "id, start_date, end_date, schedule_type, days_of_week, event_type, start_time, end_time, specific_date, title, is_flexible, priority"
    )
    .eq("id", params.args.scheduleId)
    .eq("user_id", params.userId)
    .maybeSingle();

  const scheduleRowsForContext = await getScheduleRowsForUser({
    supabase: params.supabase,
    userId: params.userId,
    limit: 800,
  }).catch(() => []);

  const todaySchedule = filterScheduleRowsForDateOnly({
    rows: scheduleRowsForContext,
    dateOnly: todayDate,
  });

  const updatedForToday = todaySchedule.find(
    (r) => String(r.id ?? "") === params.args.scheduleId
  );

  const conflictStartMin = parseTimeToMinutes(
    typeof (updatedForToday ?? (updatedRow as Record<string, unknown> | null))
      ?.start_time === "string"
      ? String(
          (updatedForToday ?? (updatedRow as Record<string, unknown> | null))
            ?.start_time
        )
      : null
  );
  const conflictEndMin = parseTimeToMinutes(
    typeof (updatedForToday ?? (updatedRow as Record<string, unknown> | null))
      ?.end_time === "string"
      ? String(
          (updatedForToday ?? (updatedRow as Record<string, unknown> | null))
            ?.end_time
        )
      : null
  );

  if (conflictStartMin === null || conflictEndMin === null) {
    return { ok: true, scheduleId: params.args.scheduleId } as const;
  }

  const sleepObject =
    user &&
    typeof (user as { sleep_schedule?: unknown }).sleep_schedule === "object"
      ? ((user as { sleep_schedule?: unknown }).sleep_schedule as Record<
          string,
          unknown
        >)
      : null;
  const scheduleRangeStart =
    normalizeHHMM(sleepObject?.typicalWakeTime) ?? "06:00";
  const scheduleRangeEnd =
    normalizeHHMM(sleepObject?.typicalBedtime) ?? "23:00";

  const { data: todayPlan } = await params.supabase
    .from("daily_plans")
    .select("id, workout_plan_id, meal_plan_id, reading_goal_id")
    .eq("user_id", params.userId)
    .eq("plan_date", todayDate)
    .maybeSingle();

  if (!todayPlan?.id) {
    return { ok: true, scheduleId: params.args.scheduleId } as const;
  }

  const workoutPlanId = todayPlan.workout_plan_id
    ? String((todayPlan as { workout_plan_id?: unknown }).workout_plan_id)
    : null;
  const mealPlanId = todayPlan.meal_plan_id
    ? String((todayPlan as { meal_plan_id?: unknown }).meal_plan_id)
    : null;
  const readingSessionId = todayPlan.reading_goal_id
    ? String((todayPlan as { reading_goal_id?: unknown }).reading_goal_id)
    : null;

  const rescheduled: {
    workout?: { from: string; to: string };
    meals?: Array<{ id: string; from: string; to: string }>;
    reading?: { from: string; to: string };
  } = {};

  const busyForRescheduling = todaySchedule
    .map((e) => ({
      startMin: parseTimeToMinutes(
        typeof e.start_time === "string" ? e.start_time : null
      ),
      endMin: parseTimeToMinutes(
        typeof e.end_time === "string" ? e.end_time : null
      ),
    }))
    .filter(
      (w): w is { startMin: number; endMin: number } =>
        typeof w.startMin === "number" &&
        Number.isFinite(w.startMin) &&
        typeof w.endMin === "number" &&
        Number.isFinite(w.endMin)
    );

  const addBusy = (startMin: number, endMin: number) => {
    if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) return;
    if (endMin <= startMin) return;
    busyForRescheduling.push({ startMin, endMin });
  };

  const computeWindowsWithBusy = () =>
    computeFreeTimeWindows({
      busy: busyForRescheduling.map((b) => ({
        startTime: minutesToTime(b.startMin),
        endTime: minutesToTime(b.endMin),
      })),
      rangeStartTime: scheduleRangeStart,
      rangeEndTime: scheduleRangeEnd,
    });

  if (workoutPlanId) {
    const { data: workoutPlan } = await params.supabase
      .from("workout_plans")
      .select("id, scheduled_time, total_duration_minutes, completed")
      .eq("id", workoutPlanId)
      .eq("user_id", params.userId)
      .maybeSingle();

    const isCompleted =
      typeof (workoutPlan as { completed?: unknown } | null)?.completed ===
      "boolean"
        ? Boolean((workoutPlan as { completed?: unknown } | null)?.completed)
        : false;

    const startMin = parseTimeToMinutes(
      typeof (workoutPlan as { scheduled_time?: unknown } | null)
        ?.scheduled_time === "string"
        ? String(
            (workoutPlan as { scheduled_time?: unknown } | null)?.scheduled_time
          )
        : null
    );
    const duration =
      typeof (workoutPlan as { total_duration_minutes?: unknown } | null)
        ?.total_duration_minutes === "number"
        ? Math.max(
            10,
            Math.min(
              240,
              Number(
                (workoutPlan as { total_duration_minutes?: unknown } | null)
                  ?.total_duration_minutes
              )
            )
          )
        : 45;

    if (!isCompleted && startMin !== null) {
      const endMin = startMin + duration;
      if (
        overlapsMinutes({
          aStart: startMin,
          aEnd: endMin,
          bStart: conflictStartMin,
          bEnd: conflictEndMin,
        })
      ) {
        const windows = computeWindowsWithBusy();
        const picked =
          pickFirstStartTimeInWindows({
            windows,
            minDurationMinutes: duration,
            notBeforeMinutes: conflictEndMin,
          }) ??
          pickFirstStartTimeInWindows({
            windows,
            minDurationMinutes: duration,
            notBeforeMinutes: 0,
          });

        if (picked) {
          const pickedMin = parseTimeToMinutes(picked);
          if (pickedMin !== null) {
            const from = minutesToTime(startMin);
            const to = picked;
            const { error: updateWorkoutError } = await params.supabase
              .from("workout_plans")
              .update({ scheduled_time: toHHMMSS(to) })
              .eq("id", workoutPlanId)
              .eq("user_id", params.userId);
            if (!updateWorkoutError) {
              rescheduled.workout = { from, to };
              addBusy(pickedMin, pickedMin + duration);
            }
          }
        }
      } else {
        addBusy(startMin, endMin);
      }
    }
  }

  if (mealPlanId) {
    const { data: meals } = await params.supabase
      .from("meals")
      .select(
        "id, scheduled_time, scheduled_date, status, actually_eaten, logged_at"
      )
      .eq("meal_plan_id", mealPlanId)
      .eq("user_id", params.userId)
      .eq("scheduled_date", todayDate)
      .eq("status", "active");

    const rows = ((meals as unknown[] | null) ?? []) as Array<
      Record<string, unknown>
    >;
    for (const meal of rows) {
      const id = String(meal.id ?? "");
      if (!id) continue;
      const alreadyEaten =
        meal.actually_eaten === true || typeof meal.logged_at === "string";
      if (alreadyEaten) continue;
      const startMin = parseTimeToMinutes(
        typeof meal.scheduled_time === "string"
          ? String(meal.scheduled_time)
          : null
      );
      if (startMin === null) continue;
      const duration = 30;
      const endMin = startMin + duration;
      if (
        overlapsMinutes({
          aStart: startMin,
          aEnd: endMin,
          bStart: conflictStartMin,
          bEnd: conflictEndMin,
        })
      ) {
        const windows = computeWindowsWithBusy();
        const picked =
          pickFirstStartTimeInWindows({
            windows,
            minDurationMinutes: duration,
            notBeforeMinutes: conflictEndMin,
          }) ??
          pickFirstStartTimeInWindows({
            windows,
            minDurationMinutes: duration,
            notBeforeMinutes: 0,
          });
        if (!picked) continue;
        const pickedMin = parseTimeToMinutes(picked);
        if (pickedMin === null) continue;
        const from = minutesToTime(startMin);
        const to = picked;
        const { error: updateMealError } = await params.supabase
          .from("meals")
          .update({ scheduled_time: toHHMMSS(to) })
          .eq("id", id)
          .eq("user_id", params.userId);
        if (!updateMealError) {
          rescheduled.meals = rescheduled.meals ?? [];
          rescheduled.meals.push({ id, from, to });
          addBusy(pickedMin, pickedMin + duration);
        }
      } else {
        addBusy(startMin, endMin);
      }
    }
  }

  if (readingSessionId) {
    const { data: readingSession } = await params.supabase
      .from("reading_sessions")
      .select("id, scheduled_time, duration_minutes, ended_at")
      .eq("id", readingSessionId)
      .eq("user_id", params.userId)
      .maybeSingle();

    const isDone = !!(readingSession as { ended_at?: unknown } | null)
      ?.ended_at;
    const startMin = parseTimeToMinutes(
      typeof (readingSession as { scheduled_time?: unknown } | null)
        ?.scheduled_time === "string"
        ? String(
            (readingSession as { scheduled_time?: unknown } | null)
              ?.scheduled_time
          )
        : null
    );
    const duration =
      typeof (readingSession as { duration_minutes?: unknown } | null)
        ?.duration_minutes === "number"
        ? Math.max(
            10,
            Math.min(
              180,
              Number(
                (readingSession as { duration_minutes?: unknown } | null)
                  ?.duration_minutes
              )
            )
          )
        : 25;

    if (!isDone && startMin !== null) {
      const endMin = startMin + duration;
      if (
        overlapsMinutes({
          aStart: startMin,
          aEnd: endMin,
          bStart: conflictStartMin,
          bEnd: conflictEndMin,
        })
      ) {
        const windows = computeWindowsWithBusy();
        const picked =
          pickFirstStartTimeInWindows({
            windows,
            minDurationMinutes: duration,
            notBeforeMinutes: conflictEndMin,
          }) ??
          pickFirstStartTimeInWindows({
            windows,
            minDurationMinutes: duration,
            notBeforeMinutes: 0,
          });
        if (picked) {
          const pickedMin = parseTimeToMinutes(picked);
          if (pickedMin !== null) {
            const from = minutesToTime(startMin);
            const to = picked;
            const { error: updateReadingError } = await params.supabase
              .from("reading_sessions")
              .update({ scheduled_time: toHHMMSS(to) })
              .eq("id", readingSessionId)
              .eq("user_id", params.userId);
            if (!updateReadingError) {
              rescheduled.reading = { from, to };
              addBusy(pickedMin, pickedMin + duration);
            }
          }
        }
      } else {
        addBusy(startMin, endMin);
      }
    }
  }

  if (rescheduled.workout || rescheduled.reading || rescheduled.meals?.length) {
    return {
      ok: true,
      scheduleId: params.args.scheduleId,
      rescheduled,
      planDate: todayDate,
    } as const;
  }

  return { ok: true, scheduleId: params.args.scheduleId } as const;
}

async function scheduleDelete(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  userId: string;
  scheduleId: string;
}) {
  const { error } = await params.supabase
    .from("user_schedules")
    .delete()
    .eq("id", params.scheduleId)
    .eq("user_id", params.userId);

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true } as const;
}

function filterScheduleRowsForRange(params: {
  rows: Array<Record<string, unknown>>;
  startDate?: string;
  endDate?: string;
}) {
  const start = params.startDate?.trim() || null;
  const end = params.endDate?.trim() || null;
  if (!start && !end) return params.rows;

  return params.rows.filter((row) => {
    const specificDate =
      typeof row.specific_date === "string" ? row.specific_date : null;
    if (specificDate) {
      if (start && specificDate < start) return false;
      if (end && specificDate > end) return false;
      return true;
    }

    const rowStart = typeof row.start_date === "string" ? row.start_date : null;
    const rowEnd = typeof row.end_date === "string" ? row.end_date : null;
    if (start && rowEnd && rowEnd < start) return false;
    if (end && rowStart && rowStart > end) return false;
    return true;
  });
}

async function scheduleList(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  userId: string;
  args: z.infer<typeof ScheduleListArgsSchema>;
}) {
  const rows = await getScheduleRowsForUser({
    supabase: params.supabase,
    userId: params.userId,
    limit: params.args.limit,
  });

  const filtered = filterScheduleRowsForRange({
    rows,
    startDate: params.args.startDate,
    endDate: params.args.endDate,
  })
    .slice()
    .sort((a, b) => {
      const aDate =
        (typeof a.specific_date === "string" && a.specific_date) ||
        (typeof a.start_date === "string" && a.start_date) ||
        "";
      const bDate =
        (typeof b.specific_date === "string" && b.specific_date) ||
        (typeof b.start_date === "string" && b.start_date) ||
        "";
      if (aDate !== bDate) return aDate < bDate ? -1 : 1;
      const aStart = typeof a.start_time === "string" ? a.start_time : "";
      const bStart = typeof b.start_time === "string" ? b.start_time : "";
      if (aStart !== bStart) return aStart < bStart ? -1 : 1;
      return String(a.id ?? "").localeCompare(String(b.id ?? ""));
    })
    .slice(0, params.args.limit);

  return { ok: true, rows: filtered } as const;
}

function toHHMMSS(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return trimmed;
  const hh = Math.min(23, Math.max(0, Number(match[1])));
  const mm = Math.min(59, Math.max(0, Number(match[2])));
  const ss = match[3] ? Math.min(59, Math.max(0, Number(match[3]))) : 0;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(
    2,
    "0"
  )}:${String(ss).padStart(2, "0")}`;
}

async function mealSwap(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  userId: string;
  args: z.infer<typeof MealSwapArgsSchema>;
}) {
  const baseSelect =
    "id, meal_plan_id, meal_type, scheduled_date, scheduled_time, name, swap_count, status";

  type TargetMeal = {
    id: string;
    meal_plan_id: string;
    meal_type: string;
    scheduled_date: string;
    scheduled_time: string;
    name: string;
    swap_count: number | null;
    status: string | null;
  };

  let target: TargetMeal | null = null;

  if (params.args.mealId) {
    const { data } = await params.supabase
      .from("meals")
      .select(baseSelect)
      .eq("user_id", params.userId)
      .eq("id", params.args.mealId)
      .maybeSingle();
    target = (data as TargetMeal | null) ?? null;
  } else if (params.args.mealType && params.args.scheduledDate) {
    const query = params.supabase
      .from("meals")
      .select(baseSelect)
      .eq("user_id", params.userId)
      .eq("status", "active")
      .eq("meal_type", params.args.mealType)
      .eq("scheduled_date", params.args.scheduledDate);

    const scheduledTime = params.args.scheduledTime?.trim()
      ? toHHMMSS(params.args.scheduledTime)
      : null;

    const { data } = scheduledTime
      ? await query.eq("scheduled_time", scheduledTime).limit(5)
      : await query.order("scheduled_time", { ascending: true }).limit(25);

    const rows = ((data as unknown[] | null) ?? []) as Array<
      Record<string, unknown>
    >;

    const normalizedOld = params.args.oldMealName?.trim().toLowerCase() ?? null;
    if (!scheduledTime && !normalizedOld && rows.length > 1) {
      return {
        ok: false,
        error:
          "Multiple meals match that date/type. Provide mealId or scheduledTime.",
      } as const;
    }

    const pick =
      scheduledTime || rows.length <= 1
        ? rows[0]
        : normalizedOld
          ? (rows.find(
              (r) =>
                String(r.name ?? "")
                  .trim()
                  .toLowerCase() === normalizedOld
            ) ?? rows[0])
          : rows[0];

    if (!scheduledTime && normalizedOld && rows.length > 1) {
      const matched = rows.find(
        (r) =>
          String(r.name ?? "")
            .trim()
            .toLowerCase() === normalizedOld
      );
      if (!matched) {
        return {
          ok: false,
          error:
            "Could not match oldMealName for that meal slot. Provide mealId or scheduledTime.",
        } as const;
      }
    }

    target = pick
      ? ({
          id: String(pick.id),
          meal_plan_id: String(pick.meal_plan_id),
          meal_type: String(pick.meal_type),
          scheduled_date: String(pick.scheduled_date),
          scheduled_time: String(pick.scheduled_time),
          name: String(pick.name),
          swap_count:
            typeof pick.swap_count === "number"
              ? (pick.swap_count as number)
              : null,
          status:
            typeof pick.status === "string" ? (pick.status as string) : null,
        } as TargetMeal)
      : null;
  }

  if (!target?.id || !target.meal_plan_id) {
    return { ok: false, error: "Could not find the meal to swap." } as const;
  }

  if ((target.status ?? "active") !== "active") {
    return { ok: false, error: "That meal is not active anymore." } as const;
  }

  const newName = params.args.newMealName.trim();
  if (!newName) {
    return { ok: false, error: "Missing new meal name." } as const;
  }

  const { data: inserted, error: insertError } = await params.supabase
    .from("meals")
    .insert({
      user_id: params.userId,
      meal_plan_id: target.meal_plan_id,
      meal_type: target.meal_type,
      scheduled_date: target.scheduled_date,
      scheduled_time: target.scheduled_time,
      name: newName,
      ingredients: [],
      preparation_steps: null,
      calories:
        typeof params.args.calories === "number" ? params.args.calories : null,
      protein_g:
        typeof params.args.protein_g === "number"
          ? params.args.protein_g
          : null,
      carbs_g:
        typeof params.args.carbs_g === "number" ? params.args.carbs_g : null,
      fats_g:
        typeof params.args.fats_g === "number" ? params.args.fats_g : null,
      status: "active",
      original_meal_id: target.id,
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    return {
      ok: false,
      error: insertError?.message ?? "Failed to insert swapped meal.",
    } as const;
  }

  const nextSwapCount = (target.swap_count ?? 0) + 1;
  const { error: updateError } = await params.supabase
    .from("meals")
    .update({ status: "replaced", swap_count: nextSwapCount })
    .eq("user_id", params.userId)
    .eq("id", target.id)
    .eq("status", "active");

  if (updateError) {
    return { ok: false, error: updateError.message } as const;
  }

  return {
    ok: true,
    replacedMealId: target.id,
    newMealId: String((inserted as { id: unknown }).id),
    mealType: target.meal_type,
    scheduledDate: target.scheduled_date,
    scheduledTime: target.scheduled_time,
    newMealName: newName,
  } as const;
}

async function runScheduleToolCall(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  userId: string;
  allowDelete: boolean;
  toolCall: OpenAI.Chat.ChatCompletionMessageToolCall;
}) {
  const name = params.toolCall.function.name;
  const rawArgs = params.toolCall.function.arguments;

  let args: unknown = {};
  if (typeof rawArgs === "string" && rawArgs.trim()) {
    try {
      args = JSON.parse(rawArgs);
    } catch {
      return { ok: false, error: "Invalid JSON tool arguments." } as const;
    }
  }

  if (name === "schedule_list") {
    const parsed = ScheduleListArgsSchema.safeParse(args);
    if (!parsed.success) {
      return { ok: false, error: "Invalid schedule_list arguments." } as const;
    }
    return scheduleList({
      supabase: params.supabase,
      userId: params.userId,
      args: parsed.data,
    });
  }

  if (name === "schedule_create") {
    const parsed = ScheduleCreateArgsSchema.safeParse(args);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Invalid schedule_create arguments.",
      } as const;
    }
    return scheduleCreateOneOff({
      supabase: params.supabase,
      userId: params.userId,
      args: parsed.data,
    });
  }

  if (name === "schedule_update") {
    const parsed = ScheduleUpdateArgsSchema.safeParse(args);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Invalid schedule_update arguments.",
      } as const;
    }
    return scheduleUpdate({
      supabase: params.supabase,
      userId: params.userId,
      args: parsed.data,
    });
  }

  if (name === "schedule_delete") {
    if (!params.allowDelete) {
      return {
        ok: false,
        error: "Deletion not allowed unless user explicitly requested it.",
      } as const;
    }
    const parsed = ScheduleDeleteArgsSchema.safeParse(args);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Invalid schedule_delete arguments.",
      } as const;
    }
    return scheduleDelete({
      supabase: params.supabase,
      userId: params.userId,
      scheduleId: parsed.data.scheduleId,
    });
  }

  if (name === "meal_swap") {
    const parsed = MealSwapArgsSchema.safeParse(args);
    if (!parsed.success) {
      return { ok: false, error: "Invalid meal_swap arguments." } as const;
    }
    return mealSwap({
      supabase: params.supabase,
      userId: params.userId,
      args: parsed.data,
    });
  }

  return { ok: false, error: `Unknown tool: ${name}` } as const;
}

export async function POST(request: Request) {
  const rawBody = await request.json();

  const scheduleAction = ScheduleActionBodySchema.safeParse(rawBody);
  if (scheduleAction.success) {
    const supabase = getSupabaseAdmin();
    const userId = scheduleAction.data.userId;
    const action = scheduleAction.data.action;
    if (action === "schedule_create") {
      return NextResponse.json(
        await scheduleCreateOneOff({
          supabase,
          userId,
          args: scheduleAction.data.args,
        })
      );
    }
    if (action === "schedule_update") {
      return NextResponse.json(
        await scheduleUpdate({
          supabase,
          userId,
          args: scheduleAction.data.args,
        })
      );
    }
    if (action === "schedule_delete") {
      return NextResponse.json(
        await scheduleDelete({
          supabase,
          userId,
          scheduleId: scheduleAction.data.args.scheduleId,
        })
      );
    }
    return NextResponse.json(
      await scheduleList({
        supabase,
        userId,
        args: scheduleAction.data.args,
      })
    );
  }

  const bodyParsed = ChatBodySchema.safeParse(rawBody);
  if (!bodyParsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }
  const body = bodyParsed.data;

  const clientConfigs = getClientConfigsForManager(body.manager);
  if (!clientConfigs.length) {
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

  const { data: user } = await supabase
    .from("users")
    .select(
      "id, name, email, age, gender, height_cm, timezone, dietary_restrictions, food_dislikes, favorite_cuisines, cooking_skill, budget_level, activity_level, injuries, medical_conditions, equipment_available, reading_speed_wpm, favorite_genres, sleep_schedule, work_schedule, stress_level"
    )
    .eq("id", body.userId)
    .maybeSingle();

  const { data: goals } = await supabase
    .from("goals")
    .select(
      "category, goal_type, description, target_weight_kg, target_measurements, daily_reading_minutes, books_per_month, status"
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

  const savedUserMessage = await supabase
    .from("conversations")
    .insert({
      user_id: body.userId,
      manager: body.manager,
      role: "user",
      content: body.message,
    })
    .select("id, created_at, manager, role, content")
    .single();

  const userConversationRow =
    (savedUserMessage.data as ConversationRow | null) ?? null;

  try {
    const embedding = await generateEmbedding(body.message);
    if (embedding && userConversationRow?.id) {
      await supabase.from("embeddings").insert({
        conversation_id: userConversationRow.id,
        user_id: body.userId,
        embedding,
        content_chunk: body.message,
        manager: body.manager,
        category: getCategoryForManager(body.manager),
      });
    }
  } catch {}

  const todayDate = formatPlanDateInTimeZone(
    typeof (user as { timezone?: unknown } | null)?.timezone === "string"
      ? String((user as { timezone?: unknown } | null)?.timezone)
      : null
  );

  const scheduleRowsForContext = await getScheduleRowsForUser({
    supabase,
    userId: body.userId,
    limit: 500,
  }).catch(() => []);
  const todayScheduleForContext = filterScheduleRowsForDateOnly({
    rows: scheduleRowsForContext,
    dateOnly: todayDate,
  });

  const { data: todayPlan } = await supabase
    .from("daily_plans")
    .select(
      "id, plan_date, atlas_morning_message, plan_status, coordination_log, workout_plan_id, meal_plan_id, reading_goal_id"
    )
    .eq("user_id", body.userId)
    .eq("plan_date", todayDate)
    .maybeSingle();

  const workoutPlanId = todayPlan?.workout_plan_id
    ? String((todayPlan as { workout_plan_id?: unknown }).workout_plan_id)
    : null;
  const mealPlanId = todayPlan?.meal_plan_id
    ? String((todayPlan as { meal_plan_id?: unknown }).meal_plan_id)
    : null;
  const readingSessionId = todayPlan?.reading_goal_id
    ? String((todayPlan as { reading_goal_id?: unknown }).reading_goal_id)
    : null;

  const { data: workoutPlan } = workoutPlanId
    ? await supabase
        .from("workout_plans")
        .select(
          "id, scheduled_time, workout_type, focus_areas, total_duration_minutes, intensity, completed, completed_at"
        )
        .eq("id", workoutPlanId)
        .eq("user_id", body.userId)
        .maybeSingle()
    : { data: null };

  const { data: mealPlan } = mealPlanId
    ? await supabase
        .from("meal_plans")
        .select("id, status, start_date, end_date")
        .eq("id", mealPlanId)
        .eq("user_id", body.userId)
        .maybeSingle()
    : { data: null };

  const { data: meals } = mealPlanId
    ? await supabase
        .from("meals")
        .select(
          "id, meal_type, scheduled_time, scheduled_date, name, calories, protein_g, carbs_g, fats_g, status, actually_eaten, logged_at"
        )
        .eq("meal_plan_id", mealPlanId)
        .eq("user_id", body.userId)
        .eq("scheduled_date", todayDate)
        .eq("status", "active")
        .order("scheduled_time", { ascending: true })
    : { data: null };

  const { data: readingSession } = readingSessionId
    ? await supabase
        .from("reading_sessions")
        .select(
          "id, started_at, ended_at, duration_minutes, scheduled_time, was_scheduled, book:books(title, author)"
        )
        .eq("id", readingSessionId)
        .eq("user_id", body.userId)
        .maybeSingle()
    : { data: null };

  const profileContext = {
    user,
    goals,
    latestMeasurement,
  };

  const mealsForToday = ((meals as unknown[] | null) ?? []) as Array<
    Record<string, unknown>
  >;
  const scheduleForContext =
    mealsForToday.length > 0
      ? todayScheduleForContext.filter((row) => {
          const eventType =
            typeof row.event_type === "string" ? row.event_type : null;
          const specificDate =
            typeof row.specific_date === "string" ? row.specific_date : null;
          return eventType !== "meal" || !!specificDate;
        })
      : todayScheduleForContext;

  const todayContext = {
    date: todayDate,
    schedule: scheduleForContext,
    dailyPlan: todayPlan ?? null,
    workoutPlan: workoutPlan ?? null,
    mealPlan: mealPlan ?? null,
    meals: mealsForToday,
    readingSession: readingSession ?? null,
  };

  const system = getManagerSystemPrompt(body.manager, String(user?.name ?? ""));
  const scheduleToolPolicy = [
    "SCHEDULE PERSISTENCE:",
    "- You have tools to read/write schedule entries: schedule_list, schedule_create, schedule_update.",
    "- If the user asks to add/schedule an event, you MUST call schedule_create (do not just promise).",
    "- If the user asks to move/reschedule an existing schedule event, you MUST call schedule_update.",
    "- If the user mentions a new commitment that blocks time (e.g. chores, meeting), schedule it as an event.",
    "- Use schedule_list to check conflicts when needed before scheduling.",
    "- schedule_delete is only for explicit user requests to delete/remove/cancel an event.",
    "- Never claim something was scheduled/moved unless a tool returned ok:true.",
  ].join("\n");
  const mealToolPolicy = [
    "MEAL SWAPS PERSISTENCE:",
    "- You have a tool meal_swap to replace a meal in the user's plan.",
    "- If the user confirms a swap (e.g. chooses Option 1/2/3), you MUST call meal_swap.",
    "- If the user's message includes MEAL_ID=..., you MUST pass that as mealId.",
    "- Do not claim the meal was swapped unless the tool returns ok:true.",
  ].join("\n");

  let memoryLines: string[] = [];
  try {
    const results = await semanticSearch({
      supabase,
      userId: body.userId,
      query: body.message,
      limit: 8,
      threshold: 0.78,
    });

    if (results.length) {
      memoryLines = results.map(
        (m) => `- (${m.similarity.toFixed(3)}) ${m.content.slice(0, 500)}`
      );
    }
  } catch {}

  const historyQuery =
    body.manager === "atlas"
      ? supabase
          .from("conversations")
          .select("role, content, created_at, manager")
          .eq("user_id", body.userId)
          .order("created_at", { ascending: false })
          .limit(60)
      : supabase
          .from("conversations")
          .select("role, content, created_at, manager")
          .eq("user_id", body.userId)
          .eq("manager", body.manager)
          .order("created_at", { ascending: false })
          .limit(30);

  const { data: history } = await historyQuery;

  const selectedOption =
    body.manager === "olive" ? parseMealSwapSelection(body.message) : null;
  if (body.manager === "olive" && selectedOption) {
    const historyRows = ((history as unknown[] | null) ?? []) as Array<
      Record<string, unknown>
    >;
    const optionsIdx = historyRows.findIndex(
      (m) =>
        m.role === "assistant" &&
        /option\s*1\s*[–-]/i.test(String(m.content ?? ""))
    );
    const optionsText =
      optionsIdx >= 0 ? String(historyRows[optionsIdx]?.content ?? "") : "";

    const tail = optionsIdx >= 0 ? historyRows.slice(optionsIdx + 1) : [];
    const swapRequest = tail.find(
      (m) => m.role === "user" && /MEAL_ID=/i.test(String(m.content ?? ""))
    );
    const mealId = swapRequest
      ? extractTagValue(String(swapRequest.content ?? ""), "MEAL_ID")
      : null;

    const optionMap = optionsText ? parseMealOptions(optionsText) : new Map();
    const chosen = optionMap.get(selectedOption) ?? null;

    if (mealId && chosen?.name) {
      const swapResult = await mealSwap({
        supabase,
        userId: body.userId,
        args: {
          mealId,
          newMealName: chosen.name,
          calories: chosen.calories ?? undefined,
          protein_g: chosen.protein_g ?? undefined,
          carbs_g: chosen.carbs_g ?? undefined,
          fats_g: chosen.fats_g ?? undefined,
        },
      });

      const reply = swapResult.ok
        ? [
            `Swapped—your ${String(swapResult.scheduledTime ?? "").slice(0, 5)} ${swapResult.mealType} is now:`,
            "",
            swapResult.newMealName,
            chosen.calories &&
            chosen.protein_g &&
            chosen.carbs_g &&
            chosen.fats_g
              ? `${chosen.calories} kcal | ${chosen.protein_g} P | ${chosen.carbs_g} C | ${chosen.fats_g} F`
              : "",
          ]
            .filter((l) => l !== "")
            .join("\n")
        : String(swapResult.error ?? "Swap failed");

      const savedAssistantMessage = await supabase
        .from("conversations")
        .insert({
          user_id: body.userId,
          manager: body.manager,
          role: "assistant",
          content: reply,
        })
        .select("id, created_at, manager, role, content")
        .single();

      const assistantConversationRow =
        (savedAssistantMessage.data as ConversationRow | null) ?? null;

      try {
        const embedding = await generateEmbedding(reply);
        if (embedding && assistantConversationRow?.id) {
          await supabase.from("embeddings").insert({
            conversation_id: assistantConversationRow.id,
            user_id: body.userId,
            embedding,
            content_chunk: reply,
            manager: body.manager,
            category: getCategoryForManager(body.manager),
          });
        }
      } catch {}

      return NextResponse.json({
        ok: true,
        reply,
        userMessage: userConversationRow,
        assistantMessage: assistantConversationRow,
        coordinationLog: null,
        providerUsed: "openai",
        modelUsed: "tool-bypass",
      });
    }
  }

  const allowDelete = isExplicitDeletionRequest(body.message);
  const scheduleTools = buildScheduleTools({ allowDelete });
  const mealTools = buildMealTools();
  const tools = [...scheduleTools, ...mealTools];

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    { role: "system", content: scheduleToolPolicy },
    ...(body.manager === "olive"
      ? [{ role: "system" as const, content: mealToolPolicy }]
      : []),
    {
      role: "system",
      content: "User profile context (JSON): " + safeJsonString(profileContext),
    },
    {
      role: "system",
      content: "Today's plan context (JSON): " + safeJsonString(todayContext),
    },
    ...(memoryLines.length
      ? [
          {
            role: "system" as const,
            content:
              "Relevant memory (semantic matches):\n" + memoryLines.join("\n"),
          },
        ]
      : []),
    ...(history ?? [])
      .slice()
      .reverse()
      .map((m) => ({
        role:
          m.role === "system"
            ? ("system" as const)
            : m.role === "assistant"
              ? ("assistant" as const)
              : ("user" as const),
        content:
          body.manager === "atlas" &&
          typeof (m as { manager?: unknown }).manager === "string" &&
          String((m as { manager?: unknown }).manager) !== "atlas"
            ? `[${String((m as { manager?: unknown }).manager)}] ${String(m.content ?? "")}`
            : String(m.content ?? ""),
      })),
    { role: "user", content: body.message },
  ];

  let completion: Awaited<
    ReturnType<
      (typeof clientConfigs)[number]["client"]["chat"]["completions"]["create"]
    >
  > | null = null;
  let providerUsed: ProviderConfig["provider"] | null = null;
  let modelUsed: string | null = null;
  let lastError: {
    status: number | null;
    type: string | null;
    message: string;
  } | null = null;

  let finalReply = "";

  for (const cfg of clientConfigs) {
    try {
      const maxToolRounds = 6;
      const workingMessages = messages.slice();

      for (let round = 0; round < maxToolRounds; round += 1) {
        completion = await cfg.client.chat.completions.create({
          model: cfg.model,
          messages: workingMessages,
          temperature: body.manager === "atlas" ? 0.4 : 0.6,
          tools,
          tool_choice: "auto",
        });

        const message = completion.choices[0]?.message;
        const toolCalls = message?.tool_calls ?? [];
        const content = (message?.content ?? "").trim();

        if (toolCalls.length) {
          workingMessages.push({
            role: "assistant",
            content: message?.content ?? "",
            tool_calls: toolCalls,
          });

          for (const toolCall of toolCalls) {
            const toolResult = await runScheduleToolCall({
              supabase,
              userId: body.userId,
              allowDelete,
              toolCall,
            }).catch((err) => ({
              ok: false,
              error:
                typeof (err as { message?: unknown })?.message === "string"
                  ? String((err as { message?: unknown }).message)
                  : "Tool execution failed",
            }));

            workingMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: safeJsonString(toolResult),
            });
          }

          continue;
        }

        if (content) {
          finalReply = content;
          break;
        }
      }

      if (!finalReply) {
        throw new Error("Empty reply from model.");
      }

      providerUsed = cfg.provider;
      modelUsed = cfg.model;
      break;
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
          : "Chat provider request failed";

      lastError = { status, type, message };

      if (status === 401) {
        continue;
      }

      return NextResponse.json(
        {
          ok: false,
          error: `${cfg.provider} chat failed (${cfg.model})${status ? ` status ${status}` : ""}${type ? ` ${type}` : ""}: ${message}`,
        },
        { status: 500 }
      );
    }
  }

  if (!completion) {
    return NextResponse.json(
      {
        ok: false,
        error: `${clientConfigs[0].provider} chat failed (${clientConfigs[0].model})${lastError?.status ? ` status ${lastError.status}` : ""}${lastError?.type ? ` ${lastError.type}` : ""}: ${lastError?.message ?? "Chat provider request failed"}`,
      },
      { status: 500 }
    );
  }

  const savedAssistantMessage = await supabase
    .from("conversations")
    .insert({
      user_id: body.userId,
      manager: body.manager,
      role: "assistant",
      content: finalReply,
    })
    .select("id, created_at, manager, role, content")
    .single();

  const assistantConversationRow =
    (savedAssistantMessage.data as ConversationRow | null) ?? null;

  try {
    const embedding = await generateEmbedding(finalReply);
    if (embedding && assistantConversationRow?.id) {
      await supabase.from("embeddings").insert({
        conversation_id: assistantConversationRow.id,
        user_id: body.userId,
        embedding,
        content_chunk: finalReply,
        manager: body.manager,
        category: getCategoryForManager(body.manager),
      });
    }
  } catch {}

  return NextResponse.json({
    ok: true,
    reply: finalReply,
    userMessage: userConversationRow,
    assistantMessage: assistantConversationRow,
    coordinationLog:
      body.manager === "atlas"
        ? ((todayPlan as { coordination_log?: unknown } | null)
            ?.coordination_log ?? null)
        : null,
    providerUsed,
    modelUsed,
  });
}
