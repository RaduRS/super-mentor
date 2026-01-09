"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  addDays,
  endOfDay,
  format,
  getDay,
  parse,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import type { SlotInfo } from "react-big-calendar";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
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
import { NutritionTrendChart } from "@/components/dashboard/NutritionTrendChart";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import {
  computeFreeTimeWindows,
  dayOfWeekFromDateOnly,
  parseTimeToMinutes,
} from "@/lib/utils";

const rbcLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { "en-US": enUS },
});

type DailyPlanRow = {
  id: string;
  created_at: string;
  plan_date: string;
  atlas_morning_message: string | null;
  plan_status: string | null;
  coordination_log: unknown;
  workout_plan_id?: string | null;
  meal_plan_id?: string | null;
  reading_goal_id?: string | null;
};

type WorkoutPlanRow = {
  id: string;
  scheduled_time: string;
  workout_type: string;
  focus_areas: string[] | null;
  exercises: unknown;
  total_duration_minutes: number | null;
  intensity: string | null;
  completed: boolean | null;
  completed_at: string | null;
};

type MealPlanRow = {
  id: string;
  status: string | null;
  start_date: string;
  end_date: string;
};

type MealRow = {
  id: string;
  meal_type: string;
  scheduled_time: string;
  name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  fiber_g: number | null;
  vitamin_a_mcg: number | null;
  vitamin_b12_mcg: number | null;
  vitamin_c_mg: number | null;
  vitamin_d_mcg: number | null;
  vitamin_e_mg: number | null;
  vitamin_k_mcg: number | null;
  iron_mg: number | null;
  calcium_mg: number | null;
  magnesium_mg: number | null;
  omega3_g: number | null;
  status: string | null;
  actually_eaten: boolean | null;
  logged_at: string | null;
};

type NutritionTrackingRow = {
  date: string;
  total_vitamin_d_mcg: number | null;
  total_vitamin_b12_mcg: number | null;
  total_iron_mg: number | null;
  total_calcium_mg: number | null;
  total_magnesium_mg: number | null;
  total_omega3_g: number | null;
  nutrition_score: number | null;
  deficiencies: string[] | null;
};

type ReadingSessionRow = {
  id: string;
  book_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  pages_read: number | null;
  user_notes: string | null;
  book: { title: string | null; author: string | null } | null;
};

type BookRow = {
  id: string;
  title: string | null;
  author: string | null;
  status: string | null;
  priority: number | null;
};

type BookSearchResult = {
  source: "openlibrary";
  key: string | null;
  title: string | null;
  author: string | null;
  firstPublishYear: number | null;
  coverUrl: string | null;
};

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

function formatTime(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) return trimmed;
  return `${match[1]}:${match[2]}`;
}

function getCoordinationSuggestion(
  log: unknown,
  manager: "forge" | "olive" | "lexicon"
) {
  if (!log || typeof log !== "object" || Array.isArray(log)) return null;
  const entry = (log as Record<string, unknown>)[manager];
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  const suggestion = (entry as Record<string, unknown>).suggestion;
  if (typeof suggestion !== "string") return null;
  return suggestion.trim() ? suggestion : null;
}

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

