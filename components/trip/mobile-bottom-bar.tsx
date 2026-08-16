"use client";

import { Plus } from "lucide-react";
import type { Trip } from "@/types/trip";
import { computeBudget } from "@/lib/trip-utils";
import { formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/** Sticky bottom bar on phones/tablets: running total + add button. */
export function MobileBottomBar({
  trip,
  onAdd,
}: {
  trip: Trip;
  onAdd: () => void;
}) {
  const { t } = useI18n();
  const { total } = computeBudget(trip);
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("total")}
          </div>
          <div className="truncate text-[15px] font-semibold tabular-nums">
            {total > 0 ? formatMoney(total, trip.currency) : t("noCosts")}
          </div>
        </div>
        <Button onClick={onAdd} className="shrink-0">
          <Plus />
          {t("addActivity")}
        </Button>
      </div>
    </div>
  );
}
