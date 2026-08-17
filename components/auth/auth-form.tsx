"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { signInWithEmail, signUpWithEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"email" | null>(null);

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

  return (
    <div className="space-y-5">
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
