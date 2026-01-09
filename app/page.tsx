"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app/AppShell";
import { GoalsDashboard } from "@/components/goals/GoalsDashboard";
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
import { useLocalUserSession } from "@/lib/session/useLocalUserSession";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

const LoginFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type LoginFormValues = z.infer<typeof LoginFormSchema>;

function LoginCard(props: {
  form: ReturnType<typeof useForm<LoginFormValues>>;
  submitError: string | null;
  loading: boolean;
  onSubmit: (values: LoginFormValues) => Promise<void>;
}) {
  const { form, submitError, onSubmit, loading } = props;

  return (
    <div className="flex flex-col gap-5">
      <form
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            {...form.register("name")}
          />
          {form.formState.errors.name?.message ? (
            <div className="text-sm text-red-600 dark:text-red-400">
              {form.formState.errors.name.message}
            </div>
          ) : null}
        </div>

        {submitError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {submitError}
          </div>
        ) : null}

        <Button type="submit" disabled={form.formState.isSubmitting || loading}>
          {form.formState.isSubmitting || loading ? "Checking…" : "Continue"}
        </Button>

        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          This is a simple name check (not real authentication).
        </p>
      </form>
    </div>
  );
}

export default function Home() {
  const [copying, setCopying] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<
    "unknown" | "incomplete" | "complete"
  >("unknown");
  const [onboardingCompletedAt, setOnboardingCompletedAt] = useState<
    string | null
  >(null);
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);

  const { currentUser, loading, error, loginByName, logout } =
    useLocalUserSession();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { name: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: LoginFormValues) {
    await loginByName(values.name);
    form.reset(values);
  }

  async function onCopyUserId() {
    const userId = currentUser?.id ?? "";
    if (!userId) return;
    try {
      setCopying(true);
      await navigator.clipboard.writeText(userId);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    } finally {
      setCopying(false);
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sm_onboarding_skip");
      setOnboardingSkipped(Boolean(raw));
    } catch {
      setOnboardingSkipped(false);
    }
  }, []);

  useEffect(() => {
    async function check() {
      if (!currentUser) {
        setOnboardingStatus("unknown");
        setOnboardingCompletedAt(null);
        return;
      }

      setOnboardingStatus("unknown");
      try {
        try {
          const localCompletedAt = localStorage.getItem(
            "sm_onboarding_completed"
          );
          if (localCompletedAt && localCompletedAt.trim()) {
            setOnboardingCompletedAt(localCompletedAt);
            setOnboardingStatus("complete");
            return;
          }
        } catch {}

        const { data, error: selectError } = await supabase
          .from("users")
          .select("sleep_schedule")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (selectError) {
          setOnboardingStatus("unknown");
          return;
        }

        const raw = (data as { sleep_schedule?: unknown } | null)
          ?.sleep_schedule;
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
          setOnboardingCompletedAt(null);
          setOnboardingStatus("incomplete");
          return;
        }

        const completedAt = (raw as { onboardingCompletedAt?: unknown })
          .onboardingCompletedAt;
        const normalized =
          typeof completedAt === "string" && completedAt.trim()
            ? completedAt.trim()
            : null;
        setOnboardingCompletedAt(normalized);
        setOnboardingStatus(normalized ? "complete" : "incomplete");
      } finally {
      }
    }

    void check();
  }, [currentUser, supabase]);

  useEffect(() => {
    if (!currentUser) return;
    if (onboardingStatus !== "incomplete") return;
    if (onboardingSkipped) return;
    router.push("/onboarding");
  }, [currentUser, onboardingSkipped, onboardingStatus, router]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main
        className={
          "mx-auto flex w-full flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16 " +
          (currentUser ? "max-w-7xl 2xl:max-w-screen-2xl" : "max-w-2xl")
        }
      >
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Super Mentor
          </h1>
          <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
            One-time setup to create your single local user.
          </p>
        </header>

        {!currentUser ? (
          <Card>
            <CardHeader>
              <CardTitle>Log in</CardTitle>
              <CardDescription>Enter your name to continue.</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginCard
                form={form}
                submitError={error}
                loading={loading}
                onSubmit={onSubmit}
              />
            </CardContent>
          </Card>
        ) : (
          <AppShell>
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    You’re logged in on this device for a year.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {onboardingStatus === "incomplete" ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black">
                      <div className="font-medium">
                        Finish your setup to unlock planning.
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            try {
                              localStorage.removeItem("sm_onboarding_skip");
                              setOnboardingSkipped(false);
                            } catch {}
                            router.push("/onboarding");
                          }}
                        >
                          Continue onboarding
                        </Button>
                        {onboardingSkipped ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              try {
                                localStorage.removeItem("sm_onboarding_skip");
                                setOnboardingSkipped(false);
                              } catch {}
                            }}
                          >
                            Stop skipping
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        User ID
                      </div>
                      <div className="mt-1 flex items-start justify-between gap-3">
                        <div className="break-all text-sm">
                          {currentUser.id}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={copying}
                          onClick={() => void onCopyUserId()}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black">
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Profile
                      </div>
                      <div className="mt-1 text-sm">
                        {(currentUser.name ?? "—") +
                          " • " +
                          (currentUser.email ?? "—")}
                      </div>
                    </div>
                  </div>

                  {onboardingCompletedAt ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-black">
                      <div className="font-medium">Onboarding completed</div>
                      <div className="text-zinc-600 dark:text-zinc-400">
                        Setup saved at{" "}
                        {new Date(onboardingCompletedAt).toLocaleString()}.
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Log out clears the saved login on this device.
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        logout();
                        form.reset({ name: "" });
                      }}
                    >
                      Log out
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <GoalsDashboard userId={currentUser.id} />
            </div>
          </AppShell>
        )}
      </main>
    </div>
  );
}
