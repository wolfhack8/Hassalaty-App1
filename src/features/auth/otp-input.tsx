"use client";

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

const LENGTH = 6;

export function OtpInput({
  label,
  value,
  onChange,
  onComplete,
  error,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function commit(next: string) {
    const cleaned = next.replace(/\D/g, "").slice(0, LENGTH);
    const wasComplete = value.length === LENGTH;
    onChange(cleaned);
    if (!wasComplete && cleaned.length === LENGTH) {
      onComplete?.(cleaned);
    }
  }

  function focusAt(index: number) {
    refs.current[index]?.focus();
    refs.current[index]?.select();
  }

  useEffect(() => {
    focusAt(0);
  }, []);

  function handleChange(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      const next = value.split("");
      next[index] = "";
      commit(next.join(""));
      return;
    }

    if (digits.length > 1) {
      const merged = (value.slice(0, index) + digits).replace(/\D/g, "").slice(0, LENGTH);
      commit(merged);
      focusAt(Math.min(merged.length, LENGTH - 1));
      return;
    }

    const next = value.split("");
    while (next.length < LENGTH) next.push("");
    next[index] = digits;
    commit(next.join(""));
    if (index < LENGTH - 1) focusAt(index + 1);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = value.split("");
      while (next.length < LENGTH) next.push("");

      if (next[index]) {
        next[index] = "";
        commit(next.join(""));
        return;
      }

      if (index > 0) {
        next[index - 1] = "";
        commit(next.join(""));
        focusAt(index - 1);
      }
      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    }

    if (e.key === "ArrowRight" && index < LENGTH - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    commit(pasted);
    focusAt(Math.min(pasted.length, LENGTH - 1));
  }

  return (
    <div className="block w-full">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <div className="grid w-full grid-cols-6 gap-2 sm:gap-2.5" dir="ltr">
        {Array.from({ length: LENGTH }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={index === 0 ? LENGTH : 1}
            value={value[index] ?? ""}
            disabled={disabled}
            aria-label={`${label} ${index + 1}`}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`h-[4.5rem] w-full rounded-xl border bg-surface text-center text-2xl font-semibold tabular-nums leading-none text-foreground transition-colors focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${error ? "border-negative" : "border-border"}`}
          />
        ))}
      </div>
      {error && <span className="mt-2 block text-xs text-negative">{error}</span>}
    </div>
  );
}
