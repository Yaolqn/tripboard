"use client";

import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Compact EN/中文 toggle; click switches to the other language. */
export function LanguageToggle({ className }: { className?: string }) {
  const { lang, toggle, t } = useI18n();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("switchLanguage")}
      title={t("switchLanguage")}
      className={cn(
        "inline-flex h-8 shrink-0 select-none items-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className
      )}
    >
      <Globe className="size-3.5" />
      {lang === "en" ? "EN" : "中文"}
    </button>
  );
}
