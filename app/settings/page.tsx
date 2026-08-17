"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Download, LogOut } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { signOut } from "@/lib/auth";
import { importLocalTrips } from "@/lib/data";
import * as storage from "@/lib/storage";
import { track } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { Wordmark } from "@/components/trip/wordmark";

export default function SettingsPage() {
  const { user } = useSession();
  const { t } = useI18n();
  const router = useRouter();
  const [localCount, setLocalCount] = useState(0);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setLocalCount(storage.getTrips().length);
  }, []);

  const handleImport = async () => {
    setImporting(true);
    try {
      const n = await importLocalTrips();
      if (n > 0) {
        track("trip_imported", { count: n });
        toast.success(t("tripsSynced"));
        setLocalCount(0);
      } else {
        toast(t("nothingToImport"));
      }
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <Wordmark />
        </div>
      </div>

      <h1 className="mt-12 text-2xl font-semibold tracking-tight">{t("settings")}</h1>

      <div className="mt-8 space-y-6">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-medium">{t("email")}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{user?.email ?? "—"}</p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-medium">{t("importFromDevice")}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {localCount > 0
              ? `${t("foundLocalTrips")} (${localCount})`
              : t("nothingToImport")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={handleImport}
            disabled={importing || localCount === 0}
          >
            <Download />
            {importing ? "…" : t("importAll")}
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={async () => {
            await signOut();
            toast.success(t("signedOut"));
            router.push("/");
            router.refresh();
          }}
        >
          <LogOut />
          {t("signOut")}
        </Button>
      </div>
    </div>
  );
}
