"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { useLocalUserSession } from "@/lib/session/useLocalUserSession";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
          <Card>
            <CardHeader>
              <CardTitle>Loading…</CardTitle>
              <CardDescription>Fetching your profile.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  );
}

function OnboardingPageContent() {
  const searchParams = useSearchParams();
  const allowEdit = searchParams.get("edit") === "1";

  const { currentUser, loading } = useLocalUserSession();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [onboardingCompletedAt, setOnboardingCompletedAt] = useState<
    string | null
  >(null);

  useEffect(() => {
    async function check() {
      if (!currentUser) {
        setOnboardingCompletedAt(null);
        return;
      }

      setCheckingOnboarding(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("sleep_schedule")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (error) {
          setOnboardingCompletedAt(null);
          return;
        }

        const raw = (data as { sleep_schedule?: unknown } | null)
          ?.sleep_schedule;
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
          setOnboardingCompletedAt(null);
          return;
        }

        const completedAt = (raw as { onboardingCompletedAt?: unknown })
          .onboardingCompletedAt;
        setOnboardingCompletedAt(
          typeof completedAt === "string" && completedAt.trim()
            ? completedAt
            : null
        );
      } finally {
        setCheckingOnboarding(false);
      }
    }

    void check();
  }, [currentUser, supabase]);

  if (loading || checkingOnboarding) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <Card>
          <CardHeader>
            <CardTitle>Loading…</CardTitle>
            <CardDescription>Fetching your profile.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <Card>
          <CardHeader>
            <CardTitle>Not logged in</CardTitle>
            <CardDescription>Go back and log in first.</CardDescription>
          </CardHeader>
          <div className="mt-5 flex justify-end">
            <Button asChild>
              <Link href="/">Go to home</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (onboardingCompletedAt && !allowEdit) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <Card>
          <CardHeader>
            <CardTitle>Onboarding already completed</CardTitle>
            <CardDescription>
              Your setup was saved at{" "}
              {new Date(onboardingCompletedAt).toLocaleString()}.
            </CardDescription>
          </CardHeader>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href="/">Go to home</Link>
            </Button>
            <Button asChild>
              <Link href="/onboarding?edit=1">Edit onboarding</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
      <OnboardingWizard userId={currentUser.id} />
    </div>
  );
}
