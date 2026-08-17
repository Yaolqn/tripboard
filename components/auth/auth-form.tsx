"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm font-medium">{t("authNotConfigured")}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {t("authNotConfiguredSub")}
        </p>
      </div>
    );
  }

  const validate = (): boolean => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("invalidEmail"));
      return false;
    }
    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return false;
    }
    setError(null);
    return true;
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy("email");
    try {
      if (mode === "login") {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setError(t("authError"));
          return;
        }
        track("login", { method: "email" });
        toast.success(t("signedIn"));
        router.push("/my-trips");
        router.refresh();
      } else {
        const { error, needsConfirmation } = await signUpWithEmail(email, password);
        if (error) {
          setError(t("signupError"));
          return;
        }
        track("signup", { method: "email" });
        if (needsConfirmation) {
          toast.success(t("checkEmail"));
        } else {
          toast.success(t("signedIn"));
          router.push("/my-trips");
          router.refresh();
        }
      }
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    setBusy("google");
    try {
      await signInWithGoogle("/my-trips");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="lg"
        onClick={handleGoogle}
        disabled={busy !== null}
      >
        {busy === "google" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
            />
          </svg>
        )}
        {t("continueWithGoogle")}
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {t("or")}
        </span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleEmail} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="auth-email">{t("email")}</Label>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="auth-password">{t("password")}</Label>
          <Input
            id="auth-password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={busy !== null}>
          {busy === "email" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : mode === "login" ? (
            t("signInBtn")
          ) : (
            t("createAccountBtn")
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            {t("dontHaveAccount")}{" "}
            <Link href="/signup" className="font-medium text-foreground hover:underline">
              {t("createOne")}
            </Link>
          </>
        ) : (
          <>
            {t("haveAccount")}{" "}
            <Link href="/login" className="font-medium text-foreground hover:underline">
              {t("signInInstead")}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
