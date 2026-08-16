"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SiteFooter } from "@/components/site-footer";
import { Wordmark } from "@/components/trip/wordmark";

/** Shared layout for the simple informational pages (about/privacy/terms). */
export function SimplePage({ title, body }: { title: string; body: string }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>
        <Wordmark />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
          {body}
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
