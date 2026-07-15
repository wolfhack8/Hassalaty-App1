"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  Building2,
  Hash,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { OtpInput } from "@/features/auth/otp-input";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import ColorBends from "@/components/react-bits/color-bends";
import { markWelcomeToast } from "@/lib/auth/welcome-toast";

type Step = "form" | "otp";
type LoginMethod = "password" | "otp";
type OtpPurpose = "verify" | "login";
type AccountKind = "personal" | "commercial";

const DEMO_EMAIL = "fahad@naqd.sa";
const DEMO_PASSWORD = "demo1234";

function Field({
  icon,
  label,
  error,
  passwordToggle,
  showPasswordLabel,
  hidePasswordLabel,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode;
  label: string;
  error?: string;
  passwordToggle?: boolean;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const resolvedType = passwordToggle ? (passwordVisible ? "text" : "password") : type;

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 start-3.5 my-auto flex items-center text-muted-foreground">
          {icon}
        </span>
        <input
          {...props}
          type={resolvedType}
          className={`h-12 w-full rounded-xl border border-border bg-surface ps-11 text-sm text-foreground placeholder:text-subtle-foreground focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${passwordToggle ? "pe-11" : "pe-4"}`}
        />
        {passwordToggle && (
          <button
            type="button"
            onClick={() => setPasswordVisible((v) => !v)}
            className="absolute inset-y-0 end-3 flex items-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label={passwordVisible ? hidePasswordLabel : showPasswordLabel}
          >
            {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </span>
      {error && <span className="mt-1 block text-xs text-negative">{error}</span>}
    </label>
  );
}

function SocialButton({
  name,
  srLabel,
  children,
  onClick,
  disabled,
}: {
  /** Short brand name shown on the button, e.g. "Apple". */
  name: string;
  /** Full accessible label, e.g. "Continue with Apple". */
  srLabel: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={srLabel}
      className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
    >
      {children}
      <span className="whitespace-nowrap">{name}</span>
    </button>
  );
}

export function AuthScreen({
  mode,
  socialProviders = { google: false, apple: false },
}: {
  mode: "login" | "register";
  socialProviders?: { google: boolean; apple: boolean };
}) {
  const t = useTranslations("auth");
  const tDemo = useTranslations("demo");
  const locale = useLocale();
  const isRegister = mode === "register";

  /** Locale-prefixed destination after auth, honoring a safe `next` param.
   * Reads from the live URL (only called in client event handlers), so it
   * needs no useSearchParams / Suspense boundary. */
  function destination() {
    const raw =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next") ?? ""
        : "";
    const safe = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
    return `/${locale}${safe}`;
  }

  /**
   * Full-page navigation after a successful sign-in. A hard load (rather than a
   * client-side push) guarantees the just-set session cookie is sent on the
   * next request, so middleware/server components see the session and don't
   * bounce back to /login — a race that surfaces on production HTTPS.
   */
  function goAfterAuth() {
    window.location.assign(destination());
  }

  const [step, setStep] = useState<Step>("form");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [accountKind, setAccountKind] = useState<AccountKind>("personal");
  const [form, setForm] = useState({
    name: "",
    email: isRegister ? "" : DEMO_EMAIL,
    phone: "",
    password: isRegister ? "" : DEMO_PASSWORD,
    identifier: "",
    companyName: "",
    crNumber: "",
  });
  const [otp, setOtp] = useState("");
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>("verify");
  const [challengeId, setChallengeId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSocial(provider: "google" | "apple") {
    setLoading(true);
    setApiError("");
    try {
      await signIn(provider, { callbackUrl: destination() });
    } catch {
      setApiError(t("oauthError"));
      setLoading(false);
    }
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    const next: Record<string, string> = {};

    if (isRegister) {
      if (!form.name.trim()) next.name = t("required");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = t("invalidEmail");
      if (form.password.length < 6) next.password = t("shortPassword");
      if (accountKind === "commercial" && !form.companyName.trim())
        next.companyName = t("companyNameRequired");
    } else if (loginMethod === "password") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = t("invalidEmail");
      if (!form.password) next.password = t("required");
    } else {
      if (!form.identifier.trim()) next.identifier = t("required");
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      if (isRegister) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            locale,
            accountType: accountKind === "commercial" ? "COMMERCIAL" : "PERSONAL",
            companyName: accountKind === "commercial" ? form.companyName : undefined,
            crNumber: accountKind === "commercial" ? form.crNumber : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? t("errorGeneric"));
        setChallengeId(data.challengeId);
        setMaskedEmail(data.maskedEmail);
        setOtpPurpose("verify");
        setStep("otp");
      } else if (loginMethod === "password") {
        const res = await fetch("/api/auth/login/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            locale,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error === "Invalid credentials" ? t("invalidCredentials") : data.error ?? t("errorGeneric"));

        if (data.needsVerification) {
          setChallengeId(data.challengeId);
          setMaskedEmail(data.maskedEmail ?? "");
          setOtp("");
          setOtpPurpose("verify");
          setStep("otp");
          return;
        }

        const result = await signIn("password", {
          email: form.email,
          password: form.password,
          redirect: false,
        });
        if (result?.error) throw new Error(t("invalidCredentials"));
        void fetch("/api/activity/login", { method: "POST", keepalive: true }).catch(() => {});
        markWelcomeToast();
        goAfterAuth();
      } else {
        const res = await fetch("/api/auth/login/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: form.identifier, locale }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? t("errorGeneric"));
        if (data.challengeId) {
          setChallengeId(data.challengeId);
          setMaskedEmail(data.maskedEmail ?? "");
          setOtpPurpose("login");
          setStep("otp");
        }
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtpCode(code: string) {
    if (loading) return;
    setApiError("");
    if (code.length !== 6) {
      setErrors({ otp: t("invalidOtp") });
      return;
    }
    setLoading(true);
    try {
      const result = await signIn("otp", {
        challengeId,
        code,
        redirect: false,
      });
      if (result?.error) throw new Error(t("invalidOtp"));
      void fetch("/api/activity/login", { method: "POST", keepalive: true }).catch(() => {});
      markWelcomeToast(t(otpPurpose === "login" ? "welcomeBack" : "verificationSuccess"));
      goAfterAuth();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : t("invalidOtp"));
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    await verifyOtpCode(otp);
  }

  async function resendOtp() {
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, locale }),
      });
      if (!res.ok) throw new Error(t("errorGeneric"));
    } catch (err) {
      setApiError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#06140a] lg:block">
        <ColorBends
          className="h-full w-full"
          style={{ position: "absolute", inset: 0 }}
          colors={["#052e12", "#16a34a", "#52d400", "#0a1f0d"]}
          speed={0.18}
          scale={1.1}
          transparent={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06140a] via-transparent to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo className="[&_span]:text-white" />
          <div>
            <h2 className="max-w-md text-balance text-4xl font-semibold leading-tight tracking-tight">
              {t("heroTitle")}
            </h2>
            <p className="mt-3 max-w-sm text-white/70">{t("heroSubtitle")}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <ShieldCheck className="h-4 w-4" />
            {t("secure")}
          </div>
        </div>
      </div>

      <div className="relative flex flex-col">
        <div className="flex items-center justify-between p-5 pt-[calc(1.25rem_+_env(safe-area-inset-top))] sm:p-6 sm:pt-[calc(1.5rem_+_env(safe-area-inset-top))]">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <LocaleSwitcher compact />
            <ThemeSwitcher />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-6">
          <div className="w-full max-w-sm">
            {step === "otp" ? (
              <>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("otpTitle")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("otpSentToEmail", { email: maskedEmail || form.email })}
                </p>
                <form onSubmit={submitOtp} className="mt-6 space-y-4" noValidate>
                  <OtpInput
                    label={t("otpCode")}
                    value={otp}
                    onChange={(code) => {
                      setOtp(code);
                      if (errors.otp) setErrors((prev) => ({ ...prev, otp: "" }));
                    }}
                    onComplete={verifyOtpCode}
                    error={errors.otp}
                    disabled={loading}
                  />
                  {apiError && <p className="text-sm text-negative">{apiError}</p>}
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("verifyOtp")}
                  </Button>
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={loading}
                    className="w-full text-center text-sm font-medium text-primary-strong hover:underline"
                  >
                    {t("resend")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("form");
                      setOtp("");
                      setApiError("");
                    }}
                    className="w-full text-center text-sm text-muted-foreground hover:underline"
                  >
                    {t("back")}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {isRegister ? t("registerTitle") : t("loginTitle")}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isRegister ? t("registerSubtitle") : t("loginSubtitle")}
                </p>

                {(socialProviders.google || socialProviders.apple) && (
                  <>
                    <div className="mt-6 flex gap-3">
                      {socialProviders.apple && (
                        <SocialButton
                          name="Apple"
                          srLabel={t("continueApple")}
                          onClick={() => handleSocial("apple")}
                          disabled={loading}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                            <path d="M17.05 12.04c-.02-2.05 1.68-3.03 1.75-3.08-.95-1.39-2.43-1.58-2.96-1.6-1.26-.13-2.46.74-3.1.74-.64 0-1.62-.72-2.67-.7-1.37.02-2.64.8-3.35 2.03-1.43 2.48-.37 6.15 1.02 8.16.68.98 1.49 2.08 2.55 2.04 1.02-.04 1.41-.66 2.65-.66 1.23 0 1.58.66 2.66.64 1.1-.02 1.79-1 2.46-1.98.78-1.13 1.1-2.23 1.12-2.29-.02-.01-2.15-.83-2.17-3.27zM15.04 6.03c.56-.68.94-1.62.84-2.56-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.56-.86 2.48.9.07 1.83-.46 2.39-1.14z" />
                          </svg>
                        </SocialButton>
                      )}
                      {socialProviders.google && (
                        <SocialButton
                          name="Google"
                          srLabel={t("continueGoogle")}
                          onClick={() => handleSocial("google")}
                          disabled={loading}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                        </SocialButton>
                      )}
                    </div>

                    <div className="my-5 flex items-center gap-3 text-xs text-subtle-foreground">
                      <span className="h-px flex-1 bg-border" />
                      {t("or")}
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  </>
                )}

                {isRegister && (
                  <div className="mb-4 grid grid-cols-2 gap-2.5">
                    {(["personal", "commercial"] as const).map((kind) => {
                      const active = accountKind === kind;
                      const Icon = kind === "personal" ? User : Building2;
                      return (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => setAccountKind(kind)}
                          aria-pressed={active}
                          className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-start transition-colors ${active ? "border-primary bg-primary/5" : "border-border bg-surface hover:bg-accent"}`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${active ? "text-primary-strong" : "text-muted-foreground"}`} />
                            <span className="text-sm font-semibold text-foreground">
                              {t(kind === "personal" ? "accountPersonal" : "accountCommercial")}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t(kind === "personal" ? "accountPersonalDesc" : "accountCommercialDesc")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {!isRegister && (
                  <div className="mb-4 flex rounded-xl border border-border bg-surface p-1">
                    <button
                      type="button"
                      onClick={() => setLoginMethod("password")}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${loginMethod === "password" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      {t("loginMethodPassword")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginMethod("otp")}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${loginMethod === "otp" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      {t("loginMethodOtp")}
                    </button>
                  </div>
                )}

                <form onSubmit={submitForm} className="space-y-4" noValidate>
                  {isRegister && (
                    <Field
                      icon={<User className="h-4 w-4" />}
                      label={t("name")}
                      placeholder={t("namePlaceholder")}
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      error={errors.name}
                      autoComplete="name"
                    />
                  )}

                  {isRegister && accountKind === "commercial" && (
                    <>
                      <Field
                        icon={<Building2 className="h-4 w-4" />}
                        label={t("companyName")}
                        placeholder={t("companyNamePlaceholder")}
                        value={form.companyName}
                        onChange={(e) => set("companyName", e.target.value)}
                        error={errors.companyName}
                        autoComplete="organization"
                      />
                      <Field
                        icon={<Hash className="h-4 w-4" />}
                        label={t("crNumber")}
                        dir="ltr"
                        inputMode="numeric"
                        placeholder={t("crNumberPlaceholder")}
                        value={form.crNumber}
                        onChange={(e) => set("crNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      />
                    </>
                  )}

                  {!isRegister && loginMethod === "otp" ? (
                    <Field
                      icon={<Mail className="h-4 w-4" />}
                      label={t("identifier")}
                      placeholder={t("identifierPlaceholder")}
                      value={form.identifier}
                      onChange={(e) => set("identifier", e.target.value)}
                      error={errors.identifier}
                      dir="ltr"
                    />
                  ) : (
                    <Field
                      icon={<Mail className="h-4 w-4" />}
                      label={t("email")}
                      type="email"
                      dir="ltr"
                      placeholder={isRegister ? t("emailPlaceholder") : t("demoEmail")}
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      error={errors.email}
                      autoComplete="email"
                    />
                  )}

                  {isRegister && (
                    <Field
                      icon={<Phone className="h-4 w-4" />}
                      label={t("phone")}
                      dir="ltr"
                      inputMode="numeric"
                      maxLength={11}
                      placeholder={t("phonePlaceholder")}
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 11))}
                      autoComplete="tel"
                    />
                  )}

                  {(isRegister || loginMethod === "password") && (
                    <Field
                      icon={<Lock className="h-4 w-4" />}
                      label={t("password")}
                      type="password"
                      passwordToggle
                      showPasswordLabel={t("showPassword")}
                      hidePasswordLabel={t("hidePassword")}
                      placeholder={isRegister ? t("passwordPlaceholder") : t("demoPassword")}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      error={errors.password}
                      autoComplete={isRegister ? "new-password" : "current-password"}
                    />
                  )}

                  {!isRegister && (
                    <div className="flex justify-end">
                      <Link href="/demo" className="text-sm font-medium text-primary-strong hover:underline">
                        {tDemo("tryDemoLink")}
                      </Link>
                    </div>
                  )}

                  {apiError && <p className="text-sm text-negative">{apiError}</p>}

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {isRegister ? t("createAccount") : loginMethod === "otp" ? t("sendCode") : t("signIn")}
                        <ArrowRight className="h-4 w-4 rtl-flip" />
                      </>
                    )}
                  </Button>
                </form>

                {isRegister && (
                  <p className="mt-4 text-center text-xs text-subtle-foreground">{t("terms")}</p>
                )}

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {isRegister ? t("haveAccount") : t("noAccount")}{" "}
                  <Link
                    href={isRegister ? "/login" : "/register"}
                    className="font-semibold text-primary-strong hover:underline"
                    locale={locale}
                  >
                    {isRegister ? t("goLogin") : t("goRegister")}
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
