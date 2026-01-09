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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle>Chat</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Managers
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {Managers.map((m) => {
              const active = m.key === activeManager;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setActiveManager(m.key)}
                  className={
                    "min-w-[180px] rounded-xl border px-3 py-2 text-left text-sm lg:min-w-0 " +
                    (active
                      ? "border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-black dark:hover:bg-zinc-950")
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{m.name}</div>
                    <div
                      className={
                        "size-2 rounded-full " +
                        (active
                          ? "bg-emerald-500"
                          : "bg-zinc-300 dark:bg-zinc-700")
                      }
                    />
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {m.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-h-[520px] flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
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
              <Button
                type="button"
                onClick={() => void onSend()}
                disabled={sending || !draft.trim()}
                className="sm:w-28"
              >
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
