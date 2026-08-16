"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import type { Trip } from "@/types/trip";
import { CURRENCIES } from "@/types/trip";
import { deleteTrip, duplicateTrip, getTrips, saveTrip } from "@/lib/storage";
import { formatDateRange, formatMoney } from "@/lib/format";
import { computeBudget } from "@/lib/trip-utils";
import { buildShareUrl, canShareAsLink } from "@/lib/share";
import { track } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";
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
import { Wordmark } from "@/components/trip/wordmark";

type DialogTarget =
  | { kind: "rename"; trip: Trip }
  | { kind: "delete"; trip: Trip }
  | null;

export default function MyTripsPage() {
  const router = useRouter();
  const { t, dayCount, activityCount } = useI18n();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [target, setTarget] = useState<DialogTarget>(null);

  const refresh = () => setTrips(getTrips());

  useEffect(() => {
    refresh();
  }, []);

  // rename dialog form state
  const [renameName, setRenameName] = useState("");
  const [renameDestination, setRenameDestination] = useState("");
  const [renameCurrency, setRenameCurrency] = useState("JPY");

  const openRename = (trip: Trip) => {
    setRenameName(trip.name);
    setRenameDestination(trip.destination);
    setRenameCurrency(trip.currency);
    setTarget({ kind: "rename", trip });
  };

  const saveRename = () => {
    if (!target || target.kind !== "rename") return;
    const updated: Trip = {
      ...target.trip,
      name: renameName.trim() || "My Trip",
      destination: renameDestination.trim(),
      currency: renameCurrency,
      updatedAt: Date.now(),
    };
    saveTrip(updated);
    refresh();
    setTarget(null);
    toast.success(t("tripUpdated"));
  };

  const handleDuplicate = (trip: Trip) => {
    const copy = duplicateTrip(trip.id);
    if (!copy) {
      toast.error("Couldn't duplicate the trip");
      return;
    }
    refresh();
    track("trip_duplicated");
    toast.success(t("duplicatedAs").replace("{name}", copy.name));
  };

  const handleDelete = () => {
    if (!target || target.kind !== "delete") return;
    deleteTrip(target.trip.id);
    refresh();
    track("trip_deleted");
    toast.success(t("tripDeleted"));
  };

  const handleShare = (trip: Trip) => {
    if (!canShareAsLink(trip)) {
      toast.error(t("shareTooLarge"), {
        description: t("shareTooLargeHint"),
      });
      return;
    }
    const url = buildShareUrl(trip);
    navigator.clipboard
      .writeText(url)
      .then(() => {
        track("trip_shared", { source: "my_trips" });
        toast.success(t("linkCopied"));
      })
      .catch(() => toast.error(t("copyFailed")));
  };

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
          <p className="mt-1.5 text-sm text-muted-foreground">{t("savedInBrowser")}</p>
        </div>
        <Button asChild size="sm">
          <Link href="/new">
            <Plus />
            {t("newTrip")}
          </Link>
        </Button>
      </div>

      {trips === null ? (
        <div className="mt-10 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-[110px] animate-pulse rounded-xl border bg-muted/40" />
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
          {trips.map((trip) => {
            const budget = computeBudget(trip);
            const meta = [
              dayCount(trip.days.length),
              activityCount(budget.activityCount),
              budget.total > 0 ? formatMoney(budget.total, trip.currency) : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <div
                key={trip.id}
                className="group flex items-stretch gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20"
              >
                <button
                  type="button"
                  onClick={() => router.push(`/trip/${trip.id}`)}
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
                      {formatDateRange(trip.startDate, trip.endDate)}
                    </div>
                    {meta && (
                      <div className="mt-1 text-xs tabular-nums text-muted-foreground/80">
                        {meta}
                      </div>
                    )}
                  </div>
                </button>

                <div className="flex shrink-0 flex-col items-center justify-center gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:inline-flex"
                    onClick={() => router.push(`/trip/${trip.id}`)}
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
                      <DropdownMenuItem onSelect={() => router.push(`/trip/${trip.id}`)}>
                        <MapPin />
                        {t("open")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleShare(trip)}>
                        <Share2 />
                        {t("share")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleDuplicate(trip)}>
                        <Copy />
                        {t("duplicate")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openRename(trip)}>
                        <Pencil />
                        {t("rename")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => setTarget({ kind: "delete", trip })}
                      >
                        <Trash2 />
                        {t("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}

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
            <Button onClick={saveRename}>{t("save")}</Button>
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
        onConfirm={handleDelete}
      />
    </div>
  );
}
