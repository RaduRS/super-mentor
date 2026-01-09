"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { endOfDay, startOfDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { computeFreeTimeWindows, parseTimeToMinutes } from "@/lib/utils";

const TimeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Use HH:MM")
  .nullable();

const OnboardingSchema = z.object({
  age: z.coerce.number().int().min(1).max(120).nullable(),
  gender: z.string().trim().min(1).nullable(),
  heightCm: z.coerce.number().positive().nullable(),
  weightKg: z.coerce.number().positive().nullable(),
  timezone: z.string().trim().min(1).nullable(),
  locationText: z.string().trim().min(1).nullable(),
  bedtime: TimeStringSchema,
  wakeTime: TimeStringSchema,
  workScheduleType: z.string().trim().min(1).nullable(),
  stressLevel: z.coerce.number().int().min(1).max(10).nullable(),

  bellyCm: z.coerce.number().positive().nullable(),
  chestCm: z.coerce.number().positive().nullable(),
  bicepsLeftCm: z.coerce.number().positive().nullable(),
  bicepsRightCm: z.coerce.number().positive().nullable(),
  calvesLeftCm: z.coerce.number().positive().nullable(),
  calvesRightCm: z.coerce.number().positive().nullable(),
  thighsLeftCm: z.coerce.number().positive().nullable(),
  thighsRightCm: z.coerce.number().positive().nullable(),
  shouldersCm: z.coerce.number().positive().nullable(),
  neckCm: z.coerce.number().positive().nullable(),
  injuriesText: z.string().trim().nullable(),
  medicalConditionsText: z.string().trim().nullable(),
  activityLevel: z.enum(["sedentary", "moderate", "active"]).nullable(),

  fitnessPrimaryGoals: z.array(
    z.enum([
      "lose_belly_fat",
      "build_muscle",
      "increase_strength",
      "improve_endurance",
      "general_health",
    ])
  ),
  targetWeightKg: z.coerce.number().positive().nullable(),
  targetBellyCm: z.coerce.number().positive().nullable(),
  idealBodyDescription: z.string().trim().min(1).nullable(),
  equipmentAvailable: z.array(
    z.enum(["gym_membership", "home_equipment", "bodyweight_only"])
  ),
  exercisePreferences: z.string().trim().nullable(),

  dietaryPreference: z
    .enum(["omnivore", "vegetarian", "vegan", "pescatarian"])
    .nullable(),
  allergiesIntolerances: z.string().trim().nullable(),
  foodsDislike: z.string().trim().nullable(),
  favoriteCuisines: z.string().trim().nullable(),
  cookingSkill: z.enum(["beginner", "intermediate", "advanced"]).nullable(),
  shoppingFrequencyDays: z.coerce.number().int().positive().nullable(),
  budgetLevel: z.enum(["tight", "moderate", "flexible"]).nullable(),

  dailyReadingMinutes: z.coerce.number().int().positive().nullable(),
  booksPerMonth: z.coerce.number().int().positive().nullable(),
  readingSpeedWpm: z.coerce.number().int().positive().nullable(),
  favoriteGenres: z.string().trim().nullable(),
  backlogBooksText: z.string().trim().nullable(),
  backlogAudiobooksText: z.string().trim().nullable(),

  workDays: z.array(z.number().int().min(0).max(6)),
  workStartTime: TimeStringSchema,
  workEndTime: TimeStringSchema,
  preferredWorkoutTime: TimeStringSchema,
  preferredBreakfastTime: TimeStringSchema,
  preferredLunchTime: TimeStringSchema,
  preferredDinnerTime: TimeStringSchema,
  preferredReadingTime: TimeStringSchema,

  motivation: z.string().trim().min(1).nullable(),
  commitment: z.boolean(),
});

type OnboardingValues = z.infer<typeof OnboardingSchema>;

type UserRow = {
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  timezone: string | null;
  work_schedule: string | null;
  stress_level: number | null;
  sleep_schedule: unknown;
  injuries: string[] | null;
  medical_conditions: string[] | null;
  activity_level: "sedentary" | "moderate" | "active" | null;
  equipment_available: string[] | null;
  dietary_restrictions: string[] | null;
  food_dislikes: string[] | null;
  favorite_cuisines: string[] | null;
  cooking_skill: "beginner" | "intermediate" | "advanced" | null;
  budget_level: "tight" | "moderate" | "flexible" | null;
  reading_speed_wpm: number | null;
  favorite_genres: string[] | null;
};

type MeasurementRow = {
  id: string;
  measured_at: string;
  weight_kg: number | null;
  belly_cm: number | null;
  chest_cm: number | null;
  biceps_left_cm: number | null;
  biceps_right_cm: number | null;
  calves_left_cm: number | null;
  calves_right_cm: number | null;
  thighs_left_cm: number | null;
  thighs_right_cm: number | null;
  shoulders_cm: number | null;
  neck_cm: number | null;
};

type ReadingGoalRow = {
  daily_reading_minutes: number | null;
  books_per_month: number | null;
};

function parseCsvText(value: string | null | undefined): string[] | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const items = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

function getObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hh, mm] = time.split(":").map((v) => Number(v));
  const total = (((hh * 60 + mm + minutes) % (24 * 60)) + 24 * 60) % (24 * 60);
  const nextH = String(Math.floor(total / 60)).padStart(2, "0");
  const nextM = String(total % 60).padStart(2, "0");
  return `${nextH}:${nextM}`;
}

