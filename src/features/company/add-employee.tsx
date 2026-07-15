"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { UserPlus, X, Loader2, Copy, Check, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type Created = { email: string; name: string; tempPassword: string | null };

export function AddEmployee() {
  const t = useTranslations("company");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    spendLimit: "",
    initialFund: "",
    canSpend: true,
    canTopup: false,
  });

  function reset() {
    setForm({ name: "", email: "", title: "", spendLimit: "", initialFund: "", canSpend: true, canTopup: false });
    setError("");
    setCreated(null);
    setCopied(false);
  }

  function close() {
    setOpen(false);
    reset();
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(t("addError"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/company/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          title: form.title.trim() || undefined,
          spendLimit: form.spendLimit ? Number(form.spendLimit) : null,
          initialFund: form.initialFund ? Number(form.initialFund) : undefined,
          canSpend: form.canSpend,
          canTopup: form.canTopup,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error === "Email already registered" ? t("emailInUse") : data.error ?? t("addError"));
      setCreated({ email: data.email, name: form.name.trim(), tempPassword: data.tempPassword ?? null });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("addError"));
    } finally {
      setLoading(false);
    }
  }

  async function copyPassword() {
    if (!created?.tempPassword) return;
    try {
      await navigator.clipboard.writeText(created.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <UserPlus className="h-3.5 w-3.5" />
        {t("addEmployee")}
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <motion.div
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.div
              className="relative w-full max-w-md rounded-t-3xl border border-border bg-card p-5 shadow-xl sm:rounded-3xl"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">
                  {created ? t("tempPasswordTitle") : t("addEmployee")}
                </h2>
                <button
                  onClick={close}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
                  aria-label={t("cancel")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {created ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t("tempPasswordBody", { name: created.name })}
                  </p>
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-xs text-muted-foreground">{created.email}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-mono text-sm font-semibold text-foreground" dir="ltr">
                        <KeyRound className="h-4 w-4 text-primary" />
                        {created.tempPassword ?? "—"}
                      </span>
                      {created.tempPassword && (
                        <button
                          onClick={copyPassword}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-positive" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? t("copied") : t("copy")}
                        </button>
                      )}
                    </div>
                  </div>
                  <Button onClick={close} className="w-full">{t("done")}</Button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-3" noValidate>
                  <TextInput label={t("employeeName")} value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} autoFocus />
                  <TextInput label={t("employeeEmail")} type="email" dir="ltr" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
                  <TextInput label={t("employeeTitle")} value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput label={t("spendLimit")} dir="ltr" inputMode="numeric" value={form.spendLimit} onChange={(v) => setForm((f) => ({ ...f, spendLimit: v.replace(/[^\d.]/g, "") }))} />
                    <TextInput label={t("initialFund")} dir="ltr" inputMode="numeric" value={form.initialFund} onChange={(v) => setForm((f) => ({ ...f, initialFund: v.replace(/[^\d.]/g, "") }))} />
                  </div>
                  <Toggle label={t("canSpend")} hint={t("canSpendHint")} checked={form.canSpend} onChange={(v) => setForm((f) => ({ ...f, canSpend: v }))} />
                  <Toggle label={t("canTopup")} hint={t("canTopupHint")} checked={form.canTopup} onChange={(v) => setForm((f) => ({ ...f, canTopup: v }))} />
                  {error && <p className="text-sm text-negative">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("create")}
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function TextInput({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-start"
    >
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-surface-muted"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "start-[1.125rem]" : "start-0.5"}`}
        />
      </span>
    </button>
  );
}
