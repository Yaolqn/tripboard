"use client";

import type { Day } from "@/types/trip";
import { TYPE_META } from "@/lib/trip-utils";
import { formatFull, formatMoney, formatWeekday, parseISODate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Read-only day section — the shared visual language for the landing-page
 * demo and the public share page. Reuses the same TYPE_META icons/dots as
 * the editor timeline.
 */
export function ReadOnlyDay({
  day,
  dayNumber,
  currency,
}: {
  day: Day;
  dayNumber: number;
  currency: string;
}) {
  const { t, dayLabel } = useI18n();
  const date = parseISODate(day.date);

  return (
    <section>
      <div className="flex items-baseline gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">
          {dayLabel(dayNumber)}
        </span>
        <span className="text-sm text-muted-foreground">
          {formatWeekday(date)} · {formatFull(date)}
        </span>
      </div>
      <div className="mt-2 mb-7 h-px bg-border" />

      {day.activities.length === 0 ? (
        <p className="mb-9 -mt-2 text-sm italic text-muted-foreground/70">
          {t("nothingPlanned")}
        </p>
      ) : (
        day.activities.map((a) => {
          const meta = TYPE_META[a.type];
          return (
            <div key={a.id} className="flex gap-5 py-2.5">
              <div className="w-14 shrink-0 pt-[5px] text-right text-sm tabular-nums text-muted-foreground">
                {a.time || ""}
              </div>
              <div className="relative w-px shrink-0 self-stretch bg-border/80">
                <span
                  className={cn(
                    "absolute left-1/2 top-[8px] size-[7px] -translate-x-1/2 rounded-full",
                    meta.dot
                  )}
                />
              </div>
              <div className="min-w-0 flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <meta.icon className={cn("size-4 shrink-0", meta.accent)} />
                  <span className="truncate text-[15px] font-medium">{a.title}</span>
                </div>
                {a.location && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.location}</p>
                )}
                {a.notes && (
                  <p className="mt-1 text-sm leading-snug text-muted-foreground/90">
                    {a.notes}
                  </p>
                )}
                {typeof a.cost === "number" && (
                  <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                    {formatMoney(a.cost, currency)}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
