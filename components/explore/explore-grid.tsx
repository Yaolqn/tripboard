"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { Trip } from "@/types/trip";
import { formatDateRange, formatMoney } from "@/lib/format";
import { computeBudget } from "@/lib/trip-utils";
import { useI18n } from "@/lib/i18n";

const DURATIONS = [
  { id: "1-3", key: "dur1to3", test: (n: number) => n >= 1 && n <= 3 },
  { id: "4-7", key: "dur4to7", test: (n: number) => n >= 4 && n <= 7 },
  { id: "8+", key: "dur8plus", test: (n: number) => n >= 8 },
] as const;

export function ExploreGrid({ trips }: { trips: Trip[] }) {
  const { t, dayCount, activityCount } = useI18n();
  const [destination, setDestination] = useState<string>("all");
  const [duration, setDuration] = useState<string>("all");

  const destinations = useMemo(
    () =>
      Array.from(
        new Set(trips.map((trip) => trip.destination).filter(Boolean))
      ).sort(),
    [trips]
  );

  const filtered = useMemo(() => {
    return trips.filter((trip) => {
      if (destination !== "all" && trip.destination !== destination) return false;
      if (duration !== "all") {
        const d = DURATIONS.find((x) => x.id === duration);
        if (d && !d.test(trip.days.length)) return false;
      }
      return true;
    });
  }, [trips, destination, duration]);

  const selectClass =
    "h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className={selectClass}
          aria-label={t("filterDestination")}
        >
          <option value="all">{t("all")} · {t("filterDestination")}</option>
          {destinations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className={selectClass}
          aria-label={t("filterDuration")}
        >
          <option value="all">{t("all")} · {t("filterDuration")}</option>
          {DURATIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {t(d.key)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-secondary">
            <MapPin className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium">{t("noPublicTrips")}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{t("noPublicTripsSub")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((trip) => {
            const budget = computeBudget(trip);
            return (
              <Link
                key={trip.id}
                href={`/trip/${trip.slug ?? trip.id}`}
                className="group flex flex-col rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
              >
                {trip.destination && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {trip.destination}
                  </p>
                )}
                <h2 className="mt-1.5 truncate text-lg font-semibold tracking-tight">
                  {trip.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {trip.startDate && trip.endDate
                    ? formatDateRange(trip.startDate, trip.endDate)
                    : ""}
                </p>
                <p className="mt-2 text-xs tabular-nums text-muted-foreground/80">
                  {dayCount(trip.days.length)} ·{" "}
                  {activityCount(budget.activityCount)}
                  {budget.total > 0 && ` · ${formatMoney(budget.total, trip.currency)}`}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  {t("viewTrip")}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
