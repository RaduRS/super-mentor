"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

type ManagerKey = "atlas" | "forge" | "olive" | "lexicon";

type ConversationRow = {
  id: string;
  created_at: string;
  manager: ManagerKey;
  role: "user" | "assistant" | "system";
  content: string;
};

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

function getCoordinationPlanDate(log: unknown) {
  if (!log || typeof log !== "object" || Array.isArray(log)) return null;
  const v = (log as Record<string, unknown>).planDate;
  if (typeof v !== "string") return null;
  return v.trim() ? v.trim() : null;
}

const Managers: Array<{
  key: ManagerKey;
  name: string;
  description: string;
}> = [
  {
    key: "atlas",
    name: "Atlas",
    description: "Holistic coordinator and guardian of your goals.",
  },
  {
    key: "forge",
    name: "Forge",
    description: "Fitness planning and recovery.",
  },
  {
    key: "olive",
    name: "Olive",
    description: "Nutrition and health guidance.",
  },
  {
    key: "lexicon",
    name: "Lexicon",
    description: "Reading, learning, and discussion.",
  },
];

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatInterface(props: { userId: string }) {
  const { userId } = props;

  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const searchParams = useSearchParams();
  const [activeManager, setActiveManager] = useState<ManagerKey>("atlas");
  const [messages, setMessages] = useState<ConversationRow[]>([]);
  const [coordinationLog, setCoordinationLog] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingAutoSend, setPendingAutoSend] = useState<{
    manager: ManagerKey;
    message: string;
    key: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastAutoKeyRef = useRef<string>("");

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, activeManager]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("conversations")
          .select("id, created_at, manager, role, content")
          .eq("user_id", userId)
          .eq("manager", activeManager)
          .order("created_at", { ascending: true })
          .limit(200);

        if (error) {
          toast.error(error.message);
          setMessages([]);
          return;
        }

        setMessages((data as ConversationRow[] | null) ?? []);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [activeManager, supabase, userId]);

  useEffect(() => {
    if (activeManager !== "atlas") {
      setCoordinationLog(null);
      return;
    }

    async function loadCoordinationLog() {
      const { data, error } = await supabase
        .from("daily_plans")
        .select("plan_date, coordination_log")
        .eq("user_id", userId)
        .order("plan_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return;
      setCoordinationLog(
        data && typeof data === "object" && "coordination_log" in data
          ? ((data as { coordination_log?: unknown }).coordination_log ?? null)
          : null
      );
    }

    void loadCoordinationLog();
  }, [activeManager, supabase, userId]);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      setSending(true);
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticUserMessage: ConversationRow = {
        id: optimisticId,
        created_at: new Date().toISOString(),
        manager: activeManager,
        role: "user",
        content: trimmed,
      };

      setMessages((prev) => [...prev, optimisticUserMessage]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            manager: activeManager,
            message: trimmed,
          }),
        });

        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload
              ? String((payload as { error?: unknown }).error ?? "Chat failed")
              : "Chat failed";
          toast.error(message);
          return;
        }

        const reply =
          typeof payload === "object" && payload !== null && "reply" in payload
            ? String((payload as { reply?: unknown }).reply ?? "")
            : "";

        if (!reply.trim()) {
          toast.error("Empty reply");
          return;
        }

        const nextCoordinationLog =
          typeof payload === "object" &&
          payload !== null &&
          "coordinationLog" in payload
            ? (payload as { coordinationLog?: unknown }).coordinationLog
            : null;

        if (activeManager === "atlas" && nextCoordinationLog) {
          setCoordinationLog(nextCoordinationLog);
        }

        const savedUser =
          typeof payload === "object" &&
          payload !== null &&
          "userMessage" in payload
            ? (payload as { userMessage?: unknown }).userMessage
            : null;
        const savedAssistant =
          typeof payload === "object" &&
          payload !== null &&
          "assistantMessage" in payload
            ? (payload as { assistantMessage?: unknown }).assistantMessage
            : null;

        if (
          savedUser &&
          typeof savedUser === "object" &&
          "id" in savedUser &&
          "created_at" in savedUser
        ) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === optimisticId ? (savedUser as ConversationRow) : m
            )
          );
        }

        if (
          savedAssistant &&
          typeof savedAssistant === "object" &&
          "id" in savedAssistant &&
          "created_at" in savedAssistant
        ) {
          setMessages((prev) => [...prev, savedAssistant as ConversationRow]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `local-${Date.now()}`,
              created_at: new Date().toISOString(),
              manager: activeManager,
              role: "assistant",
              content: reply,
            },
          ]);
        }
      } finally {
        setSending(false);
      }
    },
    [activeManager, sending, userId]
  );

  async function onSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    await sendText(text);
  }

  useEffect(() => {
    const managerParam = searchParams.get("manager");
    const draftParam = searchParams.get("draft");
    const autosendParam = searchParams.get("autosend");

    const nextManager =
      managerParam === "atlas" ||
      managerParam === "forge" ||
      managerParam === "olive" ||
      managerParam === "lexicon"
        ? managerParam
        : null;

    const nextDraft = typeof draftParam === "string" ? draftParam.trim() : "";
    const shouldAutoSend = autosendParam === "1";

    if (nextManager) {
      setActiveManager(nextManager);
    }
    if (nextDraft) {
      setDraft(nextDraft);
    }

    if (nextManager && nextDraft && shouldAutoSend) {
      const key = `${nextManager}:${nextDraft}`;
      if (lastAutoKeyRef.current !== key) {
        lastAutoKeyRef.current = key;
        setPendingAutoSend({ manager: nextManager, message: nextDraft, key });
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!pendingAutoSend) return;
    if (pendingAutoSend.manager !== activeManager) return;
    if (loading || sending) return;

    const currentKey = pendingAutoSend.key;
    void (async () => {
      await sendText(pendingAutoSend.message);
      setPendingAutoSend((prev) =>
        prev && prev.key === currentKey ? null : prev
      );
      setDraft("");
    })();
  }, [activeManager, loading, pendingAutoSend, sending, sendText]);

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "assistant") return messages[i].id;
    }
    return null;
  }, [messages]);

  const planDate = useMemo(
    () => getCoordinationPlanDate(coordinationLog),
    [coordinationLog]
  );
  const forgeSuggestion = useMemo(
    () => getCoordinationSuggestion(coordinationLog, "forge"),
    [coordinationLog]
  );
  const oliveSuggestion = useMemo(
    () => getCoordinationSuggestion(coordinationLog, "olive"),
    [coordinationLog]
  );
  const lexiconSuggestion = useMemo(
    () => getCoordinationSuggestion(coordinationLog, "lexicon"),
    [coordinationLog]
  );
  const hasCoordinationSuggestions = !!(
    forgeSuggestion ||
    oliveSuggestion ||
    lexiconSuggestion
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle>Chat</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex min-h-[360px] max-h-[calc(100svh-220px)] min-w-0 flex-col rounded-xl border border-zinc-200 bg-white sm:min-h-[520px] dark:border-zinc-800 dark:bg-black">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
            {loading ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Loading…
              </div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Start a conversation with{" "}
                {Managers.find((m) => m.key === activeManager)?.name}.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((m) => {
                  const isUser = m.role === "user";
                  return (
                    <div
                      key={m.id}
                      className={
                        "flex " + (isUser ? "justify-end" : "justify-start")
                      }
                    >
                      <div
                        className={
                          "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] " +
                          (isUser
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50")
                        }
                      >
                        <div className="whitespace-pre-wrap">{m.content}</div>
                        {!isUser &&
                        activeManager === "atlas" &&
                        m.id === lastAssistantMessageId &&
                        hasCoordinationSuggestions ? (
                          <details className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-black">
                            <summary className="cursor-pointer select-none font-medium">
                              View planning conversation
                              {planDate ? ` (${planDate})` : ""}
                            </summary>
                            <div className="mt-3 grid gap-3">
                              {forgeSuggestion ? (
                                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Forge
                                  </div>
                                  <div className="mt-1 whitespace-pre-wrap text-sm">
                                    {forgeSuggestion}
                                  </div>
                                </div>
                              ) : null}

                              {oliveSuggestion ? (
                                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Olive
                                  </div>
                                  <div className="mt-1 whitespace-pre-wrap text-sm">
                                    {oliveSuggestion}
                                  </div>
                                </div>
                              ) : null}

                              {lexiconSuggestion ? (
                                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Lexicon
                                  </div>
                                  <div className="mt-1 whitespace-pre-wrap text-sm">
                                    {lexiconSuggestion}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </details>
                        ) : null}
                        <div
                          className={
                            "mt-2 text-xs " +
                            (isUser
                              ? "text-white/70 dark:text-zinc-900/60"
                              : "text-zinc-500 dark:text-zinc-400")
                          }
                        >
                          {formatTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Message
                </label>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void onSend();
                    }
                  }}
                  disabled={sending}
                  rows={2}
                  className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  placeholder="Type your message…"
                />
              </div>
              <div className="flex gap-2 sm:items-end">
                <div className="sm:w-44">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Manager
                  </label>
                  <select
                    value={activeManager}
                    onChange={(e) =>
                      setActiveManager(e.target.value as ManagerKey)
                    }
                    disabled={sending}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
                  >
                    {Managers.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  onClick={() => void onSend()}
                  disabled={sending || !draft.trim()}
                  className="h-9 sm:w-28"
                >
                  {sending ? "Sending…" : "Send"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
