"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronRight,
  Cloud,
  Copy,
  HardDrive,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import type { Trip, TripStatus } from "@/types/trip";
import { CURRENCIES } from "@/types/trip";
import { deleteTrip, getTrips, saveTrip, duplicateTrip } from "@/lib/data";
import * as storage from "@/lib/storage";
import { formatDateRange, formatMoney } from "@/lib/format";
import { computeBudget } from "@/lib/trip-utils";
import { buildShareUrl, canShareAsLink } from "@/lib/share";
import { tripProgress } from "@/lib/data/supabase-rows";
import { track } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";
import type { TKey } from "@/lib/strings";
import { useSession } from "@/components/auth/session-provider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageToggle } from "@/components/ui/language-toggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/trip/confirm-dialog";
import { ImportDialog } from "@/components/trip/import-dialog";
import { Wordmark } from "@/components/trip/wordmark";
import { WorldTravelMap, type WorldTravelPlace } from "@/components/map/world-travel-map";

type DialogTarget =
  | { kind: "rename"; trip: Trip }
  | { kind: "delete"; trip: Trip }
  | null;

const STATUS_KEYS: Record<TripStatus, TKey> = {
  draft: "statusDraft",
  planning: "statusPlanning",
  ready: "statusReady",
  completed: "statusCompleted",
};