type SchedulePreviewEvent = {
  title: string;
  eventType: "work" | "workout" | "meal" | "reading";
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

function sortByTime(a: { startTime: string }, b: { startTime: string }) {
  const aMin = parseTimeToMinutes(a.startTime) ?? 0;
  const bMin = parseTimeToMinutes(b.startTime) ?? 0;
  return aMin - bMin;
}

const StepMeta = [
  {
    key: "welcome",
    title: "Welcome",
    description: "Let’s set up your holistic life coach.",
  },
  {
    key: "personal",
    title: "Personal Information",
    description: "Basics for adaptive planning.",
  },
  {
    key: "health",
    title: "Health & Body",
    description: "Measurements and constraints.",
  },
  {
    key: "fitness",
    title: "Fitness Goals",
    description: "What you want and what you have.",
  },
  {
    key: "nutrition",
    title: "Nutrition Profile",
    description: "Preferences, dislikes, and constraints.",
  },
  {
    key: "reading",
    title: "Reading & Learning",
    description: "Targets and backlog.",
  },
  {
    key: "schedule",
    title: "Schedule (2-week block)",
    description: "Recurring anchors for planning.",
  },
  {
    key: "summary",
    title: "Goals Summary & Commitment",
    description: "Confirm you’re ready to start.",
  },
] as const;

type StepKey = (typeof StepMeta)[number]["key"];

const StepFields: Record<StepKey, (keyof OnboardingValues)[]> = {
  welcome: [],
  personal: [
    "age",
    "gender",
    "heightCm",
    "weightKg",
    "timezone",
    "locationText",
    "bedtime",
    "wakeTime",
    "workScheduleType",
    "stressLevel",
  ],
  health: [
    "bellyCm",
    "chestCm",
    "bicepsLeftCm",
    "bicepsRightCm",
    "calvesLeftCm",
    "calvesRightCm",
    "thighsLeftCm",
    "thighsRightCm",
    "shouldersCm",
    "neckCm",
    "injuriesText",
    "medicalConditionsText",
    "activityLevel",
  ],
  fitness: [
    "fitnessPrimaryGoals",
    "targetWeightKg",
    "targetBellyCm",
    "idealBodyDescription",
    "equipmentAvailable",
    "exercisePreferences",
  ],
  nutrition: [
    "dietaryPreference",
    "allergiesIntolerances",
    "foodsDislike",
    "favoriteCuisines",
    "cookingSkill",
    "shoppingFrequencyDays",
    "budgetLevel",
  ],
  reading: [
    "dailyReadingMinutes",
    "booksPerMonth",
    "readingSpeedWpm",
    "favoriteGenres",
    "backlogBooksText",
    "backlogAudiobooksText",
  ],
  schedule: [
    "workDays",
    "workStartTime",
    "workEndTime",
    "preferredWorkoutTime",
    "preferredBreakfastTime",
    "preferredLunchTime",
    "preferredDinnerTime",
    "preferredReadingTime",
  ],
  summary: ["motivation", "commitment"],
};

export function OnboardingWizard(props: { userId: string }) {
  const { userId } = props;
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [sleepScheduleBase, setSleepScheduleBase] = useState<
    Record<string, unknown>
  >({});

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: {
      age: null,
      gender: null,
      heightCm: null,
      weightKg: null,
      timezone: null,
      locationText: null,
      bedtime: null,
      wakeTime: null,
      workScheduleType: null,
      stressLevel: null,
      bellyCm: null,
      chestCm: null,
      bicepsLeftCm: null,
      bicepsRightCm: null,
      calvesLeftCm: null,
      calvesRightCm: null,
      thighsLeftCm: null,
      thighsRightCm: null,
      shouldersCm: null,
      neckCm: null,
      injuriesText: null,
      medicalConditionsText: null,
      activityLevel: null,
      fitnessPrimaryGoals: [],
      targetWeightKg: null,
      targetBellyCm: null,
      idealBodyDescription: null,
      equipmentAvailable: [],
      exercisePreferences: null,
      dietaryPreference: null,
      allergiesIntolerances: null,
      foodsDislike: null,
      favoriteCuisines: null,
      cookingSkill: null,
      shoppingFrequencyDays: null,
      budgetLevel: null,
      dailyReadingMinutes: null,
      booksPerMonth: null,
      readingSpeedWpm: null,
      favoriteGenres: null,
      backlogBooksText: null,
      backlogAudiobooksText: null,
      workDays: [1, 2, 3, 4, 5],
      workStartTime: null,
      workEndTime: null,
      preferredWorkoutTime: null,
      preferredBreakfastTime: null,
      preferredLunchTime: null,
      preferredDinnerTime: null,
      preferredReadingTime: null,
      motivation: null,
      commitment: false,
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: user, error: userError } = await supabase
          .from("users")
          .select(
            "age, gender, height_cm, timezone, work_schedule, stress_level, sleep_schedule, injuries, medical_conditions, activity_level, equipment_available, dietary_restrictions, food_dislikes, favorite_cuisines, cooking_skill, budget_level, reading_speed_wpm, favorite_genres"
          )
          .eq("id", userId)
          .maybeSingle();

        if (userError) {
          toast.error(userError.message);
          return;
        }

        const { data: measurement } = await supabase
          .from("measurements")
          .select(
            "id, measured_at, weight_kg, belly_cm, chest_cm, biceps_left_cm, biceps_right_cm, calves_left_cm, calves_right_cm, thighs_left_cm, thighs_right_cm, shoulders_cm, neck_cm"
          )
          .eq("user_id", userId)
          .order("measured_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: readingGoal } = await supabase
          .from("goals")
          .select("daily_reading_minutes, books_per_month")
          .eq("user_id", userId)
          .eq("category", "reading")
          .eq("goal_type", "target")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: fitnessTargetGoal } = await supabase
          .from("goals")
          .select("target_weight_kg, target_measurements")
          .eq("user_id", userId)
          .eq("category", "fitness")
          .eq("goal_type", "target")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (user) {
          const row = user as UserRow;
          const sleepBase = getObject(row.sleep_schedule);
          setSleepScheduleBase(sleepBase);

          const bedtime =
            typeof sleepBase.typicalBedtime === "string"
              ? sleepBase.typicalBedtime
              : null;
          const wakeTime =
            typeof sleepBase.typicalWakeTime === "string"
              ? sleepBase.typicalWakeTime
              : null;
          const locationText =
            typeof sleepBase.locationText === "string"
              ? sleepBase.locationText
              : null;

          form.reset({
            ...form.getValues(),
            age: row.age ?? null,
            gender: row.gender ?? null,
            heightCm: row.height_cm ?? null,
            timezone: row.timezone ?? null,
            workScheduleType: row.work_schedule ?? null,
            stressLevel: row.stress_level ?? null,
            bedtime,
            wakeTime,
            locationText,
            injuriesText: (row.injuries ?? []).join(", ") || null,
            medicalConditionsText:
              (row.medical_conditions ?? []).join(", ") || null,
            activityLevel: row.activity_level ?? null,
            equipmentAvailable: (row.equipment_available ?? []).filter((v) =>
              ["gym_membership", "home_equipment", "bodyweight_only"].includes(
                v
              )
            ) as OnboardingValues["equipmentAvailable"],
            dietaryPreference: (row.dietary_restrictions ?? []).find((v) =>
              ["omnivore", "vegetarian", "vegan", "pescatarian"].includes(v)
            ) as OnboardingValues["dietaryPreference"],
            foodsDislike: (row.food_dislikes ?? []).join(", ") || null,
            favoriteCuisines: (row.favorite_cuisines ?? []).join(", ") || null,
            cookingSkill: row.cooking_skill ?? null,
            budgetLevel: row.budget_level ?? null,
            readingSpeedWpm: row.reading_speed_wpm ?? null,
            favoriteGenres: (row.favorite_genres ?? []).join(", ") || null,
            dailyReadingMinutes:
              (readingGoal as ReadingGoalRow | null)?.daily_reading_minutes ??
              null,
            booksPerMonth:
              (readingGoal as ReadingGoalRow | null)?.books_per_month ?? null,
            targetWeightKg: (() => {
              const raw =
                (fitnessTargetGoal as { target_weight_kg?: unknown } | null)
                  ?.target_weight_kg ?? null;
              const num =
                typeof raw === "number"
                  ? raw
                  : typeof raw === "string" && raw.trim()
                    ? Number(raw)
                    : null;
              return typeof num === "number" && Number.isFinite(num)
                ? num
                : null;
            })(),
            targetBellyCm: (() => {
              const raw =
                (fitnessTargetGoal as { target_measurements?: unknown } | null)
                  ?.target_measurements ?? null;
              const obj = getObject(raw);
              const belly = obj.belly_cm;
              const num =
                typeof belly === "number"
                  ? belly
                  : typeof belly === "string" && belly.trim()
                    ? Number(belly)
                    : null;
              return typeof num === "number" && Number.isFinite(num)
                ? num
                : null;
            })(),
          });
        }

        if (measurement) {
          const m = measurement as MeasurementRow;
          form.setValue("weightKg", m.weight_kg ?? null);
          form.setValue("bellyCm", m.belly_cm ?? null);
          form.setValue("chestCm", m.chest_cm ?? null);
          form.setValue("bicepsLeftCm", m.biceps_left_cm ?? null);
          form.setValue("bicepsRightCm", m.biceps_right_cm ?? null);
          form.setValue("calvesLeftCm", m.calves_left_cm ?? null);
          form.setValue("calvesRightCm", m.calves_right_cm ?? null);
          form.setValue("thighsLeftCm", m.thighs_left_cm ?? null);
          form.setValue("thighsRightCm", m.thighs_right_cm ?? null);
          form.setValue("shouldersCm", m.shoulders_cm ?? null);
          form.setValue("neckCm", m.neck_cm ?? null);
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [form, supabase, userId]);

  async function upsertTodayMeasurement(values: Partial<MeasurementRow>) {
    const dayStart = startOfDay(new Date());
    const dayEnd = endOfDay(new Date());

    const { data: existing, error: existingError } = await supabase
      .from("measurements")
      .select("id")
      .eq("user_id", userId)
      .gte("measured_at", dayStart.toISOString())
      .lte("measured_at", dayEnd.toISOString())
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      toast.error(existingError.message);
      return;
    }

    if (existing?.id) {
      const { error } = await supabase
        .from("measurements")
        .update({
          weight_kg: values.weight_kg ?? null,
          belly_cm: values.belly_cm ?? null,
          chest_cm: values.chest_cm ?? null,
          biceps_left_cm: values.biceps_left_cm ?? null,
          biceps_right_cm: values.biceps_right_cm ?? null,
          calves_left_cm: values.calves_left_cm ?? null,
          calves_right_cm: values.calves_right_cm ?? null,
          thighs_left_cm: values.thighs_left_cm ?? null,
          thighs_right_cm: values.thighs_right_cm ?? null,
          shoulders_cm: values.shoulders_cm ?? null,
          neck_cm: values.neck_cm ?? null,
        })
        .eq("id", existing.id);

      if (error) toast.error(error.message);
      return;
    }

    const { error } = await supabase.from("measurements").insert({
      user_id: userId,
      weight_kg: values.weight_kg ?? null,
      belly_cm: values.belly_cm ?? null,
      chest_cm: values.chest_cm ?? null,
      biceps_left_cm: values.biceps_left_cm ?? null,
      biceps_right_cm: values.biceps_right_cm ?? null,
      calves_left_cm: values.calves_left_cm ?? null,
      calves_right_cm: values.calves_right_cm ?? null,
      thighs_left_cm: values.thighs_left_cm ?? null,
      thighs_right_cm: values.thighs_right_cm ?? null,
      shoulders_cm: values.shoulders_cm ?? null,
      neck_cm: values.neck_cm ?? null,
      input_method: "manual",
    });

    if (error) toast.error(error.message);
  }

  async function savePersonal(values: OnboardingValues) {
    const nextSleepSchedule = {
      ...sleepScheduleBase,
      typicalBedtime: values.bedtime,
      typicalWakeTime: values.wakeTime,
      locationText: values.locationText,
    };

    const { error } = await supabase
      .from("users")
      .update({
        age: values.age,
        gender: values.gender,
        height_cm: values.heightCm,
        timezone: values.timezone,
        work_schedule: values.workScheduleType,
        stress_level: values.stressLevel,
        sleep_schedule: nextSleepSchedule,
      })
      .eq("id", userId);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (values.weightKg)
      await upsertTodayMeasurement({ weight_kg: values.weightKg });
  }

  async function saveHealth(values: OnboardingValues) {
    const { error } = await supabase
      .from("users")
      .update({
        injuries: parseCsvText(values.injuriesText),
        medical_conditions: parseCsvText(values.medicalConditionsText),
        activity_level: values.activityLevel,
      })
      .eq("id", userId);

    if (error) {
      toast.error(error.message);
      return;
    }

    await upsertTodayMeasurement({
      weight_kg: values.weightKg ?? null,
      belly_cm: values.bellyCm ?? null,
      chest_cm: values.chestCm ?? null,
      biceps_left_cm: values.bicepsLeftCm ?? null,
      biceps_right_cm: values.bicepsRightCm ?? null,
      calves_left_cm: values.calvesLeftCm ?? null,
      calves_right_cm: values.calvesRightCm ?? null,
      thighs_left_cm: values.thighsLeftCm ?? null,
      thighs_right_cm: values.thighsRightCm ?? null,
      shoulders_cm: values.shouldersCm ?? null,
      neck_cm: values.neckCm ?? null,
    });
  }

  async function saveFitness(values: OnboardingValues) {
    const { error: userError } = await supabase
      .from("users")
      .update({
        equipment_available: values.equipmentAvailable.length
          ? values.equipmentAvailable
          : null,
      })
      .eq("id", userId);

    if (userError) {
      toast.error(userError.message);
      return;
    }

    const { data: existingGoals, error: goalsError } = await supabase
      .from("goals")
      .select("description")
      .eq("user_id", userId)
      .eq("category", "fitness")
      .eq("status", "active");

    if (goalsError) {
      toast.error(goalsError.message);
      return;
    }

    const existingDescriptions = new Set(
      (existingGoals ?? [])
        .map((g) =>
          typeof g.description === "string" ? g.description.trim() : ""
        )
        .filter(Boolean)
    );

    const lifestyleDescriptions: Record<
      OnboardingValues["fitnessPrimaryGoals"][number],
      string
    > = {
      lose_belly_fat: "Lose belly fat",
      build_muscle: "Build balanced, well-defined muscle",
      increase_strength: "Increase raw power and functional strength",
      improve_endurance: "Improve endurance",
      general_health: "General health",
    };

    const goalsToInsert: Array<Record<string, unknown>> =
      values.fitnessPrimaryGoals
        .map((key) => lifestyleDescriptions[key])
        .filter((desc) => !existingDescriptions.has(desc))
        .map((description) => ({
          user_id: userId,
          category: "fitness",
          goal_type: "lifestyle",
          description,
          status: "active",
        }));

    const extras = [
      values.idealBodyDescription
        ? `Ideal body: ${values.idealBodyDescription}`
        : null,
      values.exercisePreferences
        ? `Exercise preferences: ${values.exercisePreferences}`
        : null,
    ].filter(Boolean) as string[];

    for (const description of extras) {
      if (!existingDescriptions.has(description)) {
        goalsToInsert.push({
          user_id: userId,
          category: "fitness",
          goal_type: "lifestyle",
          description,
          status: "active",
        });
      }
    }

    if (goalsToInsert.length) {
      const { error } = await supabase.from("goals").insert(goalsToInsert);
      if (error) {
        toast.error(error.message);
        return;
      }
    }

    const targetMeasurements =
      values.targetBellyCm != null ? { belly_cm: values.targetBellyCm } : null;

    if (values.targetWeightKg || targetMeasurements) {
      const { data: targetGoal } = await supabase
        .from("goals")
        .select("id")
        .eq("user_id", userId)
        .eq("category", "fitness")
        .eq("goal_type", "target")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (targetGoal?.id) {
        const { error } = await supabase
          .from("goals")
          .update({
            target_weight_kg: values.targetWeightKg,
            target_measurements: targetMeasurements,
          })
          .eq("id", targetGoal.id);
        if (error) toast.error(error.message);
      } else {
        const { error } = await supabase.from("goals").insert({
          user_id: userId,
          category: "fitness",
          goal_type: "target",
          description: "Target measurements",
          target_weight_kg: values.targetWeightKg,
          target_measurements: targetMeasurements,
          status: "active",
        });
        if (error) toast.error(error.message);
      }
    }
  }

  async function saveNutrition(values: OnboardingValues) {
    const dietary = [
      values.dietaryPreference ?? null,
      values.allergiesIntolerances
        ? `allergies: ${values.allergiesIntolerances}`
        : null,
      values.shoppingFrequencyDays
        ? `shopping_every_days: ${values.shoppingFrequencyDays}`
        : null,
    ].filter(Boolean) as string[];

    const { error } = await supabase
      .from("users")
      .update({
        dietary_restrictions: dietary.length ? dietary : null,
        food_dislikes: parseCsvText(values.foodsDislike),
        favorite_cuisines: parseCsvText(values.favoriteCuisines),
        cooking_skill: values.cookingSkill,
        budget_level: values.budgetLevel,
      })
      .eq("id", userId);

    if (error) toast.error(error.message);
  }

  async function saveReading(values: OnboardingValues) {
    const { error: userError } = await supabase
      .from("users")
      .update({
        reading_speed_wpm: values.readingSpeedWpm,
        favorite_genres: parseCsvText(values.favoriteGenres),
      })
      .eq("id", userId);

    if (userError) {
      toast.error(userError.message);
      return;
    }

    const { data: existingGoal } = await supabase
      .from("goals")
      .select("id")
      .eq("user_id", userId)
      .eq("category", "reading")
      .eq("goal_type", "target")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const goalPayload = {
      daily_reading_minutes: values.dailyReadingMinutes,
      books_per_month: values.booksPerMonth,
    };

    if (existingGoal?.id) {
      const { error } = await supabase
        .from("goals")
        .update(goalPayload)
        .eq("id", existingGoal.id);
      if (error) toast.error(error.message);
    } else if (values.dailyReadingMinutes || values.booksPerMonth) {
      const { error } = await supabase.from("goals").insert({
        user_id: userId,
        category: "reading",
        goal_type: "target",
        description: "Reading targets",
        status: "active",
        ...goalPayload,
      });
      if (error) toast.error(error.message);
    }

    const parseBacklogLines = (
      raw: string | null,
      format: "physical" | "audiobook"
    ) => {
      const text = (raw ?? "").trim();
      if (!text) return [];
      return text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [titlePart, authorPart] = line
            .split(" - ")
            .map((p) => p.trim());
          return {
            title: titlePart ?? line,
            author: authorPart ?? null,
            format,
          };
        })
        .filter((item) => item.title);
    };

    const toInsert = [
      ...parseBacklogLines(values.backlogBooksText, "physical"),
      ...parseBacklogLines(values.backlogAudiobooksText, "audiobook"),
    ].map((item) => ({
      user_id: userId,
      title: item.title,
      author: item.author,
      format: item.format,
      status: "backlog",
    }));

    if (toInsert.length) {
      const { data: existingBooks } = await supabase
        .from("books")
        .select("title, author, format, status")
        .eq("user_id", userId)
        .eq("status", "backlog");

      const existingKeySet = new Set(
        (existingBooks ?? [])
          .map((b) => {
            const title =
              typeof b.title === "string" ? b.title.trim().toLowerCase() : "";
            const author =
              typeof b.author === "string" ? b.author.trim().toLowerCase() : "";
            const format =
              typeof b.format === "string" ? b.format.trim().toLowerCase() : "";
            return `${format}::${title}::${author}`;
          })
          .filter(Boolean)
      );

      const newRows = toInsert.filter((row) => {
        const title = String(row.title ?? "")
          .trim()
          .toLowerCase();
        const author = String(row.author ?? "")
          .trim()
          .toLowerCase();
        const format = String(row.format ?? "")
          .trim()
          .toLowerCase();
        if (!title || !format) return false;
        const key = `${format}::${title}::${author}`;
        return !existingKeySet.has(key);
      });

      if (!newRows.length) return;

      const { error } = await supabase.from("books").insert(newRows);
      if (error) toast.error(error.message);
    }
  }

  async function saveSchedule(values: OnboardingValues) {
    const titles = [
      "Work",
      "Workout",
      "Breakfast",
      "Lunch",
      "Dinner",
      "Reading",
    ];

    const { error: deleteError } = await supabase
      .from("user_schedules")
      .delete()
      .eq("user_id", userId)
      .eq("schedule_type", "recurring")
      .in("title", titles);

    if (deleteError) {
      toast.error(deleteError.message);
      return;
    }

    const rows: Array<Record<string, unknown>> = [];
    const daysOfWeek = values.workDays.length
      ? values.workDays
      : [1, 2, 3, 4, 5];

    if (values.workStartTime && values.workEndTime) {
      rows.push({
        user_id: userId,
        schedule_type: "recurring",
        event_type: "work",
        title: "Work",
        start_date: null,
        end_date: null,
        days_of_week: daysOfWeek,
        start_time: values.workStartTime,
        end_time: values.workEndTime,
        priority: 10,
      });
    }

    if (values.preferredWorkoutTime) {
      rows.push({
        user_id: userId,
        schedule_type: "recurring",
        event_type: "workout",
        title: "Workout",
        start_date: null,
        end_date: null,
        days_of_week: daysOfWeek,
        start_time: values.preferredWorkoutTime,
        end_time: addMinutesToTime(values.preferredWorkoutTime, 60),
        priority: 8,
      });
    }

    const mealEntries: Array<{ title: string; time: string | null }> = [
      { title: "Breakfast", time: values.preferredBreakfastTime },
      { title: "Lunch", time: values.preferredLunchTime },
      { title: "Dinner", time: values.preferredDinnerTime },
    ];

    for (const meal of mealEntries) {
      if (!meal.time) continue;
      rows.push({
        user_id: userId,
        schedule_type: "recurring",
        event_type: "meal",
        title: meal.title,
        start_date: null,
        end_date: null,
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        start_time: meal.time,
        end_time: addMinutesToTime(meal.time, 30),
        priority: 7,
      });
    }

    if (values.preferredReadingTime) {
      rows.push({
        user_id: userId,
        schedule_type: "recurring",
        event_type: "reading",
        title: "Reading",
        start_date: null,
        end_date: null,
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        start_time: values.preferredReadingTime,
        end_time: addMinutesToTime(values.preferredReadingTime, 30),
        priority: 6,
      });
    }

    if (rows.length) {
      const { error } = await supabase.from("user_schedules").insert(rows);
      if (error) toast.error(error.message);
    }
  }

  async function saveSummary(values: OnboardingValues) {
    const completedAt = new Date().toISOString();
    const nextSleepSchedule = {
      ...sleepScheduleBase,
      onboardingCompletedAt: completedAt,
    };

    const { error } = await supabase
      .from("users")
      .update({ sleep_schedule: nextSleepSchedule })
      .eq("id", userId);

    if (error) {
      toast.error(error.message);
      return;
    }

    try {
      localStorage.removeItem("sm_onboarding_skip");
      localStorage.setItem("sm_onboarding_completed", completedAt);
    } catch {}

    if (values.motivation) {
      const motivationDescription = `Motivation: ${values.motivation}`;
      const { data: existing } = await supabase
        .from("goals")
        .select("id")
        .eq("user_id", userId)
        .eq("category", "lifestyle")
        .eq("status", "active")
        .eq("description", motivationDescription)
        .maybeSingle();

      if (!existing?.id) {
        const { error: insertError } = await supabase.from("goals").insert({
          user_id: userId,
          category: "lifestyle",
          goal_type: "lifestyle",
          description: motivationDescription,
          status: "active",
        });
        if (insertError) toast.error(insertError.message);
      }
    }
  }

  async function onContinue() {
    const step = StepMeta[stepIndex];
    const fields = StepFields[step.key];
    const ok = fields.length
      ? await form.trigger(fields, { shouldFocus: true })
      : true;
    if (!ok) return;

    const values = form.getValues();
    setSaving(true);
    try {
      if (step.key === "personal") await savePersonal(values);
      if (step.key === "health") await saveHealth(values);
      if (step.key === "fitness") await saveFitness(values);
      if (step.key === "nutrition") await saveNutrition(values);
      if (step.key === "reading") await saveReading(values);
      if (step.key === "schedule") await saveSchedule(values);
      if (step.key === "summary") {
        if (!values.commitment) {
          toast.error("Please confirm your commitment to continue.");
          return;
        }
        await saveSummary(values);
        toast.success("Onboarding completed");
        router.push("/");
        return;
      }

      setStepIndex((i) => Math.min(i + 1, StepMeta.length - 1));
    } finally {
      setSaving(false);
    }
  }

  function onBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function toggleFitnessPrimaryGoal(
    value: OnboardingValues["fitnessPrimaryGoals"][number]
  ) {
    const current = form.getValues("fitnessPrimaryGoals");
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    form.setValue("fitnessPrimaryGoals", next, { shouldDirty: true });
  }

  function toggleEquipmentAvailable(
    value: OnboardingValues["equipmentAvailable"][number]
  ) {
    const current = form.getValues("equipmentAvailable");
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    form.setValue("equipmentAvailable", next, { shouldDirty: true });
  }

  const step = StepMeta[stepIndex];
  const progressText =
    step.key === "welcome" ? "Step 0/7" : `Step ${stepIndex}/7`;

  const [
    watchedWorkDays,
    watchedWorkStartTime,
    watchedWorkEndTime,
    watchedPreferredWorkoutTime,
    watchedPreferredBreakfastTime,
    watchedPreferredLunchTime,
    watchedPreferredDinnerTime,
    watchedPreferredReadingTime,
    watchedWakeTime,
    watchedBedtime,
  ] = form.watch([
    "workDays",
    "workStartTime",
    "workEndTime",
    "preferredWorkoutTime",
    "preferredBreakfastTime",
    "preferredLunchTime",
    "preferredDinnerTime",
    "preferredReadingTime",
    "wakeTime",
    "bedtime",
  ]) as [
    OnboardingValues["workDays"],
    OnboardingValues["workStartTime"],
    OnboardingValues["workEndTime"],
    OnboardingValues["preferredWorkoutTime"],
    OnboardingValues["preferredBreakfastTime"],
    OnboardingValues["preferredLunchTime"],
    OnboardingValues["preferredDinnerTime"],
    OnboardingValues["preferredReadingTime"],
    OnboardingValues["wakeTime"],
    OnboardingValues["bedtime"],
  ];

  const schedulePreview = useMemo(() => {
    const workDays = watchedWorkDays ?? [];
    const wakeTime = watchedWakeTime ?? null;
    const bedtime = watchedBedtime ?? null;
    const rangeStartTime = wakeTime ?? "06:30";
    const rangeEndTime = bedtime ?? "23:00";

    const events: SchedulePreviewEvent[] = [];

    const workStart = watchedWorkStartTime;
    const workEnd = watchedWorkEndTime;
    if (workStart && workEnd) {
      for (const d of workDays.length ? workDays : [1, 2, 3, 4, 5]) {
        events.push({
          title: "Work",
          eventType: "work",
          dayOfWeek: d,
          startTime: workStart,
          endTime: workEnd,
        });
      }
    }

    const workoutStart = watchedPreferredWorkoutTime;
    if (workoutStart) {
      const workoutEnd = addMinutesToTime(workoutStart, 60);
      for (const d of workDays.length ? workDays : [1, 2, 3, 4, 5]) {
        events.push({
          title: "Workout",
          eventType: "workout",
          dayOfWeek: d,
          startTime: workoutStart,
          endTime: workoutEnd,
        });
      }
    }

    const breakfast = watchedPreferredBreakfastTime;
    const lunch = watchedPreferredLunchTime;
    const dinner = watchedPreferredDinnerTime;
    const meals: Array<{ title: string; time: string | null }> = [
      { title: "Breakfast", time: breakfast },
      { title: "Lunch", time: lunch },
      { title: "Dinner", time: dinner },
    ];
    for (const m of meals) {
      if (!m.time) continue;
      const endTime = addMinutesToTime(m.time, 30);
      for (const d of [1, 2, 3, 4, 5, 6, 0]) {
        events.push({
          title: m.title,
          eventType: "meal",
          dayOfWeek: d,
          startTime: m.time,
          endTime,
        });
      }
    }

    const readingStart = watchedPreferredReadingTime;
    if (readingStart) {
      const readingEnd = addMinutesToTime(readingStart, 30);
      for (const d of [1, 2, 3, 4, 5, 6, 0]) {
        events.push({
          title: "Reading",
          eventType: "reading",
          dayOfWeek: d,
          startTime: readingStart,
          endTime: readingEnd,
        });
      }
    }

    const byDay = new Map<number, SchedulePreviewEvent[]>();
    for (const e of events) {
      const list = byDay.get(e.dayOfWeek) ?? [];
      list.push(e);
      byDay.set(e.dayOfWeek, list);
    }
    for (const [, list] of byDay) list.sort(sortByTime);

    const dayOrder = [1, 2, 3, 4, 5, 6, 0];
    const dayLabels: Record<number, string> = {
      0: "Sun",
      1: "Mon",
      2: "Tue",
      3: "Wed",
      4: "Thu",
      5: "Fri",
      6: "Sat",
    };

    const freeWindowsByDay = new Map<
      number,
      Array<{ startTime: string; endTime: string }>
    >();
    for (const d of dayOrder) {
      const busy = (byDay.get(d) ?? []).map((e) => ({
        startTime: e.startTime,
        endTime: e.endTime,
      }));
      freeWindowsByDay.set(
        d,
        computeFreeTimeWindows({ busy, rangeStartTime, rangeEndTime })
      );
    }

    return {
      dayOrder,
      dayLabels,
      byDay,
      freeWindowsByDay,
      rangeStartTime,
      rangeEndTime,
    };
  }, [
    watchedWorkDays,
    watchedWorkStartTime,
    watchedWorkEndTime,
    watchedPreferredWorkoutTime,
    watchedPreferredBreakfastTime,
    watchedPreferredLunchTime,
    watchedPreferredDinnerTime,
    watchedPreferredReadingTime,
    watchedWakeTime,
    watchedBedtime,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{step.title}</CardTitle>
        <CardDescription>
          {step.description} • {progressText}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step.key === "welcome" ? (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              You’ll work with 4 managers:
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black">
                <div className="font-medium">Atlas</div>
                <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                  Master coordinator and guardian of your goals.
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black">
                <div className="font-medium">Forge</div>
                <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                  Fitness planning, strength, and recovery.
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black">
                <div className="font-medium">Olive</div>
                <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                  Nutrition, meals, and health guidance.
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black">
                <div className="font-medium">Lexicon</div>
                <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                  Reading, learning, and deep discussions.
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step.key === "personal" ? (
          <div className="mt-5 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={1}
                  max={120}
                  disabled={loading}
                  value={form.watch("age") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "age",
                      e.target.value === "" ? null : Number(e.target.value),
                      { shouldDirty: true }
                    )
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  disabled={loading}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  value={form.watch("gender") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "gender",
                      e.target.value === "" ? null : e.target.value,
                      {
                        shouldDirty: true,
                      }
                    )
                  }
                >
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  min={1}
                  disabled={loading}
                  value={form.watch("heightCm") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "heightCm",
                      e.target.value === "" ? null : Number(e.target.value),
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="weightKg">Weight (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  min={1}
                  disabled={loading}
                  value={form.watch("weightKg") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "weightKg",
                      e.target.value === "" ? null : Number(e.target.value),
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  type="text"
                  disabled={loading}
                  placeholder="e.g. Europe/London"
                  value={form.watch("timezone") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "timezone",
                      e.target.value === "" ? null : e.target.value,
                      {
                        shouldDirty: true,
                      }
                    )
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="locationText">Current location (optional)</Label>
              <Input
                id="locationText"
                type="text"
                disabled={loading}
                placeholder="e.g. London"
                value={form.watch("locationText") ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "locationText",
                    e.target.value === "" ? null : e.target.value,
                    {
                      shouldDirty: true,
                    }
                  )
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="bedtime">Typical bedtime</Label>
                <Input
                  id="bedtime"
                  type="time"
                  disabled={loading}
                  value={form.watch("bedtime") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "bedtime",
                      e.target.value === "" ? null : e.target.value,
                      {
                        shouldDirty: true,
                      }
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="wakeTime">Typical wake time</Label>
                <Input
                  id="wakeTime"
                  type="time"
                  disabled={loading}
                  value={form.watch("wakeTime") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "wakeTime",
                      e.target.value === "" ? null : e.target.value,
                      {
                        shouldDirty: true,
                      }
                    )
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="workScheduleType">Work schedule type</Label>
                <select
                  id="workScheduleType"
                  disabled={loading}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  value={form.watch("workScheduleType") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "workScheduleType",
                      e.target.value === "" ? null : e.target.value,
                      { shouldDirty: true }
                    )
                  }
                >
                  <option value="">Select…</option>
                  <option value="9-5">9–5</option>
                  <option value="flexible">Flexible</option>
                  <option value="shift_work">Shift work</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="stressLevel">Stress level (1–10)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="stressLevel"
                    type="range"
                    min={1}
                    max={10}
                    disabled={loading}
                    value={form.watch("stressLevel") ?? 5}
                    onChange={(e) =>
                      form.setValue("stressLevel", Number(e.target.value), {
                        shouldDirty: true,
                      })
                    }
                  />
                  <div className="w-8 text-right text-sm text-zinc-600 dark:text-zinc-400">
                    {form.watch("stressLevel") ?? "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step.key === "health" ? (
          <div className="mt-5 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="activityLevel">Activity level</Label>
                <select
                  id="activityLevel"
                  disabled={loading}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  value={form.watch("activityLevel") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "activityLevel",
                      e.target.value === ""
                        ? null
                        : (e.target.value as OnboardingValues["activityLevel"]),
                      { shouldDirty: true }
                    )
                  }
                >
                  <option value="">Select…</option>
                  <option value="sedentary">Sedentary</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["bellyCm", "Belly (cm)"],
                ["chestCm", "Chest (cm)"],
                ["shouldersCm", "Shoulders (cm)"],
                ["neckCm", "Neck (cm)"],
                ["bicepsLeftCm", "Biceps left (cm)"],
                ["bicepsRightCm", "Biceps right (cm)"],
                ["calvesLeftCm", "Calves left (cm)"],
                ["calvesRightCm", "Calves right (cm)"],
                ["thighsLeftCm", "Thighs left (cm)"],
                ["thighsRightCm", "Thighs right (cm)"],
              ].map(([key, label]) => {
                const field = key as keyof OnboardingValues;
                return (
                  <div key={key} className="flex flex-col gap-2">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type="number"
                      min={0}
                      disabled={loading}
                      value={(form.watch(field) as number | null) ?? ""}
                      onChange={(e) =>
                        form.setValue(
                          field,
                          e.target.value === "" ? null : Number(e.target.value),
                          { shouldDirty: true }
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="injuriesText">
                  Injuries / limitations (comma-separated)
                </Label>
                <textarea
                  id="injuriesText"
                  disabled={loading}
                  className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  value={form.watch("injuriesText") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "injuriesText",
                      e.target.value === "" ? null : e.target.value,
                      {
                        shouldDirty: true,
                      }
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="medicalConditionsText">
                  Medical conditions (comma-separated)
                </Label>
                <textarea
                  id="medicalConditionsText"
                  disabled={loading}
                  className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  value={form.watch("medicalConditionsText") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "medicalConditionsText",
                      e.target.value === "" ? null : e.target.value,
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
            </div>
          </div>
        ) : null}

        {step.key === "fitness" ? (
          <div className="mt-5 flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium">Primary fitness goals</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["lose_belly_fat", "Lose belly fat"],
                  ["build_muscle", "Build muscle"],
                  ["increase_strength", "Increase strength / power"],
                  ["improve_endurance", "Improve endurance"],
                  ["general_health", "General health"],
                ].map(([key, label]) => {
                  const checked = form
                    .watch("fitnessPrimaryGoals")
                    .includes(
                      key as OnboardingValues["fitnessPrimaryGoals"][number]
                    );
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-black"
                    >
                      <input
                        type="checkbox"
                        disabled={loading}
                        checked={checked}
                        onChange={() =>
                          toggleFitnessPrimaryGoal(
                            key as OnboardingValues["fitnessPrimaryGoals"][number]
                          )
                        }
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="targetWeightKg">
                  Target weight (optional, kg)
                </Label>
                <Input
                  id="targetWeightKg"
                  type="number"
                  min={1}
                  disabled={loading}
                  value={form.watch("targetWeightKg") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "targetWeightKg",
                      e.target.value === "" ? null : Number(e.target.value),
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="targetBellyCm">
                  Target belly (optional, cm)
                </Label>
                <Input
                  id="targetBellyCm"
                  type="number"
                  min={1}
                  disabled={loading}
                  value={form.watch("targetBellyCm") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "targetBellyCm",
                      e.target.value === "" ? null : Number(e.target.value),
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="equipmentAvailable">Available equipment</Label>
                <div className="grid gap-2">
                  {[
                    ["gym_membership", "Gym membership"],
                    ["home_equipment", "Home equipment"],
                    ["bodyweight_only", "Bodyweight only"],
                  ].map(([key, label]) => {
                    const checked = form
                      .watch("equipmentAvailable")
                      .includes(
                        key as OnboardingValues["equipmentAvailable"][number]
                      );
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-black"
                      >
                        <input
                          type="checkbox"
                          disabled={loading}
                          checked={checked}
                          onChange={() =>
                            toggleEquipmentAvailable(
                              key as OnboardingValues["equipmentAvailable"][number]
                            )
                          }
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="idealBodyDescription">
                  Ideal body description (optional)
                </Label>
                <textarea
                  id="idealBodyDescription"
                  disabled={loading}
                  className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  value={form.watch("idealBodyDescription") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "idealBodyDescription",
                      e.target.value === "" ? null : e.target.value,
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="exercisePreferences">
                  Exercise preferences (optional)
                </Label>
                <textarea
                  id="exercisePreferences"
                  disabled={loading}
                  className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  value={form.watch("exercisePreferences") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "exercisePreferences",
                      e.target.value === "" ? null : e.target.value,
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
            </div>
          </div>
        ) : null}

        {step.key === "nutrition" ? (
          <div className="mt-5 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="dietaryPreference">Dietary preference</Label>
                <select
                  id="dietaryPreference"
                  disabled={loading}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  value={form.watch("dietaryPreference") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "dietaryPreference",
                      e.target.value === ""
                        ? null
                        : (e.target
                            .value as OnboardingValues["dietaryPreference"]),
                      { shouldDirty: true }
                    )
                  }
                >
                  <option value="">Select…</option>
                  <option value="omnivore">Omnivore</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="pescatarian">Pescatarian</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cookingSkill">Cooking skill</Label>
                <select
                  id="cookingSkill"
                  disabled={loading}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  value={form.watch("cookingSkill") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "cookingSkill",
                      e.target.value === ""
                        ? null
                        : (e.target.value as OnboardingValues["cookingSkill"]),
                      { shouldDirty: true }
                    )
                  }
                >
                  <option value="">Select…</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="budgetLevel">Budget</Label>
                <select
                  id="budgetLevel"
                  disabled={loading}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  value={form.watch("budgetLevel") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "budgetLevel",
                      e.target.value === ""
                        ? null
                        : (e.target.value as OnboardingValues["budgetLevel"]),
                      { shouldDirty: true }
                    )
                  }
                >
                  <option value="">Select…</option>
                  <option value="tight">Tight</option>
                  <option value="moderate">Moderate</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="shoppingFrequencyDays">
                  Shopping frequency (days)
                </Label>
                <Input
                  id="shoppingFrequencyDays"
                  type="number"
                  min={1}
                  disabled={loading}
                  value={form.watch("shoppingFrequencyDays") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "shoppingFrequencyDays",
                      e.target.value === "" ? null : Number(e.target.value),
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="allergiesIntolerances">
                  Allergies & intolerances (optional)
                </Label>
                <textarea
                  id="allergiesIntolerances"
                  disabled={loading}
                  className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  value={form.watch("allergiesIntolerances") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "allergiesIntolerances",
                      e.target.value === "" ? null : e.target.value,
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="foodsDislike">
                  Foods you dislike (comma-separated)
                </Label>
                <textarea
                  id="foodsDislike"
                  disabled={loading}
                  className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  value={form.watch("foodsDislike") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "foodsDislike",
                      e.target.value === "" ? null : e.target.value,
                      {
                        shouldDirty: true,
                      }
                    )
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="favoriteCuisines">
                Favorite cuisines (comma-separated)
              </Label>
              <Input
                id="favoriteCuisines"
                type="text"
                disabled={loading}
                placeholder="e.g. Italian, Mediterranean, Asian"
                value={form.watch("favoriteCuisines") ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "favoriteCuisines",
                    e.target.value === "" ? null : e.target.value,
                    {
                      shouldDirty: true,
                    }
                  )
                }
              />
            </div>
          </div>
        ) : null}

        {step.key === "reading" ? (
          <div className="mt-5 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="dailyReadingMinutes">
                  Daily reading (minutes)
                </Label>
                <Input
                  id="dailyReadingMinutes"
                  type="number"
                  min={1}
                  disabled={loading}
                  value={form.watch("dailyReadingMinutes") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "dailyReadingMinutes",
                      e.target.value === "" ? null : Number(e.target.value),
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="booksPerMonth">Books per month</Label>
                <Input
                  id="booksPerMonth"
                  type="number"
                  min={1}
                  disabled={loading}
                  value={form.watch("booksPerMonth") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "booksPerMonth",
                      e.target.value === "" ? null : Number(e.target.value),
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="readingSpeedWpm">
                  Reading speed (WPM, optional)
                </Label>
                <Input
                  id="readingSpeedWpm"
                  type="number"
                  min={1}
                  disabled={loading}
                  value={form.watch("readingSpeedWpm") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "readingSpeedWpm",
                      e.target.value === "" ? null : Number(e.target.value),
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="favoriteGenres">
                Favorite genres / topics (comma-separated)
              </Label>
              <Input
                id="favoriteGenres"
                type="text"
                disabled={loading}
                placeholder="e.g. philosophy, psychology, self-help"
                value={form.watch("favoriteGenres") ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "favoriteGenres",
                    e.target.value === "" ? null : e.target.value,
                    {
                      shouldDirty: true,
                    }
                  )
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="backlogBooksText">
                  Backlog books (one per line: Title - Author)
                </Label>
                <textarea
                  id="backlogBooksText"
                  disabled={loading}
                  className="min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  value={form.watch("backlogBooksText") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "backlogBooksText",
                      e.target.value === "" ? null : e.target.value,
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="backlogAudiobooksText">
                  Backlog audiobooks (one per line: Title - Author)
                </Label>
                <textarea
                  id="backlogAudiobooksText"
                  disabled={loading}
                  className="min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  value={form.watch("backlogAudiobooksText") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "backlogAudiobooksText",
                      e.target.value === "" ? null : e.target.value,
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
            </div>
          </div>
        ) : null}

        {step.key === "schedule" ? (
          <div className="mt-5 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Work days</div>
              <div className="flex flex-wrap gap-2">
                {[
                  [1, "Mon"],
                  [2, "Tue"],
                  [3, "Wed"],
                  [4, "Thu"],
                  [5, "Fri"],
                  [6, "Sat"],
                  [0, "Sun"],
                ].map(([value, label]) => {
                  const checked = form
                    .watch("workDays")
                    .includes(value as number);
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={loading}
                      className={
                        "rounded-md border px-3 py-1 text-sm " +
                        (checked
                          ? "border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900"
                          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black")
                      }
                      onClick={() => {
                        const current = form.getValues("workDays");
                        const next = current.includes(value as number)
                          ? current.filter((d) => d !== value)
                          : [...current, value as number];
                        form.setValue("workDays", next, { shouldDirty: true });
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="workStartTime">Work start</Label>
                <Input
                  id="workStartTime"
                  type="time"
                  disabled={loading}
                  value={form.watch("workStartTime") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "workStartTime",
                      e.target.value === "" ? null : e.target.value,
                      {
                        shouldDirty: true,
                      }
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="workEndTime">Work end</Label>
                <Input
                  id="workEndTime"
                  type="time"
                  disabled={loading}
                  value={form.watch("workEndTime") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "workEndTime",
                      e.target.value === "" ? null : e.target.value,
                      {
                        shouldDirty: true,
                      }
                    )
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="preferredWorkoutTime">
                  Preferred workout time
                </Label>
                <Input
                  id="preferredWorkoutTime"
                  type="time"
                  disabled={loading}
                  value={form.watch("preferredWorkoutTime") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "preferredWorkoutTime",
                      e.target.value === "" ? null : e.target.value,
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="preferredReadingTime">
                  Preferred reading time
                </Label>
                <Input
                  id="preferredReadingTime"
                  type="time"
                  disabled={loading}
                  value={form.watch("preferredReadingTime") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "preferredReadingTime",
                      e.target.value === "" ? null : e.target.value,
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="preferredBreakfastTime">Breakfast</Label>
                <Input
                  id="preferredBreakfastTime"
                  type="time"
                  disabled={loading}
                  value={form.watch("preferredBreakfastTime") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "preferredBreakfastTime",
                      e.target.value === "" ? null : e.target.value,
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="preferredLunchTime">Lunch</Label>
                <Input
                  id="preferredLunchTime"
                  type="time"
                  disabled={loading}
                  value={form.watch("preferredLunchTime") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "preferredLunchTime",
                      e.target.value === "" ? null : e.target.value,
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="preferredDinnerTime">Dinner</Label>
                <Input
                  id="preferredDinnerTime"
                  type="time"
                  disabled={loading}
                  value={form.watch("preferredDinnerTime") ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      "preferredDinnerTime",
                      e.target.value === "" ? null : e.target.value,
                      { shouldDirty: true }
                    )
                  }
                />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-black">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-medium">Calendar builder</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  Preview of recurring anchors ({schedulePreview.rangeStartTime}
                  –{schedulePreview.rangeEndTime})
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                {schedulePreview.dayOrder.map((day) => {
                  const events = schedulePreview.byDay.get(day) ?? [];
                  const free = schedulePreview.freeWindowsByDay.get(day) ?? [];
                  return (
                    <div
                      key={day}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="text-sm font-medium">
                        {schedulePreview.dayLabels[day]}
                      </div>
                      <div className="mt-2 flex flex-col gap-2">
                        {events.length ? (
                          events.map((e, idx) => (
                            <div
                              key={`${e.title}-${idx}`}
                              className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs dark:border-zinc-800 dark:bg-black"
                            >
                              <div className="min-w-0 truncate font-medium">
                                {e.title}
                              </div>
                              <div className="shrink-0 tabular-nums text-zinc-600 dark:text-zinc-400">
                                {e.startTime}–{e.endTime}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">
                            No anchors
                          </div>
                        )}

                        <div className="pt-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          Free windows
                        </div>
                        {free.length ? (
                          <div className="flex flex-wrap gap-1">
                            {free.slice(0, 4).map((w) => (
                              <span
                                key={`${w.startTime}-${w.endTime}`}
                                className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] tabular-nums text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                              >
                                {w.startTime}–{w.endTime}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">
                            None
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {step.key === "summary" ? (
          <div className="mt-5 flex flex-col gap-5">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black">
              <div className="font-medium">Quick summary</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>Age: {form.watch("age") ?? "—"}</div>
                <div>Height: {form.watch("heightCm") ?? "—"} cm</div>
                <div>Weight: {form.watch("weightKg") ?? "—"} kg</div>
                <div>Timezone: {form.watch("timezone") ?? "—"}</div>
                <div>Activity: {form.watch("activityLevel") ?? "—"}</div>
                <div>
                  Reading: {form.watch("dailyReadingMinutes") ?? "—"} min/day
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="motivation">
                Why are these goals important to you?
              </Label>
              <textarea
                id="motivation"
                disabled={loading}
                className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                value={form.watch("motivation") ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "motivation",
                    e.target.value === "" ? null : e.target.value,
                    {
                      shouldDirty: true,
                    }
                  )
                }
              />
            </div>

            <label className="flex items-start gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm dark:border-zinc-800 dark:bg-black">
              <input
                type="checkbox"
                disabled={loading}
                checked={form.watch("commitment")}
                onChange={(e) =>
                  form.setValue("commitment", e.target.checked, {
                    shouldDirty: true,
                  })
                }
              />
              <span>I’m committed to this lifestyle transformation.</span>
            </label>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="border-t">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                try {
                  localStorage.setItem(
                    "sm_onboarding_skip",
                    String(Date.now())
                  );
                } catch {}
                router.push("/");
              }}
            >
              Skip for now
            </Button>
            {stepIndex > 0 ? (
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
            ) : null}
          </div>

          <Button
            type="button"
            disabled={loading || saving}
            onClick={() => void onContinue()}
          >
            {saving
              ? "Saving…"
              : step.key === "summary"
                ? "Complete Onboarding"
                : "Save & continue"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