function toHHMMSS(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hh = Math.min(23, Math.max(0, Number(match[1])));
  const mm = Math.min(59, Math.max(0, Number(match[2])));
  const ssRaw = match[3] ?? "00";
  const ss = Math.min(59, Math.max(0, Number(ssRaw)));
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || !Number.isFinite(ss))
    return null;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(
    2,
    "0"
  )}:${String(ss).padStart(2, "0")}`;
}

function formatDateOnlyInTimeZone(date: Date, timeZone: string | null) {
  const tz = timeZone?.trim() ? timeZone.trim() : "UTC";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatTimeHHMMInTimeZone(date: Date, timeZone: string | null) {
  const tz = timeZone?.trim() ? timeZone.trim() : "UTC";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function colorForEventType(eventType: string | null) {
  switch (eventType) {
    case "work":
      return "#2563eb";
    case "meeting":
      return "#7c3aed";
    case "workout":
      return "#dc2626";
    case "meal":
      return "#ea580c";
    case "reading":
      return "#16a34a";
    case "sleep":
      return "#0f172a";
    case "free_time":
      return "#6b7280";
    default:
      return "#334155";
  }
}

export function DailyDashboard(props: { userId: string }) {
  const { userId } = props;
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DailyPlanRow | null>(null);
  const [timeZone, setTimeZone] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlanRow | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlanRow | null>(null);
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [weekNutrition, setWeekNutrition] = useState<NutritionTrackingRow[]>(
    []
  );
  const [readingSession, setReadingSession] =
    useState<ReadingSessionRow | null>(null);
  const [suggestedBook, setSuggestedBook] = useState<BookRow | null>(null);
  const [readingPagesRead, setReadingPagesRead] = useState("");
  const [readingNotes, setReadingNotes] = useState("");
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleRow[]>([]);
  const [scheduleFreeWindows, setScheduleFreeWindows] = useState<
    Array<{ startTime: string; endTime: string }>
  >([]);
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [bookSearchResults, setBookSearchResults] = useState<
    BookSearchResult[]
  >([]);
  const [bookSearchLoading, setBookSearchLoading] = useState(false);
  const [bookAddLoadingKey, setBookAddLoadingKey] = useState<string | null>(
    null
  );
  const [bookAddFormat, setBookAddFormat] = useState<
    "physical" | "ebook" | "audiobook"
  >("physical");
  const [scheduleRange, setScheduleRange] = useState<{
    startTime: string;
    endTime: string;
  }>({ startTime: "06:30", endTime: "23:00" });
  const [scheduleForm, setScheduleForm] = useState<{
    date: string;
    title: string;
    scheduleType: "personal" | "work";
    eventType:
      | "meeting"
      | "appointment"
      | "work"
      | "workout"
      | "meal"
      | "reading"
      | "sleep"
      | "free_time";
    startTime: string;
    endTime: string;
    isFlexible: boolean;
    priority: number;
  }>({
    date: "",
    title: "",
    scheduleType: "personal",
    eventType: "meeting",
    startTime: "",
    endTime: "",
    isFlexible: false,
    priority: 7,
  });

  const planDate = formatPlanDateInTimeZone(timeZone);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("timezone, sleep_schedule")
        .eq("id", userId)
        .maybeSingle();

      if (userError) {
        setError(userError.message);
        setPlan(null);
        setWorkoutPlan(null);
        setMealPlan(null);
        setMeals([]);
        setReadingSession(null);
        setSuggestedBook(null);
        return;
      }

      const tz =
        typeof (userData as { timezone?: unknown } | null)?.timezone ===
        "string"
          ? String((userData as { timezone?: unknown }).timezone)
          : null;
      setTimeZone(tz);

      const effectivePlanDate = formatPlanDateInTimeZone(tz);
      setScheduleForm((prev) => ({
        ...prev,
        date: prev.date.trim() ? prev.date : effectivePlanDate,
      }));

      const sleepSchedule = (userData as { sleep_schedule?: unknown } | null)
        ?.sleep_schedule;
      const sleepObj =
        sleepSchedule && typeof sleepSchedule === "object"
          ? (sleepSchedule as Record<string, unknown>)
          : null;
      const rangeStart = normalizeHHMM(sleepObj?.typicalWakeTime) ?? "06:30";
      const rangeEnd = normalizeHHMM(sleepObj?.typicalBedtime) ?? "23:00";
      setScheduleRange({ startTime: rangeStart, endTime: rangeEnd });

      const planDay = dayOfWeekFromDateOnly(effectivePlanDate);
      const { data: scheduleRows } = await supabase
        .from("user_schedules")
        .select(
          "id, start_date, end_date, schedule_type, days_of_week, event_type, start_time, end_time, specific_date, title, is_flexible, priority"
        )
        .eq("user_id", userId)
        .limit(500);

      const allRows = ((scheduleRows as ScheduleRow[] | null) ?? []).filter(
        (row) => !!row.id
      );
      setScheduleRows(allRows);

      const todaysEvents = allRows
        .filter((row) => {
          if (row.start_date && row.start_date > effectivePlanDate)
            return false;
          if (row.end_date && row.end_date < effectivePlanDate) return false;
          return true;
        })
        .filter((row) => {
          if (row.specific_date) return row.specific_date === effectivePlanDate;
          if (planDay === null) return false;
          return (row.days_of_week ?? []).includes(planDay);
        })
        .filter((row) => !!row.start_time && !!row.end_time)
        .sort((a, b) => {
          const aMin = parseTimeToMinutes(a.start_time) ?? 0;
          const bMin = parseTimeToMinutes(b.start_time) ?? 0;
          return aMin - bMin;
        });

      setScheduleEvents(todaysEvents);
      setScheduleFreeWindows(
        computeFreeTimeWindows({
          busy: todaysEvents.map((e) => ({
            startTime: e.start_time,
            endTime: e.end_time,
          })),
          rangeStartTime: rangeStart,
          rangeEndTime: rangeEnd,
        })
      );

      const { data: planData, error: planError } = await supabase
        .from("daily_plans")
        .select(
          "id, created_at, plan_date, atlas_morning_message, plan_status, coordination_log, workout_plan_id, meal_plan_id, reading_goal_id"
        )
        .eq("user_id", userId)
        .eq("plan_date", effectivePlanDate)
        .maybeSingle();

      if (planError) {
        setError(planError.message);
        setPlan(null);
        setWorkoutPlan(null);
        setMealPlan(null);
        setMeals([]);
        setReadingSession(null);
        setSuggestedBook(null);
        return;
      }

      const nextPlan = (planData as DailyPlanRow | null) ?? null;
      setPlan(nextPlan);

      if (!nextPlan) {
        setWorkoutPlan(null);
        setMealPlan(null);
        setMeals([]);
        setReadingSession(null);
        setSuggestedBook(null);
        return;
      }

      if (nextPlan.workout_plan_id) {
        const { data: workoutData } = await supabase
          .from("workout_plans")
          .select(
            "id, scheduled_time, workout_type, focus_areas, exercises, total_duration_minutes, intensity, completed, completed_at"
          )
          .eq("id", nextPlan.workout_plan_id)
          .eq("user_id", userId)
          .maybeSingle();
        setWorkoutPlan((workoutData as WorkoutPlanRow | null) ?? null);
      } else {
        setWorkoutPlan(null);
      }

      if (nextPlan.meal_plan_id) {
        const { data: mealPlanData } = await supabase
          .from("meal_plans")
          .select("id, status, start_date, end_date")
          .eq("id", nextPlan.meal_plan_id)
          .eq("user_id", userId)
          .maybeSingle();
        setMealPlan((mealPlanData as MealPlanRow | null) ?? null);

        const { data: mealsData } = await supabase
          .from("meals")
          .select(
            "id, meal_type, scheduled_time, name, calories, protein_g, carbs_g, fats_g, fiber_g, vitamin_a_mcg, vitamin_b12_mcg, vitamin_c_mg, vitamin_d_mcg, vitamin_e_mg, vitamin_k_mcg, iron_mg, calcium_mg, magnesium_mg, omega3_g, status, actually_eaten, logged_at"
          )
          .eq("meal_plan_id", nextPlan.meal_plan_id)
          .eq("user_id", userId)
          .eq("status", "active")
          .order("scheduled_time", { ascending: true });
        setMeals((mealsData as MealRow[] | null) ?? []);
      } else {
        setMealPlan(null);
        setMeals([]);
      }

      const weekStart = format(
        addDays(parse(effectivePlanDate, "yyyy-MM-dd", new Date()), -6),
        "yyyy-MM-dd"
      );
      const { data: weekNutritionData } = await supabase
        .from("nutrition_tracking")
        .select(
          "date, total_vitamin_d_mcg, total_vitamin_b12_mcg, total_iron_mg, total_calcium_mg, total_magnesium_mg, total_omega3_g, nutrition_score, deficiencies"
        )
        .eq("user_id", userId)
        .gte("date", weekStart)
        .lte("date", effectivePlanDate)
        .order("date", { ascending: true });
      setWeekNutrition(
        (weekNutritionData as NutritionTrackingRow[] | null) ?? []
      );

      if (nextPlan.reading_goal_id) {
        const { data: sessionData } = await supabase
          .from("reading_sessions")
          .select(
            "id, book_id, started_at, ended_at, scheduled_time, duration_minutes, pages_read, user_notes, book:books(title, author)"
          )
          .eq("id", nextPlan.reading_goal_id)
          .eq("user_id", userId)
          .maybeSingle();
        setReadingSession((sessionData as ReadingSessionRow | null) ?? null);
      } else {
        setReadingSession(null);
      }

      const { data: readingBook } = await supabase
        .from("books")
        .select("id, title, author, status, priority")
        .eq("user_id", userId)
        .eq("status", "reading")
        .order("priority", { ascending: true, nullsFirst: false })
        .order("added_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: backlogBook } = !readingBook
        ? await supabase
            .from("books")
            .select("id, title, author, status, priority")
            .eq("user_id", userId)
            .eq("status", "backlog")
            .order("priority", { ascending: true, nullsFirst: false })
            .order("added_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : { data: null };

      setSuggestedBook(
        (readingBook as BookRow | null) ??
          (backlogBook as BookRow | null) ??
          null
      );
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  const [calendarRange, setCalendarRange] = useState<{
    start: Date;
    end: Date;
  }>(() => {
    const start = startOfDay(addDays(new Date(), -21));
    const end = endOfDay(addDays(new Date(), 21));
    return { start, end };
  });

  const calendarEvents = useMemo(() => {
    if (!scheduleRows.length) return [];
    const tz = timeZone?.trim() ? timeZone.trim() : null;
    const events: Array<{
      title: string;
      start: Date;
      end: Date;
      resource: { scheduleId: string; eventType: string | null };
    }> = [];

    const pushEvent = (row: ScheduleRow, dateOnly: string) => {
      const startTime = toHHMMSS(row.start_time);
      const endTime = toHHMMSS(row.end_time);
      if (!startTime || !endTime) return;
      const title = row.title?.trim()
        ? row.title.trim()
        : row.event_type?.trim()
          ? row.event_type.trim()
          : "Event";
      const eventType = row.event_type ?? null;
      events.push({
        title,
        start: new Date(`${dateOnly}T${startTime}`),
        end: new Date(`${dateOnly}T${endTime}`),
        resource: { scheduleId: row.id, eventType },
      });
    };

    const iter = startOfDay(calendarRange.start);
    const endIter = endOfDay(calendarRange.end);
    while (iter <= endIter) {
      const dateOnly = formatDateOnlyInTimeZone(iter, tz);
      const dow = dayOfWeekFromDateOnly(dateOnly);

      for (const row of scheduleRows) {
        if (row.start_date && row.start_date > dateOnly) continue;
        if (row.end_date && row.end_date < dateOnly) continue;

        if (row.specific_date) {
          if (row.specific_date === dateOnly) pushEvent(row, dateOnly);
          continue;
        }

        if (dow === null) continue;
        const dows = row.days_of_week ?? [];
        if (!dows.includes(dow)) continue;
        pushEvent(row, dateOnly);
      }

      iter.setDate(iter.getDate() + 1);
    }

    return events;
  }, [calendarRange.end, calendarRange.start, scheduleRows, timeZone]);

  function onCalendarSelect(slot: SlotInfo) {
    const tz = timeZone?.trim() ? timeZone.trim() : null;
    const dateOnly = formatDateOnlyInTimeZone(slot.start as Date, tz);
    const startTime = formatTimeHHMMInTimeZone(slot.start as Date, tz);
    const endTime = formatTimeHHMMInTimeZone(slot.end as Date, tz);
    setScheduleForm((prev) => ({
      ...prev,
      date: dateOnly,
      startTime,
      endTime,
      title: prev.title.trim() ? prev.title : "Busy",
    }));
    toast.message("Selected time added to the event form.");
  }

  function onCalendarEventClick(event: {
    resource?: { scheduleId?: unknown };
  }) {
    const scheduleId = event.resource?.scheduleId;
    if (typeof scheduleId !== "string" || !scheduleId.trim()) return;
    if (!window.confirm("Delete this schedule event?")) return;
    void onDeleteScheduleEvent(scheduleId);
  }

  async function onAddScheduleEvent() {
    if (working) return;
    setWorking(true);
    setError(null);
    try {
      const dateOnly = scheduleForm.date.trim();
      if (!dateOnly) {
        setError("Pick a date for the event.");
        return;
      }
      if (!scheduleForm.title.trim()) {
        setError("Add a title for the event.");
        return;
      }
      if (!scheduleForm.startTime.trim() || !scheduleForm.endTime.trim()) {
        setError("Set a start and end time.");
        return;
      }
      const startMin = parseTimeToMinutes(scheduleForm.startTime);
      const endMin = parseTimeToMinutes(scheduleForm.endTime);
      if (startMin === null || endMin === null) {
        setError("Invalid time format.");
        return;
      }
      if (endMin <= startMin) {
        setError("End time must be after start time.");
        return;
      }

      const planDay = dayOfWeekFromDateOnly(dateOnly);
      const hasOverlap = scheduleRows
        .filter((row) => {
          if (row.start_date && row.start_date > dateOnly) return false;
          if (row.end_date && row.end_date < dateOnly) return false;
          if (row.specific_date) return row.specific_date === dateOnly;
          if (planDay === null) return false;
          return (row.days_of_week ?? []).includes(planDay);
        })
        .some((row) => {
          const busyStart = parseTimeToMinutes(row.start_time);
          const busyEnd = parseTimeToMinutes(row.end_time);
          if (busyStart === null || busyEnd === null) return false;
          return startMin < busyEnd && endMin > busyStart;
        });

      if (hasOverlap) {
        setError("That time overlaps an existing block.");
        return;
      }
      const priority = Math.max(
        1,
        Math.min(10, Math.round(scheduleForm.priority))
      );

      const { error: insertError } = await supabase
        .from("user_schedules")
        .insert({
          user_id: userId,
          schedule_type: scheduleForm.scheduleType,
          event_type: scheduleForm.eventType,
          title: scheduleForm.title.trim(),
          start_date: dateOnly,
          end_date: dateOnly,
          specific_date: dateOnly,
          start_time: scheduleForm.startTime,
          end_time: scheduleForm.endTime,
          is_flexible: scheduleForm.isFlexible,
          priority,
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      toast.success("Event added");
      setScheduleForm((prev) => ({
        ...prev,
        title: "",
        startTime: "",
        endTime: "",
      }));
      await load();
    } finally {
      setWorking(false);
    }
  }

  async function onDeleteScheduleEvent(id: string) {
    if (working) return;
    setWorking(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from("user_schedules")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (deleteError) {
        setError(deleteError.message);
        return;
      }
      toast.success("Event deleted");
      await load();
    } finally {
      setWorking(false);
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  function sumOrNull(values: Array<number | null | undefined>) {
    let sum = 0;
    let any = false;
    for (const v of values) {
      if (typeof v === "number" && Number.isFinite(v)) {
        sum += v;
        any = true;
      }
    }
    return any ? sum : null;
  }

  const nutritionTotals = useMemo(() => {
    const planned = {
      calories: sumOrNull(meals.map((m) => m.calories)),
      protein_g: sumOrNull(meals.map((m) => m.protein_g)),
      carbs_g: sumOrNull(meals.map((m) => m.carbs_g)),
      fats_g: sumOrNull(meals.map((m) => m.fats_g)),
      fiber_g: sumOrNull(meals.map((m) => m.fiber_g)),
      vitamin_d_mcg: sumOrNull(meals.map((m) => m.vitamin_d_mcg)),
      vitamin_b12_mcg: sumOrNull(meals.map((m) => m.vitamin_b12_mcg)),
      iron_mg: sumOrNull(meals.map((m) => m.iron_mg)),
      calcium_mg: sumOrNull(meals.map((m) => m.calcium_mg)),
      magnesium_mg: sumOrNull(meals.map((m) => m.magnesium_mg)),
      omega3_g: sumOrNull(meals.map((m) => m.omega3_g)),
    };

    const eaten = meals.filter((m) => !!m.actually_eaten);
    const consumed = {
      calories: sumOrNull(eaten.map((m) => m.calories)),
      protein_g: sumOrNull(eaten.map((m) => m.protein_g)),
      carbs_g: sumOrNull(eaten.map((m) => m.carbs_g)),
      fats_g: sumOrNull(eaten.map((m) => m.fats_g)),
      fiber_g: sumOrNull(eaten.map((m) => m.fiber_g)),
      vitamin_d_mcg: sumOrNull(eaten.map((m) => m.vitamin_d_mcg)),
      vitamin_b12_mcg: sumOrNull(eaten.map((m) => m.vitamin_b12_mcg)),
      iron_mg: sumOrNull(eaten.map((m) => m.iron_mg)),
      calcium_mg: sumOrNull(eaten.map((m) => m.calcium_mg)),
      magnesium_mg: sumOrNull(eaten.map((m) => m.magnesium_mg)),
      omega3_g: sumOrNull(eaten.map((m) => m.omega3_g)),
    };

    return { planned, consumed };
  }, [meals]);

  const weekDeficiencies = useMemo(() => {
    if (!weekNutrition.length) return [];

    const rda = {
      vitamin_d_mcg: 15,
      vitamin_b12_mcg: 2.4,
      iron_mg: 8,
      calcium_mg: 1000,
      magnesium_mg: 400,
      omega3_g: 1.6,
    };

    const byDate = new Map<string, NutritionTrackingRow>();
    for (const row of weekNutrition) {
      byDate.set(row.date, row);
    }

    const start = addDays(parse(planDate, "yyyy-MM-dd", new Date()), -6);
    const dates: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      dates.push(format(addDays(start, i), "yyyy-MM-dd"));
    }

    const totals = {
      vitamin_d_mcg: 0,
      vitamin_b12_mcg: 0,
      iron_mg: 0,
      calcium_mg: 0,
      magnesium_mg: 0,
      omega3_g: 0,
    };

    for (const date of dates) {
      const row = byDate.get(date);
      totals.vitamin_d_mcg += row?.total_vitamin_d_mcg ?? 0;
      totals.vitamin_b12_mcg += row?.total_vitamin_b12_mcg ?? 0;
      totals.iron_mg += row?.total_iron_mg ?? 0;
      totals.calcium_mg += row?.total_calcium_mg ?? 0;
      totals.magnesium_mg += row?.total_magnesium_mg ?? 0;
      totals.omega3_g += row?.total_omega3_g ?? 0;
    }

    const averages = {
      vitamin_d_mcg: totals.vitamin_d_mcg / 7,
      vitamin_b12_mcg: totals.vitamin_b12_mcg / 7,
      iron_mg: totals.iron_mg / 7,
      calcium_mg: totals.calcium_mg / 7,
      magnesium_mg: totals.magnesium_mg / 7,
      omega3_g: totals.omega3_g / 7,
    };

    const labels: Record<keyof typeof rda, string> = {
      vitamin_d_mcg: "Vitamin D",
      vitamin_b12_mcg: "Vitamin B12",
      iron_mg: "Iron",
      calcium_mg: "Calcium",
      magnesium_mg: "Magnesium",
      omega3_g: "Omega-3",
    };

    const deficits: string[] = [];
    (Object.keys(rda) as Array<keyof typeof rda>).forEach((key) => {
      if (averages[key] < rda[key] * 0.8) deficits.push(labels[key]);
    });

    return deficits;
  }, [planDate, weekNutrition]);

  const todayNutritionScore = useMemo(() => {
    const row = weekNutrition.find((r) => r.date === planDate);
    return typeof row?.nutrition_score === "number"
      ? row.nutrition_score
      : null;
  }, [planDate, weekNutrition]);

  async function syncNutritionTracking(dateOnly: string) {
    const { data: eatenMeals, error: mealsError } = await supabase
      .from("meals")
      .select(
        "calories, protein_g, carbs_g, fats_g, fiber_g, vitamin_a_mcg, vitamin_b12_mcg, vitamin_c_mg, vitamin_d_mcg, vitamin_e_mg, vitamin_k_mcg, iron_mg, calcium_mg, magnesium_mg, omega3_g"
      )
      .eq("user_id", userId)
      .eq("scheduled_date", dateOnly)
      .eq("actually_eaten", true);

    if (mealsError) throw mealsError;

    const rows = (eatenMeals as Array<Record<string, unknown>> | null) ?? [];
    const total = (key: string) =>
      rows.reduce((acc, r) => {
        const v = r[key];
        return typeof v === "number" ? acc + v : acc;
      }, 0);

    const payload = {
      user_id: userId,
      date: dateOnly,
      total_calories: total("calories"),
      total_protein_g: total("protein_g"),
      total_carbs_g: total("carbs_g"),
      total_fats_g: total("fats_g"),
      total_fiber_g: total("fiber_g"),
      total_vitamin_a_mcg: total("vitamin_a_mcg"),
      total_vitamin_b12_mcg: total("vitamin_b12_mcg"),
      total_vitamin_c_mg: total("vitamin_c_mg"),
      total_vitamin_d_mcg: total("vitamin_d_mcg"),
      total_vitamin_e_mg: total("vitamin_e_mg"),
      total_vitamin_k_mcg: total("vitamin_k_mcg"),
      total_iron_mg: total("iron_mg"),
      total_calcium_mg: total("calcium_mg"),
      total_magnesium_mg: total("magnesium_mg"),
      total_omega3_g: total("omega3_g"),
      deficiencies: [] as string[],
      nutrition_score: 0 as number,
    };

    const rda = {
      vitamin_d_mcg: 15,
      vitamin_b12_mcg: 2.4,
      iron_mg: 8,
      calcium_mg: 1000,
      magnesium_mg: 400,
      omega3_g: 1.6,
      fiber_g: 30,
    };

    const nutrients = [
      {
        label: "Vitamin D",
        value: payload.total_vitamin_d_mcg,
        rda: rda.vitamin_d_mcg,
      },
      {
        label: "Vitamin B12",
        value: payload.total_vitamin_b12_mcg,
        rda: rda.vitamin_b12_mcg,
      },
      { label: "Iron", value: payload.total_iron_mg, rda: rda.iron_mg },
      {
        label: "Calcium",
        value: payload.total_calcium_mg,
        rda: rda.calcium_mg,
      },
      {
        label: "Magnesium",
        value: payload.total_magnesium_mg,
        rda: rda.magnesium_mg,
      },
      { label: "Omega-3", value: payload.total_omega3_g, rda: rda.omega3_g },
      { label: "Fiber", value: payload.total_fiber_g, rda: rda.fiber_g },
    ];

    const deficits: string[] = [];
    let scoreSum = 0;
    for (const n of nutrients) {
      const value =
        typeof n.value === "number" && Number.isFinite(n.value) ? n.value : 0;
      if (value < n.rda * 0.8) deficits.push(n.label);
      const ratio = n.rda > 0 ? value / n.rda : 0;
      scoreSum += Math.min(1, Math.max(0, ratio));
    }
    payload.deficiencies = deficits;
    payload.nutrition_score = Math.round((scoreSum / nutrients.length) * 100);

    const { error: upsertError } = await supabase
      .from("nutrition_tracking")
      .upsert(payload, { onConflict: "user_id,date" });

    if (upsertError) throw upsertError;
  }

  async function onGenerate() {
    if (generating) return;
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/cron/daily-planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planDate }),
      });

      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof payload === "object" && payload !== null && "error" in payload
            ? String(
                (payload as { error?: unknown }).error ??
                  "Failed to generate plan"
              )
            : "Failed to generate plan";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success("Daily plan generated");
      await load();
    } finally {
      setGenerating(false);
    }
  }

  async function onMarkWorkoutComplete() {
    if (!workoutPlan || workoutPlan.completed || working) return;
    setWorking(true);
    setError(null);
    try {
      const completedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("workout_plans")
        .update({ completed: true, completed_at: completedAt })
        .eq("id", workoutPlan.id)
        .eq("user_id", userId);

      if (updateError) {
        setError(updateError.message);
        toast.error(updateError.message);
        return;
      }

      if (plan?.id) {
        await supabase
          .from("daily_plans")
          .update({ plan_status: "in_progress" })
          .eq("id", plan.id)
          .eq("user_id", userId)
          .eq("plan_status", "generated");
      }

      toast.success("Workout marked complete");
      await load();
    } finally {
      setWorking(false);
    }
  }

  async function onLogMeal(mealId: string) {
    if (working) return;
    setWorking(true);
    setError(null);
    try {
      const loggedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("meals")
        .update({ actually_eaten: true, logged_at: loggedAt })
        .eq("id", mealId)
        .eq("user_id", userId);

      if (updateError) {
        setError(updateError.message);
        toast.error(updateError.message);
        return;
      }

      if (plan?.id) {
        await supabase
          .from("daily_plans")
          .update({ plan_status: "in_progress" })
          .eq("id", plan.id)
          .eq("user_id", userId)
          .eq("plan_status", "generated");
      }

      const dateOnly = plan?.plan_date?.trim()
        ? plan.plan_date.trim()
        : planDate;
      try {
        await syncNutritionTracking(dateOnly);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to sync nutrition";
        toast.error(message);
      }
      toast.success("Meal logged");
      await load();
    } finally {
      setWorking(false);
    }
  }

  function onSwapMeal(meal: MealRow) {
    const when = formatTime(meal.scheduled_time) ?? "today";
    const dateLabel = plan?.plan_date?.trim() ? plan.plan_date.trim() : "today";
    const cals =
      typeof meal.calories === "number" ? `${meal.calories} kcal` : "— kcal";
    const p = typeof meal.protein_g === "number" ? `${meal.protein_g}g` : "—g";
    const c = typeof meal.carbs_g === "number" ? `${meal.carbs_g}g` : "—g";
    const f = typeof meal.fats_g === "number" ? `${meal.fats_g}g` : "—g";

    const lines = [
      `I want to swap my ${meal.meal_type} on ${dateLabel} at ${when}.`,
      `MEAL_ID=${meal.id}`,
    ];
    if (plan?.meal_plan_id) lines.push(`MEAL_PLAN_ID=${plan.meal_plan_id}`);
    lines.push(
      `Current meal: "${meal.name}".`,
      `Macros: ${cals}, ${p} protein, ${c} carbs, ${f} fat.`,
      "Please suggest 3 alternatives with similar macros, respecting my dietary preferences and food dislikes.",
      "Label them Option 1/2/3 and include: name, quick ingredients, and estimated macros."
    );
    const message = lines.join("\n");

    router.push(
      `/chat?manager=olive&autosend=1&draft=${encodeURIComponent(message)}`
    );
  }

  async function onStartReadingSession() {
    if (working || !plan?.id) return;
    if (readingSession?.started_at) return;
    if (!suggestedBook?.id && !readingSession?.id) {
      toast.error("Add a book first to start a session");
      return;
    }

    setWorking(true);
    setError(null);
    try {
      const startedAt = new Date().toISOString();
      if (readingSession?.id) {
        const { error: updateError } = await supabase
          .from("reading_sessions")
          .update({ started_at: startedAt })
          .eq("id", readingSession.id)
          .eq("user_id", userId);

        if (updateError) {
          setError(updateError.message);
          toast.error(updateError.message);
          return;
        }
      } else if (suggestedBook?.id) {
        const { data: inserted, error: insertError } = await supabase
          .from("reading_sessions")
          .insert({
            user_id: userId,
            book_id: suggestedBook.id,
            started_at: startedAt,
            was_scheduled: false,
          })
          .select("id")
          .single();

        if (insertError || !inserted?.id) {
          const message = insertError?.message ?? "Failed to start session";
          setError(message);
          toast.error(message);
          return;
        }

        await supabase
          .from("daily_plans")
          .update({ reading_goal_id: inserted.id })
          .eq("id", plan.id)
          .eq("user_id", userId);
      }

      await supabase
        .from("daily_plans")
        .update({ plan_status: "in_progress" })
        .eq("id", plan.id)
        .eq("user_id", userId)
        .eq("plan_status", "generated");

      toast.success("Reading session started");
      await load();
    } finally {
      setWorking(false);
    }
  }

  async function onEndReadingSession() {
    if (working || !plan?.id || !readingSession?.id) return;
    if (!readingSession.started_at || readingSession.ended_at) return;

    const endedAt = new Date();
    const startedAt = new Date(readingSession.started_at);
    const durationMinutes = Number.isFinite(startedAt.getTime())
      ? Math.max(
          0,
          Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)
        )
      : null;

    const pagesRaw = readingPagesRead.trim();
    const pagesParsed = pagesRaw ? Number(pagesRaw) : null;
    const pagesRead =
      pagesParsed === null
        ? null
        : Number.isFinite(pagesParsed) && pagesParsed >= 0
          ? Math.floor(pagesParsed)
          : null;

    if (pagesRaw && pagesRead === null) {
      toast.error("Pages read must be a number (0+).");
      return;
    }

    setWorking(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("reading_sessions")
        .update({
          ended_at: endedAt.toISOString(),
          duration_minutes: durationMinutes,
          pages_read: pagesRead,
          user_notes: readingNotes.trim() ? readingNotes.trim() : null,
        })
        .eq("id", readingSession.id)
        .eq("user_id", userId);

      if (updateError) {
        setError(updateError.message);
        toast.error(updateError.message);
        return;
      }

      if (pagesRead !== null && pagesRead > 0 && readingSession.book_id) {
        const { data: bookRow } = await supabase
          .from("books")
          .select("id, current_page")
          .eq("id", readingSession.book_id)
          .eq("user_id", userId)
          .maybeSingle();

        const currentPage =
          typeof (bookRow as { current_page?: unknown } | null)
            ?.current_page === "number"
            ? Number((bookRow as { current_page?: unknown }).current_page)
            : 0;

        await supabase
          .from("books")
          .update({ current_page: Math.max(0, currentPage + pagesRead) })
          .eq("id", readingSession.book_id)
          .eq("user_id", userId);
      }

      toast.success("Reading session completed");
      setReadingPagesRead("");
      setReadingNotes("");
      await load();
    } finally {
      setWorking(false);
    }
  }

  async function onSearchBooks() {
    const query = bookSearchQuery.trim();
    if (!query) {
      setBookSearchResults([]);
      return;
    }

    setBookSearchLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/books/search?query=${encodeURIComponent(query)}&limit=10`
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof payload === "object" && payload !== null && "error" in payload
            ? String(
                (payload as { error?: unknown }).error ?? "Book search failed"
              )
            : "Book search failed";
        toast.error(message);
        setBookSearchResults([]);
        return;
      }

      const results =
        typeof payload === "object" && payload !== null && "results" in payload
          ? (payload as { results?: unknown }).results
          : null;

      setBookSearchResults(
        Array.isArray(results) ? (results as BookSearchResult[]) : []
      );
    } finally {
      setBookSearchLoading(false);
    }
  }

  async function onAddBookFromSearch(result: BookSearchResult) {
    const title = result.title?.trim() ?? "";
    if (!title) {
      toast.error("This result is missing a title.");
      return;
    }

    const dedupeTitle = title.toLowerCase();
    const dedupeAuthor = (result.author ?? "").trim().toLowerCase();
    const formatKey = bookAddFormat.toLowerCase();
    const dedupeKey = `${formatKey}::${dedupeTitle}::${dedupeAuthor}`;

    setBookAddLoadingKey(dedupeKey);
    setError(null);
    try {
      const { data: existing } = await supabase
        .from("books")
        .select("id, title, author, format, status")
        .eq("user_id", userId)
        .in("status", ["backlog", "reading"])
        .limit(500);

      const existingKeySet = new Set(
        (existing ?? [])
          .map((b) => {
            const t =
              typeof b.title === "string" ? b.title.trim().toLowerCase() : "";
            const a =
              typeof b.author === "string" ? b.author.trim().toLowerCase() : "";
            const f =
              typeof b.format === "string" ? b.format.trim().toLowerCase() : "";
            return t && f ? `${f}::${t}::${a}` : "";
          })
          .filter(Boolean)
      );

      if (existingKeySet.has(dedupeKey)) {
        toast.message("Already in your library.");
        await load();
        return;
      }

      const { error: insertError } = await supabase.from("books").insert({
        user_id: userId,
        title,
        author: result.author?.trim() ? result.author.trim() : null,
        format: bookAddFormat,
        status: "backlog",
        open_library_id: result.key,
      });

      if (insertError) {
        toast.error(insertError.message);
        return;
      }

      toast.success("Book added to backlog");
      await load();
    } finally {
      setBookAddLoadingKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Today’s plan ({planDate})
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <Card id="schedule">
        <CardHeader>
          <CardTitle>Schedule & Free Time</CardTitle>
          <CardDescription>
            Anchors for today ({scheduleRange.startTime}–{scheduleRange.endTime}
            )
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-black">
            <div className="h-[560px] lg:h-[720px] 2xl:h-[820px]">
              <Calendar
                localizer={rbcLocalizer}
                events={calendarEvents}
                defaultView={Views.WEEK}
                views={[Views.WEEK, Views.MONTH, Views.DAY]}
                selectable
                onSelectSlot={onCalendarSelect}
                onSelectEvent={onCalendarEventClick}
                startAccessor="start"
                endAccessor="end"
                min={new Date(`1970-01-01T${scheduleRange.startTime}:00`)}
                max={new Date(`1970-01-01T${scheduleRange.endTime}:00`)}
                style={{ height: "100%" }}
                eventPropGetter={(event) => {
                  const eventType =
                    (event as { resource?: { eventType?: string | null } })
                      .resource?.eventType ?? null;
                  const backgroundColor = colorForEventType(eventType);
                  return {
                    style: {
                      backgroundColor,
                      borderColor: backgroundColor,
                    },
                  };
                }}
                onRangeChange={(range) => {
                  if (Array.isArray(range) && range.length) {
                    const start = startOfDay(range[0]);
                    const end = endOfDay(range[range.length - 1]);
                    setCalendarRange({ start, end });
                    return;
                  }
                  const next = range as { start?: Date; end?: Date };
                  if (next.start && next.end) {
                    setCalendarRange({
                      start: startOfDay(next.start),
                      end: endOfDay(next.end),
                    });
                  }
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
              <div className="text-sm font-medium">Add schedule event</div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="scheduleDate">Date</Label>
                  <Input
                    id="scheduleDate"
                    type="date"
                    disabled={loading || working}
                    value={scheduleForm.date}
                    onChange={(e) =>
                      setScheduleForm((p) => ({ ...p, date: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-1">
                  <Label htmlFor="scheduleTitle">Title</Label>
                  <Input
                    id="scheduleTitle"
                    type="text"
                    disabled={loading || working}
                    placeholder="e.g. Dentist, Team meeting, Pickup"
                    value={scheduleForm.title}
                    onChange={(e) =>
                      setScheduleForm((p) => ({ ...p, title: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="scheduleType">Type</Label>
                  <select
                    id="scheduleType"
                    disabled={loading || working}
                    className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                    value={scheduleForm.scheduleType}
                    onChange={(e) =>
                      setScheduleForm((p) => ({
                        ...p,
                        scheduleType: e.target.value as "personal" | "work",
                      }))
                    }
                  >
                    <option value="personal">personal</option>
                    <option value="work">work</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="eventType">Category</Label>
                  <select
                    id="eventType"
                    disabled={loading || working}
                    className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                    value={scheduleForm.eventType}
                    onChange={(e) =>
                      setScheduleForm((p) => ({
                        ...p,
                        eventType: e.target
                          .value as typeof scheduleForm.eventType,
                      }))
                    }
                  >
                    <option value="meeting">meeting</option>
                    <option value="appointment">appointment</option>
                    <option value="work">work</option>
                    <option value="workout">workout</option>
                    <option value="meal">meal</option>
                    <option value="reading">reading</option>
                    <option value="sleep">sleep</option>
                    <option value="free_time">free_time</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="scheduleStart">Start</Label>
                  <Input
                    id="scheduleStart"
                    type="time"
                    disabled={loading || working}
                    value={scheduleForm.startTime}
                    onChange={(e) =>
                      setScheduleForm((p) => ({
                        ...p,
                        startTime: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="scheduleEnd">End</Label>
                  <Input
                    id="scheduleEnd"
                    type="time"
                    disabled={loading || working}
                    value={scheduleForm.endTime}
                    onChange={(e) =>
                      setScheduleForm((p) => ({
                        ...p,
                        endTime: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="schedulePriority">Priority (1–10)</Label>
                  <Input
                    id="schedulePriority"
                    type="number"
                    min={1}
                    max={10}
                    disabled={loading || working}
                    value={String(scheduleForm.priority)}
                    onChange={(e) =>
                      setScheduleForm((p) => ({
                        ...p,
                        priority:
                          e.target.value === "" ? 7 : Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <label className="flex items-start gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <input
                    type="checkbox"
                    disabled={loading || working}
                    checked={scheduleForm.isFlexible}
                    onChange={(e) =>
                      setScheduleForm((p) => ({
                        ...p,
                        isFlexible: e.target.checked,
                      }))
                    }
                  />
                  <span className="leading-5">
                    Flexible (managers can reschedule around it)
                  </span>
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={() => void onAddScheduleEvent()}
                  disabled={loading || working}
                >
                  Add event
                </Button>
              </div>
            </div>

            {scheduleEvents.length ? (
              <div className="grid gap-2">
                {scheduleEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-black sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {e.title?.trim() ? e.title : (e.event_type ?? "Event")}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        {e.event_type ?? "event"} • priority {e.priority ?? "—"}
                        {e.is_flexible ? " • flexible" : ""}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="shrink-0 tabular-nums text-zinc-600 dark:text-zinc-400">
                        {formatTime(e.start_time) ?? "—"}–
                        {formatTime(e.end_time) ?? "—"}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={working}
                        onClick={() => void onDeleteScheduleEvent(e.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                No schedule anchors set yet.
              </div>
            )}

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
              <div className="text-sm font-medium">Free windows</div>
              {scheduleFreeWindows.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {scheduleFreeWindows.slice(0, 10).map((w) => (
                    <span
                      key={`${w.startTime}-${w.endTime}`}
                      className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs tabular-nums text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                    >
                      {w.startTime}–{w.endTime}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  None found in your active day range.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button asChild variant="outline" type="button">
                <Link href="/onboarding?edit=1">Edit schedule</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atlas Morning Plan</CardTitle>
          <CardDescription>Generated daily plan message.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {loading ? (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Loading…
            </div>
          ) : plan?.atlas_morning_message ? (
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 whitespace-pre-wrap dark:border-zinc-800 dark:bg-black">
              {plan.atlas_morning_message}
            </div>
          ) : (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              No plan generated for today yet.
            </div>
          )}

          {plan?.coordination_log &&
          typeof plan.coordination_log === "object" ? (
            <details className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black">
              <summary className="cursor-pointer select-none font-medium">
                View planning conversation
              </summary>
              <div className="mt-3 grid gap-3">
                {getCoordinationSuggestion(plan.coordination_log, "forge") ? (
                  <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Forge
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-sm">
                      {getCoordinationSuggestion(
                        plan.coordination_log,
                        "forge"
                      )}
                    </div>
                  </div>
                ) : null}

                {getCoordinationSuggestion(plan.coordination_log, "olive") ? (
                  <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Olive
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-sm">
                      {getCoordinationSuggestion(
                        plan.coordination_log,
                        "olive"
                      )}
                    </div>
                  </div>
                ) : null}

                {getCoordinationSuggestion(plan.coordination_log, "lexicon") ? (
                  <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Lexicon
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-sm">
                      {getCoordinationSuggestion(
                        plan.coordination_log,
                        "lexicon"
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </details>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => void load()}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              type="button"
              onClick={() => void onGenerate()}
              disabled={generating}
            >
              {generating ? "Generating…" : "Generate today’s plan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Workout</CardTitle>
            <CardDescription>
              Forge’s planned session for today.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {workoutPlan ? (
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="font-medium capitalize">
                    {workoutPlan.workout_type}
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-400">
                    {formatTime(workoutPlan.scheduled_time) ?? "—"}
                  </div>
                  {typeof workoutPlan.total_duration_minutes === "number" ? (
                    <div className="text-zinc-600 dark:text-zinc-400">
                      {workoutPlan.total_duration_minutes} min
                    </div>
                  ) : null}
                  {workoutPlan.intensity ? (
                    <div className="text-zinc-600 dark:text-zinc-400">
                      Intensity: {workoutPlan.intensity}
                    </div>
                  ) : null}
                </div>

                {Array.isArray(workoutPlan.focus_areas) &&
                workoutPlan.focus_areas.length ? (
                  <div className="mt-2 text-zinc-700 dark:text-zinc-300">
                    Focus: {workoutPlan.focus_areas.join(", ")}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                No workout saved for today yet.
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={() => void onMarkWorkoutComplete()}
                disabled={!workoutPlan || !!workoutPlan.completed || working}
              >
                {workoutPlan?.completed ? "Completed" : "Mark complete"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Meals</CardTitle>
            <CardDescription>Olive’s planned meals for today.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {mealPlan && meals.length ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-medium">Today’s nutrition</div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      consumed vs planned
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-black">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Calories
                      </div>
                      <div className="mt-1 text-sm">
                        {(typeof nutritionTotals.consumed.calories === "number"
                          ? Math.round(nutritionTotals.consumed.calories)
                          : "—") +
                          " / " +
                          (typeof nutritionTotals.planned.calories === "number"
                            ? Math.round(nutritionTotals.planned.calories)
                            : "—")}{" "}
                        kcal
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-black">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Protein
                      </div>
                      <div className="mt-1 text-sm">
                        {(typeof nutritionTotals.consumed.protein_g === "number"
                          ? Math.round(nutritionTotals.consumed.protein_g)
                          : "—") +
                          " / " +
                          (typeof nutritionTotals.planned.protein_g === "number"
                            ? Math.round(nutritionTotals.planned.protein_g)
                            : "—")}{" "}
                        g
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-black">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Carbs
                      </div>
                      <div className="mt-1 text-sm">
                        {(typeof nutritionTotals.consumed.carbs_g === "number"
                          ? Math.round(nutritionTotals.consumed.carbs_g)
                          : "—") +
                          " / " +
                          (typeof nutritionTotals.planned.carbs_g === "number"
                            ? Math.round(nutritionTotals.planned.carbs_g)
                            : "—")}{" "}
                        g
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-black">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Fats
                      </div>
                      <div className="mt-1 text-sm">
                        {(typeof nutritionTotals.consumed.fats_g === "number"
                          ? Math.round(nutritionTotals.consumed.fats_g)
                          : "—") +
                          " / " +
                          (typeof nutritionTotals.planned.fats_g === "number"
                            ? Math.round(nutritionTotals.planned.fats_g)
                            : "—")}{" "}
                        g
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-black">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Fiber
                      </div>
                      <div className="mt-1 text-sm">
                        {typeof nutritionTotals.consumed.fiber_g === "number"
                          ? Math.round(nutritionTotals.consumed.fiber_g * 10) /
                            10
                          : "—"}{" "}
                        g
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-black">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Vitamin D
                      </div>
                      <div className="mt-1 text-sm">
                        {typeof nutritionTotals.consumed.vitamin_d_mcg ===
                        "number"
                          ? Math.round(
                              nutritionTotals.consumed.vitamin_d_mcg * 10
                            ) / 10
                          : "—"}{" "}
                        mcg
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-black">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Vitamin B12
                      </div>
                      <div className="mt-1 text-sm">
                        {typeof nutritionTotals.consumed.vitamin_b12_mcg ===
                        "number"
                          ? Math.round(
                              nutritionTotals.consumed.vitamin_b12_mcg * 10
                            ) / 10
                          : "—"}{" "}
                        mcg
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-black">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Iron
                      </div>
                      <div className="mt-1 text-sm">
                        {typeof nutritionTotals.consumed.iron_mg === "number"
                          ? Math.round(nutritionTotals.consumed.iron_mg * 10) /
                            10
                          : "—"}{" "}
                        mg
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-black">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Calcium
                      </div>
                      <div className="mt-1 text-sm">
                        {typeof nutritionTotals.consumed.calcium_mg === "number"
                          ? Math.round(
                              nutritionTotals.consumed.calcium_mg * 10
                            ) / 10
                          : "—"}{" "}
                        mg
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-black">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Magnesium
                      </div>
                      <div className="mt-1 text-sm">
                        {typeof nutritionTotals.consumed.magnesium_mg ===
                        "number"
                          ? Math.round(
                              nutritionTotals.consumed.magnesium_mg * 10
                            ) / 10
                          : "—"}{" "}
                        mg
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-black">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Omega-3
                      </div>
                      <div className="mt-1 text-sm">
                        {typeof nutritionTotals.consumed.omega3_g === "number"
                          ? Math.round(nutritionTotals.consumed.omega3_g * 10) /
                            10
                          : "—"}{" "}
                        g
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    7-day deficiency check:{" "}
                    {weekDeficiencies.length
                      ? weekDeficiencies.join(", ")
                      : "none detected"}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    Nutrition score:{" "}
                    {typeof todayNutritionScore === "number"
                      ? `${todayNutritionScore}/100`
                      : "—"}
                  </div>

                  <div className="mt-2 rounded-lg border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-black">
                    <NutritionTrendChart
                      endDate={planDate}
                      weekNutrition={weekNutrition}
                    />
                  </div>
                </div>
              </div>
            ) : null}
            {mealPlan && meals.length ? (
              <div className="grid gap-3">
                {meals.map((meal) => {
                  const logged = !!meal.actually_eaten;
                  return (
                    <div
                      key={meal.id}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <div className="font-medium capitalize">
                              {meal.meal_type}
                            </div>
                            <div className="text-zinc-600 dark:text-zinc-400">
                              {formatTime(meal.scheduled_time) ?? "—"}
                            </div>
                          </div>
                          <div className="mt-1 font-medium">{meal.name}</div>
                          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            {typeof meal.calories === "number"
                              ? `${meal.calories} kcal`
                              : "—"}
                            {" · "}
                            {typeof meal.protein_g === "number"
                              ? `${meal.protein_g}P`
                              : "—"}
                            {" · "}
                            {typeof meal.carbs_g === "number"
                              ? `${meal.carbs_g}C`
                              : "—"}
                            {" · "}
                            {typeof meal.fats_g === "number"
                              ? `${meal.fats_g}F`
                              : "—"}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                          <Button
                            type="button"
                            variant={logged ? "outline" : "default"}
                            onClick={() => void onLogMeal(meal.id)}
                            disabled={logged || working}
                          >
                            {logged ? "Logged" : "Log eaten"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => onSwapMeal(meal)}
                            disabled={logged || working}
                          >
                            Swap
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                No meals saved for today yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Reading</CardTitle>
            <CardDescription>
              Lexicon’s reading session for today.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {readingSession ? (
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black">
                <div className="font-medium">
                  {readingSession.book?.title ?? "Reading session"}
                </div>
                {readingSession.book?.author ? (
                  <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {readingSession.book.author}
                  </div>
                ) : null}
                <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                  {readingSession.started_at ? "Started" : "Not started"}{" "}
                  {readingSession.scheduled_time
                    ? `· ${formatTime(readingSession.scheduled_time) ?? ""}`
                    : ""}
                </div>
                {readingSession.ended_at ? (
                  <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    Completed
                    {typeof readingSession.duration_minutes === "number"
                      ? ` · ${readingSession.duration_minutes} min`
                      : ""}
                    {typeof readingSession.pages_read === "number"
                      ? ` · ${readingSession.pages_read} pages`
                      : ""}
                  </div>
                ) : null}
              </div>
            ) : suggestedBook ? (
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black">
                <div className="font-medium">
                  {suggestedBook.title ?? "Your book"}
                </div>
                {suggestedBook.author ? (
                  <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {suggestedBook.author}
                  </div>
                ) : null}
                <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                  Suggested from your {suggestedBook.status ?? "library"} list
                </div>
              </div>
            ) : (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Add a book to enable reading sessions.
              </div>
            )}

            {readingSession?.started_at && !readingSession.ended_at ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="readingPages">Pages read (optional)</Label>
                    <Input
                      id="readingPages"
                      inputMode="numeric"
                      disabled={working}
                      value={readingPagesRead}
                      onChange={(e) => setReadingPagesRead(e.target.value)}
                      placeholder="e.g. 12"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="readingNotes">Notes (optional)</Label>
                    <Input
                      id="readingNotes"
                      disabled={working}
                      value={readingNotes}
                      onChange={(e) => setReadingNotes(e.target.value)}
                      placeholder="1 takeaway, quote, or reflection"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void onEndReadingSession()}
                    disabled={working}
                  >
                    End session
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-sm font-medium">Find a book</div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Search Open Library and add to your backlog.
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="bookFormat">Format</Label>
                      <select
                        id="bookFormat"
                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                        value={bookAddFormat}
                        onChange={(e) =>
                          setBookAddFormat(
                            e.target.value as "physical" | "ebook" | "audiobook"
                          )
                        }
                      >
                        <option value="physical">Physical</option>
                        <option value="ebook">Ebook</option>
                        <option value="audiobook">Audiobook</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="bookSearch">Search</Label>
                    <Input
                      id="bookSearch"
                      value={bookSearchQuery}
                      onChange={(e) => setBookSearchQuery(e.target.value)}
                      placeholder="e.g. Atomic Habits"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={bookSearchLoading}
                    onClick={() => void onSearchBooks()}
                  >
                    {bookSearchLoading ? "Searching…" : "Search"}
                  </Button>
                </div>

                {bookSearchResults.length ? (
                  <div className="grid gap-2">
                    {bookSearchResults.map((r, idx) => {
                      const title = r.title?.trim()
                        ? r.title.trim()
                        : "Untitled";
                      const author = r.author?.trim()
                        ? r.author.trim()
                        : "Unknown author";
                      const year =
                        typeof r.firstPublishYear === "number"
                          ? String(r.firstPublishYear)
                          : null;
                      const key = `${r.key ?? "none"}::${idx}`;
                      const loadingKey = `${bookAddFormat}::${title.toLowerCase()}::${(r.author ?? "").trim().toLowerCase()}`;
                      return (
                        <div
                          key={key}
                          className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-black sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="font-medium">{title}</div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-400">
                              {author}
                              {year ? ` • ${year}` : ""}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!!bookAddLoadingKey}
                            onClick={() => void onAddBookFromSearch(r)}
                          >
                            {bookAddLoadingKey === loadingKey
                              ? "Adding…"
                              : "Add"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : bookSearchQuery.trim() ? (
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    {bookSearchLoading ? "Searching…" : "No results yet."}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={() => void onStartReadingSession()}
                disabled={
                  !plan ||
                  working ||
                  !!readingSession?.started_at ||
                  !!readingSession?.ended_at
                }
              >
                Start session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
