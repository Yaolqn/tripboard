"use client";

import type { Trip } from "@/types/trip";
import { formatISODateShort } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface DayChipsProps {
  trip: Trip;
  activeDayId: string;
  onSelect: (dayId: string) => void;
}

/** Mobile / small-screen horizontal day switcher. */
export function DayChips({ trip, activeDayId, onSelect }: DayChipsProps) {
  const { dayLabel } = useI18n();
  return (
    <div className="no-print sticky top-14 z-20 border-b bg-background/95 backdrop-blur md:hidden">
      <div className="tb-scroll-thin flex gap-2 overflow-x-auto px-4 py-3">
        {trip.days.map((day, i) => {
          const active = day.id === activeDayId;
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onSelect(day.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {dayLabel(i + 1)}
              <span className={active ? "opacity-70" : "opacity-60"}>
                {" "}
                · {formatISODateShort(day.date)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
