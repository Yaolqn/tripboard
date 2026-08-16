"use client";

import { Wallet } from "lucide-react";
import { ACTIVITY_TYPES, type Trip } from "@/types/trip";
import { TYPE_META, computeBudget } from "@/lib/trip-utils";
import { formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BudgetSummary({ trip }: { trip: Trip }) {
  const { t, dayCount, activityCount } = useI18n();
  const budget = computeBudget(trip);
  const { total, byType } = budget;

  return (
    <aside className="sticky top-20 hidden w-72 shrink-0 self-start pl-8 lg:block">
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-medium text-muted-foreground">
            {t("tripSummary")}
          </h3>
          <Wallet className="size-4 text-muted-foreground" />
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">{t("total")}</span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {total > 0 ? formatMoney(total, trip.currency) : "—"}
          </span>
        </div>

        {total === 0 ? (
          <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground">
            {t("noCostsHint")}
          </p>
        ) : (
          <div className="mt-4 space-y-2.5 border-t pt-4">
            {ACTIVITY_TYPES.map((type) => {
              const value = byType[type];
              if (!value) return null;
              const meta = TYPE_META[type];
              return (
                <div
                  key={type}
                  className="flex items-center justify-between gap-3 text-[13px]"
                >
                  <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                    <meta.icon className={cn("size-3.5 shrink-0", meta.accent)} />
                    <span className="truncate">{t(meta.labelKey)}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatMoney(value, trip.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          {t("countsLine")
            .replace("{a}", activityCount(budget.activityCount))
            .replace("{d}", dayCount(trip.days.length))}
        </div>
      </div>
    </aside>
  );
}
