"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import type { Activity, ActivityType, Trip } from "@/types/trip";
import { ACTIVITY_TYPES } from "@/types/trip";
import { computeBudget, TYPE_META } from "@/lib/trip-utils";
import { formatDateRange, formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { exportFileName, exportNodeToPng } from "@/lib/export";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Dot colors for the export canvas — inline hex, independent of the app theme. */
const TYPE_HEX: Record<ActivityType, string> = {
  transportation: "#0ea5e9",
  hotel: "#8b5cf6",
  food: "#f59e0b",
  attraction: "#10b981",
  shopping: "#ec4899",
  activity: "#6366f1",
  cafe: "#ea580c",
  other: "#a8a29e",
};

const STORY_MAX_ROWS = 7;
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

function ExportRow({
  activity,
  currency,
}: {
  activity: Activity;
  currency: string;
}) {
  return (
    <div className="flex items-start gap-6 py-3.5">
      <div className="w-32 shrink-0 pt-1 text-right text-[26px] font-medium tabular-nums text-[#71717a]">
        {activity.time || ""}
      </div>
      <div
        className="mt-[18px] h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: TYPE_HEX[activity.type] }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-6">
          <span className="text-[30px] font-semibold leading-snug text-[#18181b]">
            {activity.title}
          </span>
          {typeof activity.cost === "number" && (
            <span className="shrink-0 text-[26px] font-medium tabular-nums text-[#52525b]">
              {formatMoney(activity.cost, currency)}
            </span>
          )}
        </div>
        {activity.location && (
          <div className="mt-1 text-[24px] text-[#71717a]">{activity.location}</div>
        )}
        {activity.notes && (
          <div className="mt-1 text-[22px] leading-snug text-[#a1a1aa]">
            {activity.notes}
          </div>
        )}
      </div>
    </div>
  );
}

function BrandRow() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#18181b]">
        <svg viewBox="0 0 64 64" className="size-5">
          <path
            d="M32 12c-7.5 0-13.5 6.2-13.5 13.8C18.5 37.5 32 52 32 52s13.5-14.5 13.5-26.2C45.5 18.2 39.5 12 32 12z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="26" r="5.5" fill="#ffffff" />
        </svg>
      </span>
      <span className="text-[26px] font-semibold tracking-tight text-[#18181b]">
        TripBoard
      </span>
    </div>
  );
}

/**
 * Off-screen render targets for html-to-image. Only mounted while the export
 * dialog is open, and pinned behind everything (`-z-50`, no pointer events)
 * so it can never cover or intercept the UI.
 */
