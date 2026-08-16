"use client";

import type { Trip } from "@/types/trip";
import { formatISODateShort } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface DayNavProps {
  trip: Trip;
  activeDayId: string;
  onSelect: (dayId: string) => void;
}

/** Desktop / tablet day rail. */
export function DayNav({ trip, activeDayId, onSelect }: DayNavProps) {
  const { t, dayLabel } = useI18n();
  return (
    <aside className="sticky top-14 hidden max-h-[calc(100dvh-3.5rem)] w-52 shrink-0 overflow-y-auto border-r px-3 py-6 md:block">
      <p className="px-3 pb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {t("itinerary")}
      </p>
      <div className="space-y-0.5">
        {trip.days.map((day, i) => {
          const active = day.id === activeDayId;
          const hasItems = day.activities.length > 0;
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onSelect(day.id)}
              className={cn(
                "flex w-full items-baseline justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors",
                active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
              )}
            >
              <span
                className={cn(
                  "text-sm",
                  active ? "font-semibold" : "font-medium text-muted-foreground"
                )}
              >
                {dayLabel(i + 1)}
              </span>
              <span className="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                {hasItems && <span className="size-1 rounded-full bg-foreground/40" />}
                {formatISODateShort(day.date)}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
