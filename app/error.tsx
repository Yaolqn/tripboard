"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/trip/wordmark";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Wordmark />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
          <AlertTriangle className="size-5 text-muted-foreground" />
        </div>
        <h1 className="mt-5 text-lg font-semibold tracking-tight">
          {t("errorTitle")}
        </h1>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {t("errorDesc")}
        </p>
        <div className="mt-7 flex gap-2">
          <Button variant="outline" onClick={reset}>
            <RotateCcw />
            {t("reload")}
          </Button>
          <Button asChild>
            <Link href="/">{t("goHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
