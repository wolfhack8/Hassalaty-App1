"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUp, Plus, Sparkles, Square, Copy, Check, PanelLeft, X } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { LogoMark } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { useFinance } from "@/components/finance/finance-provider";
import { pick } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "./markdown-message";
import { ConversationSidebar, type ConversationSummary } from "./conversation-sidebar";

type Msg = { role: "user" | "assistant"; content: string };

export function AssistantScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("assistant");
  const { user } = useFinance();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const suggestions = [
    t("suggestion1"),
    t("suggestion2"),
    t("suggestion3"),
    t("suggestion4"),
  ];

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/assistant/conversations");
      if (!res.ok) return;
      const data = (await res.json()) as { conversations: ConversationSummary[] };
      setConversations(data.conversations ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newChat() {
    stop();
    setMessages([]);
    setCurrentId(null);
    setDrawerOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function selectConversation(id: string) {
    if (id === currentId) {
      setDrawerOpen(false);
      return;
    }
    stop();
    setDrawerOpen(false);
    setCurrentId(id);
    setMessages([]);
    try {
      const res = await fetch(`/api/assistant/conversations/${id}`);
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Msg[] };
      setMessages(data.messages ?? []);
    } catch {
      /* ignore */
    }
  }

  async function deleteConversation(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === currentId) {
      setMessages([]);
      setCurrentId(null);
    }
    try {
      await fetch(`/api/assistant/conversations/${id}`, { method: "DELETE" });
    } catch {
      /* ignore */
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, locale, conversationId: currentId }),
        signal: controller.signal,
      });
      const cid = res.headers.get("X-Conversation-Id");
      if (cid) setCurrentId(cid);
      if (!res.body) throw new Error("no body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant" && !last.content) {
            copy[copy.length - 1] = { role: "assistant", content: t("errorNote") };
          }
          return copy;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      loadConversations();
      inputRef.current?.focus();
    }
  }

  async function copy(text: string, i: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  const empty = messages.length === 0;
  const lastIndex = messages.length - 1;

  return (
    <div className="relative -mx-4 -my-6 flex h-[calc(100dvh-4rem-env(safe-area-inset-top))] overflow-hidden bg-card sm:mx-0 sm:my-0 sm:h-[calc(100dvh-10rem)] sm:rounded-3xl sm:border sm:border-border sm:shadow-xs">
      {/* Sidebar — desktop */}
      <ConversationSidebar
        className="hidden w-64 shrink-0 border-e border-border lg:flex"
        conversations={conversations}
        currentId={currentId}
        onSelect={selectConversation}
        onNew={newChat}
        onDelete={deleteConversation}
      />

      {/* Chats — full-screen overlay on mobile */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
            initial={{ opacity: 0, x: "-8%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "-8%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5 pt-[calc(0.875rem+env(safe-area-inset-top))]">
              <p className="text-base font-semibold text-foreground">{t("conversations")}</p>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label={t("close")}
                className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ConversationSidebar
              className="min-h-0 flex-1"
              hideLabel
              conversations={conversations}
              currentId={currentId}
              onSelect={selectConversation}
              onNew={newChat}
              onDelete={deleteConversation}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat pane */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label={t("conversations")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-foreground hover:bg-accent lg:hidden"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground sm:grid">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{t("title")}</p>
              <p className="truncate text-xs text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <button
            onClick={newChat}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("newChat")}
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6">
          {/* Greeting */}
          <div className="flex gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary-strong">
              <LogoMark className="h-4 w-4" />
            </span>
            <div className="max-w-[42rem] rounded-2xl rounded-ss-sm bg-surface-muted px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                {t("greeting", { name: pick(user.firstName, locale) })}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t("greetingBody")}
              </p>
            </div>
          </div>

          {messages.map((m, i) => {
            const isStreamingMsg = streaming && i === lastIndex && m.role === "assistant";
            if (m.role === "user") {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="flex justify-end gap-3"
                >
                  <div className="max-w-[42rem] rounded-2xl rounded-se-sm bg-primary px-4 py-3 text-primary-foreground">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                  </div>
                  <Avatar name={pick(user.name, locale)} size="sm" className="mt-0.5" />
                </motion.div>
              );
            }
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="group flex gap-3"
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary-strong",
                    isStreamingMsg && "ring-2 ring-primary/30",
                  )}
                >
                  <LogoMark className="h-4 w-4" />
                </span>
                <div className="min-w-0 max-w-[42rem]">
                  <div className="rounded-2xl rounded-ss-sm bg-surface-muted px-4 py-3 text-sm text-foreground">
                    {m.content ? (
                      isStreamingMsg ? (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {m.content}
                          <span className="ms-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-pulse rounded-full bg-primary align-middle" />
                        </p>
                      ) : (
                        <MarkdownMessage content={m.content} />
                      )
                    ) : (
                      <ThinkingIndicator label={t("thinking")} />
                    )}
                  </div>

                  {m.content && !isStreamingMsg && (
                    <button
                      onClick={() => copy(m.content, i)}
                      className="mt-1.5 inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-subtle-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      {copied === i ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-positive" />
                          {t("copied")}
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          {t("copy")}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Suggestions */}
          {empty && (
            <div className="ps-11">
              <p className="mb-2 text-xs font-medium text-subtle-foreground">
                {t("suggestionsTitle")}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-surface px-3.5 py-2 text-start text-sm text-foreground transition-colors hover:border-primary hover:bg-brand-soft"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-surface/60 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 focus-within:ring-2 focus-within:ring-ring"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoGrow(e.target);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder={t("placeholder")}
              className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none"
            />
            {streaming ? (
              <button
                type="button"
                onClick={stop}
                aria-label={t("stop")}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-foreground text-background transition-opacity hover:opacity-90"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label={t("send")}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:bg-primary-strong disabled:opacity-40"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            )}
          </form>
          <p className="mt-2 text-center text-xs text-subtle-foreground">{t("disclaimer")}</p>
        </div>
      </div>
    </div>
  );
}

/** Animated "thinking" state: staggered dots + a shimmering label. */
function ThinkingIndicator({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2 py-0.5">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary/70"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </span>
      <span className="animate-shimmer bg-[linear-gradient(90deg,var(--subtle-foreground)_0%,var(--foreground)_50%,var(--subtle-foreground)_100%)] bg-[length:200%_100%] bg-clip-text text-sm font-medium text-transparent">
        {label}
      </span>
    </span>
  );
}
