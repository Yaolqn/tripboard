"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Trip } from "@/types/trip";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { rowsToTrip, type TripRow } from "@/lib/data/supabase-rows";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { HeaderAuth, CreateTripButton } from "@/components/auth/header-auth";
import { ExploreGrid } from "@/components/explore/explore-grid";
import { Wordmark } from "@/components/trip/wordmark";

export default function ExplorePage() {
  const { t } = useI18n();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await supabase
          .from("trips")
          .select("*, trip_days(*, activities(*))")
          .eq("visibility", "public")
          .order("updated_at", { ascending: false })
          .limit(40);
        if (cancelled) return;
        const rows = (res.data ?? []) as unknown as TripRow[];
        setTrips(
          rows
            .map((row) => rowsToTrip(row))
            .filter((t): t is Trip => t !== null)
        );
      } catch {
        // ignore — empty grid with a friendly message
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <Link href="/">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <HeaderAuth />
          <CreateTripButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">{t("exploreTrips")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("exploreSub")}</p>
        <div className="mt-8">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-xl border bg-muted/40" />
              ))}
            </div>
          ) : (
            <ExploreGrid trips={trips} />
          )}
        </div>
      </main>
    </div>
  );
}
