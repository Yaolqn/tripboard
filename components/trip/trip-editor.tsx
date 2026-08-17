"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarX2, CloudOff, Plus } from "lucide-react";
import type { Activity } from "@/types/trip";
import { useTrip } from "@/hooks/use-trip";
import { createActivity, insertActivity } from "@/lib/trip-utils";
import {
  formatISODateFull,
  formatISODateShort,
  formatWeekday,
  parseISODate,
} from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { deleteTrip } from "@/lib/data";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TripHeader } from "@/components/trip/trip-header";
import { DayNav } from "@/components/trip/day-nav";
import { DayChips } from "@/components/trip/day-chips";
import { Timeline, moveActivity } from "@/components/trip/timeline";
import {
  ActivityEditor,
  type ActivityDraft,
} from "@/components/trip/activity-editor";
import { EmptyDay } from "@/components/trip/empty-day";
import { BudgetSummary } from "@/components/trip/budget-summary";
import { MobileBottomBar } from "@/components/trip/mobile-bottom-bar";
import { ShareDialog } from "@/components/trip/share-dialog";
import { ExportDialog } from "@/components/trip/export-dialog";
import { ConfirmDialog } from "@/components/trip/confirm-dialog";

export function TripEditor({ id }: { id: string }) {
  const router = useRouter();
  const { trip, update, offline, mode } = useTrip(id);
  const { t, dayLabel } = useI18n();

  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ open: boolean; activity: Activity | null }>(
    { open: false, activity: null }
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    activity: Activity;
    dayNumber: number;
  } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Keep the active day valid whenever the trip (re)loads.
  useEffect(() => {
    if (trip && trip !== "loading" && trip.days.length > 0) {
      setActiveDayId((prev) =>
        prev && trip.days.some((d) => d.id === prev) ? prev : trip.days[0].id
      );
    }
  }, [trip]);

  if (trip === "loading") return <EditorSkeleton />;
  if (!trip) return <TripMissing />;

  const activeDay = trip.days.find((d) => d.id === activeDayId) ?? trip.days[0];
  const activeDayIndex = trip.days.findIndex((d) => d.id === activeDay.id);
  const dayNumber = activeDayIndex + 1;
  const dayHeading = `${dayLabel(dayNumber)} · ${formatISODateShort(activeDay.date)}`;

  /* ── activity mutations (optimistic, cloud debounced in useTrip) ── */

  const handleSaveActivity = (draft: ActivityDraft) => {
    const editing = editor.activity;
    update((t) => ({
      ...t,
      days: t.days.map((d) => {
        if (d.id !== activeDay.id) return d;
        if (editing) {
          return {
            ...d,
            activities: d.activities.map((a) =>
              a.id === editing.id ? { ...a, ...draft, id: a.id } : a
            ),
          };
        }
        return insertActivity(d, createActivity(draft));
      }),
    }));
    setEditor({ open: false, activity: null });
    if (!editing) track("activity_added");
    toast.success(
      editing
        ? t("activityUpdated")
        : t("addedToDay").replace("{day}", dayLabel(dayNumber))
    );
  };

  const handleDuplicate = (activity: Activity) => {
    update((t) => ({
      ...t,
      days: t.days.map((d) => {
        if (d.id !== activeDay.id) return d;
        const idx = d.activities.findIndex((a) => a.id === activity.id);
        if (idx === -1) return d;
        const copy: Activity = {
          ...activity,
          id: createActivity().id,
          createdAt: Date.now(),
        };
        return {
          ...d,
          activities: [
            ...d.activities.slice(0, idx + 1),
            copy,
            ...d.activities.slice(idx + 1),
          ],
        };
      }),
    }));
    toast.success(t("activityDuplicated"));
  };

  const confirmDeleteActivity = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    update((t) => ({
      ...t,
      days: t.days.map((d) => ({
        ...d,
        activities: d.activities.filter((a) => a.id !== target.activity.id),
      })),
    }));
    toast.success(t("activityDeleted"));
  };

  const handleReorder = (fromId: string, toId: string) => {
    update((t) => ({
      ...t,
      days: t.days.map((d) =>
        d.id === activeDay.id
          ? { ...d, activities: moveActivity(d.activities, fromId, toId) }
          : d
      ),
    }));
  };

  const handleDeleteTrip = async () => {
    try {
      await deleteTrip(id);
      track("trip_deleted");
      toast.success(t("tripDeleted"));
      router.push("/my-trips");
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  /* ── render ─────────────────────────────────────────────────── */

  return (
    <div className="min-h-dvh">
      <TripHeader
        trip={trip}
        onUpdate={update}
        onDelete={() => void handleDeleteTrip()}
        onOpenShare={() => setShareOpen(true)}
        onOpenExport={() => setExportOpen(true)}
      />

      {offline && mode === "cloud" && (
        <div className="sticky top-14 z-20 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800">
          <CloudOff className="mr-1.5 inline size-3.5" />
          {t("offline")}
        </div>
      )}

      <div className="mx-auto flex w-full max-w-6xl items-start">
        <DayNav trip={trip} activeDayId={activeDay.id} onSelect={setActiveDayId} />

        <main className="min-w-0 flex-1">
          <DayChips trip={trip} activeDayId={activeDay.id} onSelect={setActiveDayId} />

          <div className="mx-auto w-full max-w-xl px-4 pb-32 pt-8 sm:px-6 lg:pb-20">
            <div key={activeDay.id} className="animate-tb-day-switch">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {dayLabel(dayNumber)}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatWeekday(parseISODate(activeDay.date))} ·{" "}
                    {formatISODateFull(activeDay.date)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="no-print hidden md:inline-flex"
                  onClick={() => setEditor({ open: true, activity: null })}
                >
                  <Plus />
                  {t("addActivity")}
                </Button>
              </div>

              <Separator className="mt-6" />

              {activeDay.activities.length > 0 ? (
                <Timeline
                  day={activeDay}
                  currency={trip.currency}
                  onEdit={(a) => setEditor({ open: true, activity: a })}
                  onDuplicate={handleDuplicate}
                  onDelete={(a) => setDeleteTarget({ activity: a, dayNumber })}
                  onReorder={handleReorder}
                />
              ) : (
                <EmptyDay onAdd={() => setEditor({ open: true, activity: null })} />
              )}
            </div>
          </div>
        </main>

        <BudgetSummary trip={trip} />
      </div>

      <MobileBottomBar
        trip={trip}
        onAdd={() => setEditor({ open: true, activity: null })}
      />

      {/* dialogs */}
      <ActivityEditor
        open={editor.open}
        onOpenChange={(open) => setEditor({ open, activity: editor.activity })}
        activity={editor.activity}
        currency={trip.currency}
        dayLabel={dayHeading}
        onSave={handleSaveActivity}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("deleteActivityTitle")}
        description={
          deleteTarget
            ? t("deleteActivityDesc")
                .replace("{title}", deleteTarget.activity.title)
                .replace("{day}", dayLabel(deleteTarget.dayNumber))
            : ""
        }
        confirmLabel={t("delete")}
        onConfirm={confirmDeleteActivity}
      />
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        trip={trip}
        onExport={() => {
          setShareOpen(false);
          setExportOpen(true);
        }}
      />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} trip={trip} />
    </div>
  );
}

/* ── loading / missing states ─────────────────────────────────── */

function EditorSkeleton() {
  const { t } = useI18n();
  return (
    <div className="min-h-dvh">
      <div className="flex h-14 items-center gap-3 border-b px-4 sm:px-6">
        <div className="size-8 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-44 animate-pulse rounded bg-muted" />
        <div className="ml-auto h-8 w-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="mx-auto max-w-xl px-4 pt-10 sm:px-6">
        <p className="text-sm text-muted-foreground">{t("loadingYourTrip")}</p>
        <div className="mt-3 h-7 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-8 space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TripMissing() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
        <CalendarX2 className="size-5 text-muted-foreground" />
      </div>
      <h1 className="mt-5 text-lg font-semibold tracking-tight">{t("tripNotFound")}</h1>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
        {t("tripNotFoundSub")}
      </p>
      <div className="mt-7 flex gap-2">
        <Button asChild variant="outline">
          <Link href="/my-trips">{t("myTrips")}</Link>
        </Button>
        <Button asChild>
          <Link href="/new">
            <Plus />
            {t("createTrip")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
