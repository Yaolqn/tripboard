"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { AuthForm } from "@/components/auth/auth-form";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { Wordmark } from "@/components/trip/wordmark";

export default function SignupPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>
        <LanguageToggle />
      </div>

      <div className="mt-14 flex items-center justify-center">
        <Wordmark />
      </div>
      <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight">
        {t("createYourAccount")}
      </h1>
      <div className="mt-8">
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