function TripCard({
  trip,
  onOpen,
  onRename,
  onDelete,
  onDuplicate,
  onShare,
}: {
  trip: Trip;
  onOpen: (t: Trip) => void;
  onRename: (t: Trip) => void;
  onDelete: (t: Trip) => void;
  onDuplicate: (t: Trip) => void;
  onShare: (t: Trip) => void;
}) {
  const { t, dayCount, activityCount } = useI18n();
  const budget = computeBudget(trip);
  const progress = tripProgress(trip);
  const meta = [
    dayCount(trip.days.length),
    activityCount(budget.activityCount),
    budget.total > 0 ? formatMoney(budget.total, trip.currency) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="group flex items-stretch gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20">
      <button
        type="button"
        onClick={() => onOpen(trip)}
        className="flex min-w-0 flex-1 items-center gap-4 text-left"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <MapPin className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          {trip.destination && (
            <div className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {trip.destination}
            </div>
          )}
          <div className="truncate text-[15px] font-semibold tracking-tight">
            {trip.name}
          </div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            {trip.startDate && trip.endDate
              ? formatDateRange(trip.startDate, trip.endDate)
              : "—"}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground/80">
            {meta && <span className="tabular-nums">{meta}</span>}
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">
              {t(STATUS_KEYS[trip.status ?? "draft"])}
              {progress > 0 &&
                progress < 100 &&
                ` · ${t("percentPlanned").replace("{n}", String(progress))}`}
            </span>
          </div>
        </div>
      </button>

      <div className="flex shrink-0 flex-col items-center justify-center gap-2 sm:flex-row">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => onOpen(trip)}
        >
          {t("open")}
          <ChevronRight className="size-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t("moreOptions")}
              className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onOpen(trip)}>
              <MapPin />
              {t("open")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onShare(trip)}>
              <Share2 />
              {t("share")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(trip)}>
              <Copy />
              {t("duplicate")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onRename(trip)}>
              <Pencil />
              {t("rename")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => onDelete(trip)}
            >
              <Trash2 />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function MyTripsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: sessionLoading } = useSession();
  const configured = isSupabaseConfigured();

  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState(false);
  const [localCount, setLocalCount] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [target, setTarget] = useState<DialogTarget>(null);

  const load = useCallback(async () => {
    setError(false);
    setTrips(null);
    try {
      const all = await getTrips();
      setTrips(all);
    } catch {
      setError(true);
      setTrips([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, user]);

  useEffect(() => {
    if (user && !sessionLoading) {
      const n = storage.getTrips().length;
      setLocalCount(n);
      if (n > 0) setShowImport(true);
    } else if (!user) {
      setLocalCount(storage.getTrips().length);
      setShowImport(false);
    }
  }, [user, sessionLoading]);

  // rename form state
  const [renameName, setRenameName] = useState("");
  const [renameDestination, setRenameDestination] = useState("");
  const [renameCurrency, setRenameCurrency] = useState("JPY");

  const openRename = (trip: Trip) => {
    setRenameName(trip.name);
    setRenameDestination(trip.destination);
    setRenameCurrency(trip.currency);
    setTarget({ kind: "rename", trip });
  };

  const saveRename = async () => {
    if (!target || target.kind !== "rename") return;
    const updated: Trip = {
      ...target.trip,
      name: renameName.trim() || "My Trip",
      destination: renameDestination.trim(),
      currency: renameCurrency,
      updatedAt: Date.now(),
    };
    try {
      await saveTrip(updated);
      await load();
      toast.success(t("tripUpdated"));
    } catch {
      toast.error(t("saveFailed"));
    }
    setTarget(null);
  };

  const handleDuplicate = async (trip: Trip) => {
    try {
      const copy = await duplicateTrip(trip.id);
      await load();
      track("trip_duplicated");
      toast.success(t("duplicatedAs").replace("{name}", copy?.name ?? ""));
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  const handleDelete = async () => {
    if (!target || target.kind !== "delete") return;
    try {
      await deleteTrip(target.trip.id);
      await load();
      track("trip_deleted");
      toast.success(t("tripDeleted"));
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  const handleShare = async (trip: Trip) => {
    if (!canShareAsLink(trip)) {
      toast.error(t("shareTooLarge"), { description: t("shareTooLargeHint") });
      return;
    }
    const url = buildShareUrl(trip);
    try {
      await navigator.clipboard.writeText(url);
      track("trip_shared", { source: "my_trips" });
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (trips ?? []).filter(
    (trip) => !trip.endDate || trip.endDate >= today
  );
  const past = (trips ?? []).filter(
    (trip) => trip.endDate && trip.endDate < today
  );
  const travelPlaces: WorldTravelPlace[] = (trips ?? []).flatMap((trip) =>
    trip.days.flatMap((day) =>
      day.activities.flatMap((activity) =>
        activity.place
          ? [{
              id: activity.place.id,
              name: activity.place.name,
              coords: { lng: activity.place.longitude, lat: activity.place.latitude },
              status: trip.status === "completed" ? "visited" : "planned",
              country: activity.place.country,
              detail: activity.place.formattedAddress,
              tripId: trip.id,
              tripName: trip.name,
            }]
          : []
      )
    )
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-8">
      <header className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <Wordmark />
        </div>
      </header>

      <div className="mt-12 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("myTrips")}</h1>
          <p className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground">
            {user ? (
              <>
                <Cloud className="size-3.5" />
                {t("tripsSynced")}
              </>
            ) : (
              <>
                <HardDrive className="size-3.5" />
                {t("savedInBrowser")}
              </>
            )}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/new">
            <Plus />
            {t("newTrip")}
          </Link>
        </Button>
      </div>

      {!user && configured && (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3">
          <p className="text-[13px] text-muted-foreground">{t("signInToSync")}</p>
          <Button asChild size="sm" variant="outline">
            <Link href="/login">{t("logIn")}</Link>
          </Button>
        </div>
      )}

      {error ? (
        <div className="mt-14 flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
          <p className="text-sm font-medium">{t("errorTitle")}</p>
          <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">
            {t("errorDesc")}
          </p>
          <Button className="mt-5" size="sm" onClick={() => void load()}>
            {t("reload")}
          </Button>
        </div>
      ) : trips === null ? (
        <div className="mt-10 space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-[110px] animate-pulse rounded-xl border bg-muted/40"
            />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="mt-14 flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <MapPin className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-5 text-sm font-medium">{t("noTripsYet")}</p>
          <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            {t("noTripsSub")}
          </p>
          <Button asChild className="mt-6" size="sm">
            <Link href="/new">
              <Plus />
              {t("createTrip")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {travelPlaces.length > 0 && (
            <WorldTravelMap
              places={travelPlaces}
              className="h-[300px] sm:h-[400px]"
              emptyMessage="Map is unavailable. Configure the map provider to enable maps."
            />
          )}
          {upcoming.length > 0 && (
            <>
              <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t("upcoming")}
              </h2>
              {upcoming.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onOpen={(trip) => router.push(`/trip/${trip.id}`)}
                  onRename={openRename}
                  onDelete={(trip) => setTarget({ kind: "delete", trip })}
                  onDuplicate={(trip) => void handleDuplicate(trip)}
                  onShare={(trip) => void handleShare(trip)}
                />
              ))}
            </>
          )}
          {past.length > 0 && (
            <>
              <h2 className="px-1 pt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t("past")}
              </h2>
              {past.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onOpen={(trip) => router.push(`/trip/${trip.id}`)}
                  onRename={openRename}
                  onDelete={(trip) => setTarget({ kind: "delete", trip })}
                  onDuplicate={(trip) => void handleDuplicate(trip)}
                  onShare={(trip) => void handleShare(trip)}
                />
              ))}
            </>
          )}

          <Button
            asChild
            variant="outline"
            className="w-full border-dashed text-muted-foreground hover:text-foreground"
          >
            <Link href="/new">
              <Plus />
              {t("newTrip")}
            </Link>
          </Button>
        </div>
      )}

      {/* Rename dialog */}
      <Dialog
        open={target?.kind === "rename"}
        onOpenChange={(open) => !open && setTarget(null)}
      >
        <DialogContent sheetOnMobile className="sm:max-w-md">
          <DialogHeader className="pr-8">
            <DialogTitle>{t("editTripTitle")}</DialogTitle>
            <DialogDescription>{t("editTripDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="tb-ren-name">{t("tripName")}</Label>
              <Input
                id="tb-ren-name"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tb-ren-dest">{t("destination")}</Label>
              <Input
                id="tb-ren-dest"
                value={renameDestination}
                onChange={(e) => setRenameDestination(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("currency")}</Label>
              <Select value={renameCurrency} onValueChange={setRenameCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)}>
              {t("cancel")}
            </Button>
            <Button onClick={() => void saveRename()}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={target?.kind === "delete"}
        onOpenChange={(open) => !open && setTarget(null)}
        title={t("deleteTripTitle")}
        description={
          target?.kind === "delete"
            ? t("deleteTripDesc").replace("{name}", target.trip.name)
            : ""
        }
        confirmLabel={t("deleteTripMenu")}
        onConfirm={() => void handleDelete()}
      />

      {/* localStorage → cloud import prompt */}
      <ImportDialog
        open={showImport && localCount > 0}
        onOpenChange={setShowImport}
        onImported={() => {
          setLocalCount(0);
          void load();
        }}
      />
    </div>
  );
}
