"use client";

import { PartyPopper } from "lucide-react";
import { toast } from "sonner";

export function showWelcomeToast(message: string) {
  toast.success(message, {
    icon: (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <PartyPopper className="h-5 w-5" strokeWidth={2.25} aria-hidden />
      </span>
    ),
    duration: 4500,
    classNames: {
      toast:
        "!min-w-[280px] !rounded-2xl !border-2 !border-primary/50 !bg-surface !text-foreground !shadow-xl !ring-2 !ring-primary/20 !px-4 !py-3.5",
      title: "!text-sm !font-semibold !text-foreground",
      icon: "!self-center",
    },
  });
}
