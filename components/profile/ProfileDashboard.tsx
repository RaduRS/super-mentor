"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

type UserProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  timezone: string | null;
  activity_level: string | null;
  injuries: unknown;
  medical_conditions: unknown;
  dietary_restrictions: unknown;
  food_dislikes: unknown;
  favorite_cuisines: unknown;
  cooking_skill: string | null;
  budget_level: string | null;
  reading_speed_wpm: number | null;
  favorite_genres: unknown;
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
  body_fat_percentage: number | null;
};

function normalizeList(value: unknown): string {
  if (!value) return "—";
  if (Array.isArray(value)) {
    const items = value.map((v) => String(v)).filter((s) => s.trim());
    return items.length ? items.join(", ") : "—";
  }
  if (typeof value === "string") return value.trim() ? value.trim() : "—";
  return "—";
}

function formatNumber(value: number | null | undefined, unit?: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  return unit ? `${rounded}${unit}` : String(rounded);
}

function formatDelta(
  current: number | null,
  previous: number | null,
  unit: string
) {
  if (
    typeof current !== "number" ||
    !Number.isFinite(current) ||
    typeof previous !== "number" ||
    !Number.isFinite(previous)
  ) {
    return null;
  }
  const delta = Math.round((current - previous) * 10) / 10;
  if (delta === 0) return "0";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}${unit}`;
}

function getDefaultMeasuredAtLocal() {
  const date = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

type ProgressMetric = "weight" | "belly" | "bodyFat";

function formatAxisDate(milliseconds: number) {
  const date = new Date(milliseconds);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTooltipDate(milliseconds: number) {
  const date = new Date(milliseconds);
  return date.toLocaleString();
}

const MeasurementFormSchema = z.object({
  measuredAt: z.string().min(1),
  weightKg: z.union([z.string(), z.number()]).optional(),
  bellyCm: z.union([z.string(), z.number()]).optional(),
  chestCm: z.union([z.string(), z.number()]).optional(),
  bicepsLeftCm: z.union([z.string(), z.number()]).optional(),
  bicepsRightCm: z.union([z.string(), z.number()]).optional(),
  calvesLeftCm: z.union([z.string(), z.number()]).optional(),
  calvesRightCm: z.union([z.string(), z.number()]).optional(),
  thighsLeftCm: z.union([z.string(), z.number()]).optional(),
  thighsRightCm: z.union([z.string(), z.number()]).optional(),
  shouldersCm: z.union([z.string(), z.number()]).optional(),
  neckCm: z.union([z.string(), z.number()]).optional(),
  bodyFatPercentage: z.union([z.string(), z.number()]).optional(),
});

type MeasurementFormValues = z.infer<typeof MeasurementFormSchema>;

function toNullablePositiveNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(String(value));
  if (!Number.isFinite(num)) return null;
  if (num <= 0) return null;
  return num;
}

function toNullableNonNegativeNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(String(value));
  if (!Number.isFinite(num)) return null;
  if (num < 0) return null;
  return num;
}

export function ProfileDashboard(props: { userId: string }) {
  const { userId } = props;
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMetric, setProgressMetric] = useState<ProgressMetric>("weight");
  const [progressRangeDays, setProgressRangeDays] = useState<30 | 90 | 365 | 0>(
    90
  );

  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(MeasurementFormSchema),
    defaultValues: {
      measuredAt: getDefaultMeasuredAtLocal(),
      weightKg: "",
      bellyCm: "",
      chestCm: "",
      bicepsLeftCm: "",
      bicepsRightCm: "",
      calvesLeftCm: "",
      calvesRightCm: "",
      thighsLeftCm: "",
      thighsRightCm: "",
      shouldersCm: "",
      neckCm: "",
      bodyFatPercentage: "",
    },
    mode: "onSubmit",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          "id, name, email, age, gender, height_cm, timezone, activity_level, injuries, medical_conditions, dietary_restrictions, food_dislikes, favorite_cuisines, cooking_skill, budget_level, reading_speed_wpm, favorite_genres"
        )
        .eq("id", userId)
        .maybeSingle();

      if (userError) {
        setError(userError.message);
        setProfile(null);
        setMeasurements([]);
        return;
      }

      setProfile((userData as UserProfileRow | null) ?? null);

      const { data: measurementData, error: measurementError } = await supabase
        .from("measurements")
        .select(
          "id, measured_at, weight_kg, belly_cm, chest_cm, biceps_left_cm, biceps_right_cm, calves_left_cm, calves_right_cm, thighs_left_cm, thighs_right_cm, shoulders_cm, neck_cm, body_fat_percentage"
        )
        .eq("user_id", userId)
        .order("measured_at", { ascending: false })
        .limit(90);

      if (measurementError) {
        setError(measurementError.message);
        setMeasurements([]);
        return;
      }

      setMeasurements((measurementData as MeasurementRow[] | null) ?? []);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onLogMeasurements(values: MeasurementFormValues) {
    setError(null);
    setSaving(true);
    try {
      const measuredAt = new Date(values.measuredAt);
      if (Number.isNaN(measuredAt.getTime())) {
        setError("Invalid measurement date/time.");
        return;
      }

      const payload = {
        user_id: userId,
        measured_at: measuredAt.toISOString(),
        weight_kg: toNullablePositiveNumber(values.weightKg),
        belly_cm: toNullablePositiveNumber(values.bellyCm),
        chest_cm: toNullablePositiveNumber(values.chestCm),
        biceps_left_cm: toNullablePositiveNumber(values.bicepsLeftCm),
        biceps_right_cm: toNullablePositiveNumber(values.bicepsRightCm),
        calves_left_cm: toNullablePositiveNumber(values.calvesLeftCm),
        calves_right_cm: toNullablePositiveNumber(values.calvesRightCm),
        thighs_left_cm: toNullablePositiveNumber(values.thighsLeftCm),
        thighs_right_cm: toNullablePositiveNumber(values.thighsRightCm),
        shoulders_cm: toNullablePositiveNumber(values.shouldersCm),
        neck_cm: toNullablePositiveNumber(values.neckCm),
        body_fat_percentage: toNullableNonNegativeNumber(
          values.bodyFatPercentage
        ),
        input_method: "manual",
      };

      const { error: insertError } = await supabase
        .from("measurements")
        .insert(payload);
      if (insertError) {
        setError(insertError.message);
        return;
      }

      form.reset({ ...values, measuredAt: getDefaultMeasuredAtLocal() });
      await load();
    } finally {
      setSaving(false);
    }
  }

  const latest = measurements[0] ?? null;
  const previous = measurements[1] ?? null;

  const progressData = useMemo(() => {
    const now = Date.now();
    const cutoff =
      progressRangeDays === 0 ? null : now - progressRangeDays * 24 * 60 * 60 * 1000;

    const filtered = cutoff
      ? measurements.filter((m) => {
          const ts = new Date(m.measured_at).getTime();
          return Number.isFinite(ts) && ts >= cutoff;
        })
      : measurements;

    const sortedAscending = [...filtered].sort(
      (a, b) =>
        new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
    );

    return sortedAscending.map((m) => {
      const ts = new Date(m.measured_at).getTime();
      return {
        ts,
        weight: m.weight_kg ?? null,
        belly: m.belly_cm ?? null,
        bodyFat: m.body_fat_percentage ?? null,
      };
    });
  }, [measurements, progressRangeDays]);

  const progressMeta = useMemo(() => {
    if (progressMetric === "belly") {
      return {
        label: "Belly (cm)",
        unit: "cm",
        color: "#0ea5e9",
        dataKey: "belly" as const,
      };
    }
    if (progressMetric === "bodyFat") {
      return {
        label: "Body fat (%)",
        unit: "%",
        color: "#a855f7",
        dataKey: "bodyFat" as const,
      };
    }
    return {
      label: "Weight (kg)",
      unit: "kg",
      color: "#22c55e",
      dataKey: "weight" as const,
    };
  }, [progressMetric]);

  const hasProgressData = useMemo(() => {
    return progressData.some((p) => typeof p[progressMeta.dataKey] === "number");
  }, [progressData, progressMeta.dataKey]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Measurements, goals context, and quick updates.
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Info</CardTitle>
            <CardDescription>Your current profile snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {loading ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Loading…
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Name
                  </div>
                  <div className="mt-1 text-sm">
                    {profile?.name?.trim() ? profile.name : "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Email
                  </div>
                  <div className="mt-1 text-sm break-all">
                    {profile?.email?.trim() ? profile.email : "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Age
                  </div>
                  <div className="mt-1 text-sm">
                    {formatNumber(profile?.age ?? null)}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Gender
                  </div>
                  <div className="mt-1 text-sm">
                    {profile?.gender?.trim() ? profile.gender : "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Height
                  </div>
                  <div className="mt-1 text-sm">
                    {formatNumber(profile?.height_cm ?? null, "cm")}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Timezone
                  </div>
                  <div className="mt-1 text-sm">
                    {profile?.timezone?.trim() ? profile.timezone : "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 sm:col-span-2 dark:border-zinc-800 dark:bg-black">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Dietary restrictions
                  </div>
                  <div className="mt-1 text-sm">
                    {normalizeList(profile?.dietary_restrictions)}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 sm:col-span-2 dark:border-zinc-800 dark:bg-black">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Food dislikes
                  </div>
                  <div className="mt-1 text-sm">
                    {normalizeList(profile?.food_dislikes)}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 sm:col-span-2 dark:border-zinc-800 dark:bg-black">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Favorite cuisines
                  </div>
                  <div className="mt-1 text-sm">
                    {normalizeList(profile?.favorite_cuisines)}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 sm:col-span-2 dark:border-zinc-800 dark:bg-black">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Injuries / limitations
                  </div>
                  <div className="mt-1 text-sm">
                    {normalizeList(profile?.injuries)}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 sm:col-span-2 dark:border-zinc-800 dark:bg-black">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Medical conditions
                  </div>
                  <div className="mt-1 text-sm">
                    {normalizeList(profile?.medical_conditions)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={() => void load()}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Measurements</CardTitle>
            <CardDescription>Latest stats and quick logging.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Last logged
                </div>
                <div className="mt-1 text-sm">
                  {latest?.measured_at
                    ? new Date(latest.measured_at).toLocaleString()
                    : "—"}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Weight
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                  <div>{formatNumber(latest?.weight_kg ?? null, "kg")}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDelta(
                      latest?.weight_kg ?? null,
                      previous?.weight_kg ?? null,
                      "kg"
                    ) ?? "—"}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Belly
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                  <div>{formatNumber(latest?.belly_cm ?? null, "cm")}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDelta(
                      latest?.belly_cm ?? null,
                      previous?.belly_cm ?? null,
                      "cm"
                    ) ?? "—"}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Body fat
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                  <div>
                    {formatNumber(latest?.body_fat_percentage ?? null, "%")}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDelta(
                      latest?.body_fat_percentage ?? null,
                      previous?.body_fat_percentage ?? null,
                      "%"
                    ) ?? "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium">Progress</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {progressRangeDays === 0
                        ? "All time"
                        : `Last ${progressRangeDays} days`}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={progressMetric === "weight" ? "secondary" : "outline"}
                      onClick={() => setProgressMetric("weight")}
                    >
                      Weight
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={progressMetric === "belly" ? "secondary" : "outline"}
                      onClick={() => setProgressMetric("belly")}
                    >
                      Belly
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={progressMetric === "bodyFat" ? "secondary" : "outline"}
                      onClick={() => setProgressMetric("bodyFat")}
                    >
                      Body fat
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={progressRangeDays === 30 ? "secondary" : "outline"}
                    onClick={() => setProgressRangeDays(30)}
                  >
                    30d
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={progressRangeDays === 90 ? "secondary" : "outline"}
                    onClick={() => setProgressRangeDays(90)}
                  >
                    90d
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={progressRangeDays === 365 ? "secondary" : "outline"}
                    onClick={() => setProgressRangeDays(365)}
                  >
                    1y
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={progressRangeDays === 0 ? "secondary" : "outline"}
                    onClick={() => setProgressRangeDays(0)}
                  >
                    All
                  </Button>
                </div>

                <div className="h-56 w-full sm:h-64">
                  {progressData.length < 2 || !hasProgressData ? (
                    <div className="flex h-full items-center justify-center text-sm text-zinc-600 dark:text-zinc-400">
                      Log at least two measurements to see a trend.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="ts"
                          type="number"
                          domain={["dataMin", "dataMax"]}
                          tickFormatter={(v) => formatAxisDate(Number(v))}
                          minTickGap={24}
                        />
                        <YAxis
                          tickFormatter={(v) =>
                            typeof v === "number"
                              ? `${Math.round(v * 10) / 10}${progressMeta.unit}`
                              : String(v)
                          }
                        />
                        <Tooltip
                          labelFormatter={(label) =>
                            formatTooltipDate(Number(label))
                          }
                          formatter={(value) => {
                            if (typeof value !== "number" || !Number.isFinite(value)) {
                              return ["—", progressMeta.label];
                            }
                            const rounded = Math.round(value * 10) / 10;
                            return [`${rounded}${progressMeta.unit}`, progressMeta.label];
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey={progressMeta.dataKey}
                          stroke={progressMeta.color}
                          strokeWidth={2}
                          dot={false}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <form
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onLogMeasurements)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="measuredAt">Measurement time</Label>
                  <Input
                    id="measuredAt"
                    type="datetime-local"
                    {...form.register("measuredAt")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="weightKg">Weight (kg)</Label>
                  <Input
                    id="weightKg"
                    inputMode="decimal"
                    {...form.register("weightKg")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bellyCm">Belly (cm)</Label>
                  <Input
                    id="bellyCm"
                    inputMode="decimal"
                    {...form.register("bellyCm")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="chestCm">Chest (cm)</Label>
                  <Input
                    id="chestCm"
                    inputMode="decimal"
                    {...form.register("chestCm")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="shouldersCm">Shoulders (cm)</Label>
                  <Input
                    id="shouldersCm"
                    inputMode="decimal"
                    {...form.register("shouldersCm")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bicepsLeftCm">Biceps left (cm)</Label>
                  <Input
                    id="bicepsLeftCm"
                    inputMode="decimal"
                    {...form.register("bicepsLeftCm")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bicepsRightCm">Biceps right (cm)</Label>
                  <Input
                    id="bicepsRightCm"
                    inputMode="decimal"
                    {...form.register("bicepsRightCm")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="thighsLeftCm">Thigh left (cm)</Label>
                  <Input
                    id="thighsLeftCm"
                    inputMode="decimal"
                    {...form.register("thighsLeftCm")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="thighsRightCm">Thigh right (cm)</Label>
                  <Input
                    id="thighsRightCm"
                    inputMode="decimal"
                    {...form.register("thighsRightCm")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="calvesLeftCm">Calf left (cm)</Label>
                  <Input
                    id="calvesLeftCm"
                    inputMode="decimal"
                    {...form.register("calvesLeftCm")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="calvesRightCm">Calf right (cm)</Label>
                  <Input
                    id="calvesRightCm"
                    inputMode="decimal"
                    {...form.register("calvesRightCm")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="neckCm">Neck (cm)</Label>
                  <Input
                    id="neckCm"
                    inputMode="decimal"
                    {...form.register("neckCm")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bodyFatPercentage">Body fat (%)</Label>
                  <Input
                    id="bodyFatPercentage"
                    inputMode="decimal"
                    {...form.register("bodyFatPercentage")}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save measurements"}
                </Button>
              </div>
            </form>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">Recent entries</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {loading
                    ? "Loading…"
                    : `Showing ${Math.min(5, measurements.length)} of ${measurements.length}`}
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {measurements.length === 0 && !loading ? (
                  <div className="text-zinc-600 dark:text-zinc-400">
                    No measurements yet.
                  </div>
                ) : (
                  measurements.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="font-medium">
                          {new Date(m.measured_at).toLocaleString()}
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-400">
                          W: {formatNumber(m.weight_kg, "kg")} • Belly:{" "}
                          {formatNumber(m.belly_cm, "cm")} • BF:{" "}
                          {formatNumber(m.body_fat_percentage, "%")}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