function ExportCanvas({
  trip,
  storyRef,
  longRef,
}: {
  trip: Trip;
  storyRef: React.RefObject<HTMLDivElement | null>;
  longRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { t, dayLabel, lang } = useI18n();
  const allActivities = trip.days.flatMap((d) => d.activities);
  const heroDay = trip.days.find((d) => d.activities.length > 0) ?? trip.days[0];
  const storyRows = heroDay.activities.slice(0, STORY_MAX_ROWS);
  const storyRemaining = heroDay.activities.length - storyRows.length;
  const empty = allActivities.length === 0;
  const dates = formatDateRange(trip.startDate, trip.endDate);
  const dest = trip.destination.toUpperCase();
  const fallbackDest = t("yourTrip");

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-[-30000px] top-0 -z-50"
    >
      {/* ── Story card · 1080×1920 ─────────────────────────────── */}
      <div
        ref={storyRef}
        style={{ width: STORY_WIDTH, height: STORY_HEIGHT }}
        className="relative flex flex-col overflow-hidden bg-white px-16 py-14"
      >
        <BrandRow />

        {empty ? (
          <div className="flex flex-1 flex-col items-start justify-center">
            <div className="text-[30px] font-medium uppercase tracking-[0.35em] text-[#71717a]">
              {dest || fallbackDest}
            </div>
            <div className="mt-6 text-[64px] font-semibold leading-[1.05] tracking-tight text-[#18181b]">
              {trip.name}
            </div>
            <div className="mt-6 text-[30px] text-[#71717a]">{dates}</div>
            <div className="mt-16 text-[26px] text-[#a1a1aa]">
              {t("emptyItinerary")}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1" />
            <div className="text-[30px] font-medium uppercase tracking-[0.35em] text-[#71717a]">
              {dest || fallbackDest}
            </div>
            <div className="mt-6 text-[92px] font-semibold leading-[1.04] tracking-[-0.02em] text-[#18181b]">
              {trip.name}
            </div>
            <div className="mt-6 text-[32px] text-[#71717a]">{dates}</div>

            <div className="mt-16 flex items-center gap-6">
              <span className="text-[24px] font-semibold uppercase tracking-[0.22em] text-[#18181b]">
                {dayLabel(1)}
              </span>
              <span className="h-px flex-1 bg-[#e4e4e7]" />
            </div>
            <div className="mt-4">
              {storyRows.map((a) => (
                <ExportRow key={a.id} activity={a} currency={trip.currency} />
              ))}
              {storyRemaining > 0 && (
                <div className="py-3 text-[24px] text-[#a1a1aa]">
                  {storyRemaining === 1 && lang !== "zh"
                    ? "+ 1 more activity"
                    : t("moreActivities").replace("{n}", String(storyRemaining))}
                </div>
              )}
            </div>
            <div className="flex-1" />
          </>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-[#e4e4e7] pt-6">
          <span className="text-[22px] text-[#a1a1aa]">{t("createdWith")}</span>
          <span className="text-[22px] text-[#a1a1aa]">{dates}</span>
        </div>
      </div>

      {/* ── Long image · 1080px wide ───────────────────────────── */}
      <div
        ref={longRef}
        style={{ width: STORY_WIDTH }}
        className="bg-white px-16 py-14"
      >
        <BrandRow />

        <div className="mt-16">
          <div className="text-[28px] font-medium uppercase tracking-[0.35em] text-[#71717a]">
            {dest || fallbackDest}
          </div>
          <div className="mt-5 text-[72px] font-semibold leading-[1.05] tracking-[-0.02em] text-[#18181b]">
            {trip.name}
          </div>
          <div className="mt-5 text-[30px] text-[#71717a]">{dates}</div>
        </div>

        <div className="mt-12">
          {trip.days.map((day, i) => {
            if (day.activities.length === 0) return null;
            return (
              <div key={day.id} className="mt-12 first:mt-0">
                <div className="flex items-center gap-6">
                  <span className="text-[26px] font-semibold uppercase tracking-[0.22em] text-[#18181b]">
                    {dayLabel(i + 1)}
                  </span>
                  <span className="h-px flex-1 bg-[#e4e4e7]" />
                </div>
                <div className="mt-4">
                  {day.activities.map((a) => (
                    <ExportRow key={a.id} activity={a} currency={trip.currency} />
                  ))}
                </div>
              </div>
            );
          })}
          {empty && (
            <div className="py-10 text-[26px] text-[#a1a1aa]">
              {t("emptyItinerary")}
            </div>
          )}

          {/* Budget */}
          {(() => {
            const budget = computeBudget(trip);
            if (budget.total <= 0) return null;
            const rows = ACTIVITY_TYPES.map((type) => ({
              type,
              value: budget.byType[type] ?? 0,
            })).filter((r) => r.value > 0);
            return (
              <div className="mt-16">
                <div className="flex items-center gap-6">
                  <span className="text-[26px] font-semibold uppercase tracking-[0.22em] text-[#18181b]">
                    {t("budget")}
                  </span>
                  <span className="h-px flex-1 bg-[#e4e4e7]" />
                </div>
                <div className="mt-4 flex items-baseline justify-between border-b border-[#e4e4e7] pb-4">
                  <span className="text-[24px] text-[#71717a]">{t("total")}</span>
                  <span className="text-[34px] font-semibold tabular-nums text-[#18181b]">
                    {formatMoney(budget.total, trip.currency)}
                  </span>
                </div>
                <div className="mt-2">
                  {rows.map((r) => (
                    <div
                      key={r.type}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-[22px] text-[#71717a]">
                        {t(TYPE_META[r.type].labelKey)}
                      </span>
                      <span className="text-[22px] font-medium tabular-nums text-[#52525b]">
                        {formatMoney(r.value, trip.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="mt-16 flex items-center justify-between border-t border-[#e4e4e7] pt-6">
          <span className="text-[22px] text-[#a1a1aa]">{t("createdWith")}</span>
          <span className="text-[22px] text-[#a1a1aa]">{dates}</span>
        </div>
      </div>
    </div>
  );
}

export function ExportDialog({
  open,
  onOpenChange,
  trip,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
}) {
  const { t } = useI18n();
  const storyRef = useRef<HTMLDivElement>(null);
  const longRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"story" | "long" | null>(null);

  const handleExport = async (variant: "story" | "long") => {
    const node = variant === "story" ? storyRef.current : longRef.current;
    if (!node) return;
    setBusy(variant);
    try {
      await exportNodeToPng(node, exportFileName(trip.name));
      track("trip_exported", { variant });
      toast.success(t("imageDownloaded"));
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setBusy(null);
    }
  };

  const optionBase =
    "flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors hover:border-foreground/25 hover:bg-accent/40 disabled:pointer-events-none disabled:opacity-60";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent sheetOnMobile className="sm:max-w-md">
          <DialogHeader className="pr-8">
            <DialogTitle>{t("exportTitle")}</DialogTitle>
            <DialogDescription>{t("exportDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5">
            <button
              type="button"
              className={cn(optionBase)}
              onClick={() => handleExport("story")}
              disabled={busy !== null}
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold">{t("storyCard")}</div>
                <div className="mt-0.5 text-[13px] text-muted-foreground">
                  {t("storyCardMeta")}
                </div>
              </div>
              {busy === "story" ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Download className="size-4 shrink-0 text-muted-foreground" />
              )}
            </button>

            <button
              type="button"
              className={cn(optionBase)}
              onClick={() => handleExport("long")}
              disabled={busy !== null}
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold">{t("fullItinerary")}</div>
                <div className="mt-0.5 text-[13px] text-muted-foreground">
                  {t("fullItineraryMeta")}
                </div>
              </div>
              {busy === "long" ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Download className="size-4 shrink-0 text-muted-foreground" />
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {open && <ExportCanvas trip={trip} storyRef={storyRef} longRef={longRef} />}
    </>
  );
}
