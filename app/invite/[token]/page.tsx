"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { cloudAcceptInvite, cloudGetInvite } from "@/lib/data/cloud";
import { track } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/components/auth/session-provider";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/trip/wordmark";

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { t } = useI18n();
  const { user } = useSession();
  const router = useRouter();

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "invalid" }
    | { status: "ready"; tripId: string; tripTitle: string; role: string }
  >({ status: "loading" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setState({ status: "invalid" });
      return;
    }
    cloudGetInvite(supabase, token)
      .then((info) => {
        if (!info) setState({ status: "invalid" });
        else
          setState({
            status: "ready",
            tripId: info.tripId,
            tripTitle: info.tripTitle,
            role: info.role,
          });
      })
      .catch(() => setState({ status: "invalid" }));
  }, [token]);

  const accept = async () => {
    if (state.status !== "ready") return;
    setBusy(true);
    try {
      const supabase = getBrowserSupabase();
      if (!supabase) return;
      const ok = await cloudAcceptInvite(supabase, token);
      if (ok) {
        track("invite_accepted");
        toast.success(t("invited"));
        router.push(`/trip/${state.tripId}`);
      } else {
        setState({ status: "invalid" });
      }
    } finally {
      setBusy(false);
    }
  };

  if (state.status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state.status === "invalid") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <Wordmark />
        <h1 className="mt-8 text-lg font-semibold tracking-tight">
          {t("inviteInvalid")}
        </h1>
        <Button asChild className="mt-7" variant="outline">
          <Link href="/">{t("goHome")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Wordmark />
      <h1 className="mt-8 text-lg font-semibold tracking-tight">
        {t("joinTrip").replace("{trip}", state.tripTitle)}
      </h1>
      <p className="mt-1.5 text-sm capitalize text-muted-foreground">
        {state.role === "editor" ? t("roleEditor") : t("roleViewer")}
      </p>

      {!user ? (
        <>
          <p className="mt-6 text-sm text-muted-foreground">{t("inviteSignedOut")}</p>
          <Button asChild className="mt-4">
            <Link href={`/login?next=/invite/${token}`}>{t("logIn")}</Link>
          </Button>
        </>
      ) : (
        <Button className="mt-6" onClick={() => void accept()} disabled={busy}>
          <UserPlus />
          {busy ? "…" : t("acceptInvitation")}
        </Button>
      )}
    </div>
  );
}
