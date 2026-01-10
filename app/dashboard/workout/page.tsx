"use client";

import Link from "next/link";

import { AppShell } from "@/components/app/AppShell";
import { DailyDashboard } from "@/components/dashboard/DailyDashboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocalUserSession } from "@/lib/session/useLocalUserSession";

export default function WorkoutPage() {
  const { currentUser, loading } = useLocalUserSession();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 dark:bg-black dark:text-zinc-50">
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16 2xl:max-w-screen-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Loading…</CardTitle>
              <CardDescription>Fetching your profile.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 dark:bg-black dark:text-zinc-50">
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16 2xl:max-w-screen-2xl">
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16 2xl:max-w-screen-2xl">
        <AppShell>
          <DailyDashboard userId={currentUser.id} mode="workout" />
        </AppShell>
      </main>
    </div>
  );
}

