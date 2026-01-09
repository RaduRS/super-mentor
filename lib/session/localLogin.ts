import { z } from "zod";

const LOGIN_STORAGE_KEY = "supermentor:login_v1";
const LOGIN_TTL_MS = 365 * 24 * 60 * 60 * 1000;

const StoredLoginSchema = z.object({
  userId: z.string().min(1),
  expiresAt: z.number(),
});

export type StoredLogin = z.infer<typeof StoredLoginSchema>;

export function readStoredLogin(): StoredLogin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOGIN_STORAGE_KEY);
    if (!raw) return null;

    const parsedJson: unknown = JSON.parse(raw);
    const parsed = StoredLoginSchema.safeParse(parsedJson);
    if (!parsed.success) return null;
    if (Date.now() >= parsed.data.expiresAt) return null;

    return parsed.data;
  } catch {
    return null;
  }
}

export function writeStoredLogin(userId: string) {
  if (typeof window === "undefined") return;
  const value: StoredLogin = { userId, expiresAt: Date.now() + LOGIN_TTL_MS };
  try {
    window.localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(value));
  } catch {
    return;
  }
}

export function clearStoredLogin() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOGIN_STORAGE_KEY);
  } catch {
    return;
  }
}

