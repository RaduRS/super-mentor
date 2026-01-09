"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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

const CreateGoalSchema = z.object({
  category: z.enum(["fitness", "nutrition", "reading"]),
  goalType: z.enum(["target", "lifestyle"]),
  description: z.string().min(1, "Description is required"),
});

type CreateGoalValues = z.infer<typeof CreateGoalSchema>;

type GoalRow = {
  id: string;
  created_at: string | null;
  category: string;
  goal_type: string;
  description: string;
  status: string;
};

export function GoalsDashboard(props: { userId: string }) {
  const { userId } = props;
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateGoalValues>({
    resolver: zodResolver(CreateGoalSchema),
    defaultValues: {
      category: "fitness",
      goalType: "target",
      description: "",
    },
    mode: "onSubmit",
  });

  const loadGoals = useCallback(
    async (activeUserId: string) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: selectError } = await supabase
          .from("goals")
          .select("id, created_at, category, goal_type, description, status")
          .eq("user_id", activeUserId)
          .order("created_at", { ascending: false });

        if (selectError) {
          setError(selectError.message);
          return;
        }

        setGoals((data as GoalRow[] | null) ?? []);
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    void loadGoals(userId);
  }, [loadGoals, userId]);

  async function onCreate(values: CreateGoalValues) {
    setError(null);

    const { error: insertError } = await supabase.from("goals").insert({
      user_id: userId,
      category: values.category,
      goal_type: values.goalType,
      description: values.description,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    form.reset({ ...values, description: "" });
    await loadGoals(userId);
  }

  async function onSeedDefaults() {
    setError(null);
    const response = await fetch("/api/seed-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        typeof payload === "object" && payload !== null && "error" in payload
          ? String((payload as { error?: unknown }).error ?? "Seeding failed")
          : "Seeding failed";
      setError(message);
      return;
    }

    await loadGoals(userId);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goals</CardTitle>
        <CardDescription>Create a goal and track it here.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onCreate)}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                {...form.register("category")}
              >
                <option value="fitness">Fitness</option>
                <option value="nutrition">Nutrition</option>
                <option value="reading">Reading</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="goalType">Type</Label>
              <select
                id="goalType"
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                {...form.register("goalType")}
              >
                <option value="target">Target</option>
                <option value="lifestyle">Lifestyle</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full"
              >
                {form.formState.isSubmitting ? "Creating…" : "Add goal"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="e.g. Lose 5kg in 8 weeks"
              {...form.register("description")}
            />
            {form.formState.errors.description?.message ? (
              <div className="text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.description.message}
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : null}
        </form>

        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {loading
              ? "Loading…"
              : `${goals.length} goal${goals.length === 1 ? "" : "s"}`}
          </div>
          <div className="flex items-center gap-2">
            {!loading && goals.length === 0 ? (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => void onSeedDefaults()}
              >
                Add my default goals
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => void loadGoals(userId)}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-semibold">{goal.description}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {goal.category} • {goal.goal_type} • {goal.status}
                </div>
              </div>
            </div>
          ))}

          {!loading && goals.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              No goals yet. Create your first one above.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
