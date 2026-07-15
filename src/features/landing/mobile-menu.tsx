"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

/**
 * Mobile-only burger menu for the landing header. On phones the desktop nav and
 * the sign-in button are hidden, so this exposes navigation and the auth actions
 * (sign in / create account) behind a burger.
 */
export function LandingMobileMenu() {
  const t = useTranslations("landing");
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-label={t("navFeatures")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/15"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.div
              className="absolute end-0 top-full z-50 mt-2 w-56 rounded-2xl border border-white/15 bg-[#0a1f0d]/95 p-2 shadow-xl backdrop-blur-xl"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <a
                href="#preview"
                onClick={close}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
              >
                {t("navFeatures")}
              </a>
              <a
                href="#markets"
                onClick={close}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
              >
                {t("liveMarkets")}
              </a>
              <div className="my-1 h-px bg-white/10" />
              <Link
                href="/login"
                onClick={close}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-white hover:bg-white/10"
              >
                {t("signIn")}
              </Link>
              <Button asChild className="mt-1 w-full">
                <Link href="/register" onClick={close}>
                  {t("createAccount")}
                  <ArrowRight className="h-4 w-4 rtl-flip" />
                </Link>
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
