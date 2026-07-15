"use client";

import { useRef, useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useChildHome } from "./child-home-provider";

type Msg = { role: "user" | "assistant"; content: string };

const COPY = {
  en: {
    fab: "Ask Hassalaty AI",
    title: "Hassalaty AI",
    greeting: "Hi {name}! Ask me about your points, saving, or what to spend on. 🪙",
    placeholder: "Type a question…",
    error: "Something went wrong — try again.",
  },
  ar: {
    fab: "اسأل مساعد نقد",
    title: "مساعد حصالتي",
    greeting: "هلا {name}! اسألني عن نقاطك، أو الادخار، أو وش تصرف عليه. 🪙",
    placeholder: "اكتب سؤالك…",
    error: "صار خطأ — حاول مرة ثانية.",
  },
} as const;

/**
 * Floating chat bubble available across the whole `/child` area (mounted
 * once in `child/layout.tsx`), talking to the kid-safe streaming endpoint at
 * `/api/family/assistant`. Client-side streaming consumption mirrors the
 * adult `AssistantScreen` in `features/assistant/assistant-screen.tsx`.
 */
export function KidAssistantWidget() {
  const { locale, firstName } = useChildHome();
  const t = COPY[locale];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const conversationIdRef = useRef<string | null>(null);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;

    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/family/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, locale, conversationId: conversationIdRef.current }),
      });
      const cid = res.headers.get("X-Conversation-Id");
      if (cid) conversationIdRef.current = cid;
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
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: t.error };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t.fab}
        className="fixed bottom-6 end-6 z-40 flex items-center gap-2 rounded-full bg-brand px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-xl shadow-brand/30 transition-transform hover:scale-105 active:scale-95"
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-brand opacity-40" />
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">{t.fab}</span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={t.title} className="sm:max-w-sm">
        <div className="flex h-[70vh] max-h-[560px] flex-col sm:h-[520px]">
          <div className="flex items-center gap-2.5 border-b border-border pb-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-primary-strong">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <p className="text-sm font-semibold text-foreground">{t.title}</p>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto py-3">
            <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-surface-muted px-3.5 py-2.5 text-sm text-foreground">
              {t.greeting.replace("{name}", firstName)}
            </div>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ms-auto rounded-tr-none bg-brand text-primary-foreground"
                    : "rounded-tl-none bg-surface-muted text-foreground"
                }`}
              >
                {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 border-t border-border pt-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              disabled={streaming}
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rtl-flip" />}
            </Button>
          </form>
        </div>
      </Dialog>
    </>
  );
}
