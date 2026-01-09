"use client";

import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { clearStoredLogin, readStoredLogin, writeStoredLogin } from "./localLogin";
import { type AppUser, fetchUserById, fetchUserByName } from "@/lib/users/userQueries";

export function useLocalUserSession() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabaseBrowser(), []);

  useEffect(() => {
    const stored = readStoredLogin();
    if (!stored) return;

    async function restore(userId: string) {
      setLoading(true);
      setError(null);
      try {
        setCurrentUser(await fetchUserById(supabase, userId));
      } finally {
        setLoading(false);
      }
    }

    void restore(stored.userId);
  }, [supabase]);

  async function loginByName(name: string) {
    setError(null);
    setLoading(true);
    try {
      const user = await fetchUserByName(supabase, name);
      if (!user) {
        setError("Name not found in database.");
        return;
      }

      const fullUser = await fetchUserById(supabase, user.id);
      setCurrentUser(fullUser);
      writeStoredLogin(fullUser.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearStoredLogin();
    setCurrentUser(null);
    setError(null);
  }

  return { currentUser, loading, error, loginByName, logout };
}

