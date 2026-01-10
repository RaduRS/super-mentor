"use client";

import Link from "next/link";

import { AppShell } from "@/components/app/AppShell";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocalUserSession } from "@/lib/session/useLocalUserSession";

export default function ChatPage() {
  const { currentUser, loading } = useLocalUserSession();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 dark:bg-black dark:text-zinc-50">
        <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
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
        <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
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
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 2xl:max-w-screen-2xl">
        <AppShell>
          <div className="mx-auto w-full max-w-4xl">
            <ChatInterface userId={currentUser.id} />
          </div>
        </AppShell>
      </main>
    </div>
  );
}
