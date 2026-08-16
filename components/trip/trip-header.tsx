"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Pencil,
  Settings,
  Share2,
  Trash2,
} from "lucide-react";
import type { Trip } from "@/types/trip";
import { CURRENCIES } from "@/types/trip";
import { formatDateRange } from "@/lib/format";
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

interface TripHeaderProps {
  trip: Trip;
  onUpdate: (mutator: (t: Trip) => Trip) => void;
  onDelete: () => void;
  onOpenShare: () => void;
  onOpenExport: () => void;
}

export function TripHeader({
  trip,
  onUpdate,
  onDelete,
  onOpenShare,
  onOpenExport,
}: TripHeaderProps) {
  const { t } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [focusName, setFocusName] = useState(false);

  const [name, setName] = useState(trip.name);
  const [destination, setDestination] = useState(trip.destination);
  const [currency, setCurrency] = useState(trip.currency);
  const nameRef = useRef<HTMLInputElement>(null);

  const openSettings = (focusNameField: boolean) => {
    setName(trip.name);
    setDestination(trip.destination);
    setCurrency(trip.currency);
    setFocusName(focusNameField);
    setSettingsOpen(true);
  };

  useEffect(() => {
    if (settingsOpen && focusName) nameRef.current?.focus();
  }, [settingsOpen, focusName]);

  const saveSettings = () => {
    onUpdate((t) => ({
      ...t,
      name: name.trim() || "My Trip",
      destination: destination.trim(),
      currency,
    }));
    setSettingsOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link
          href="/my-trips"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={t("backToMyTrips")}
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold tracking-tight">
            {trip.name}
          </div>
          <div className="hidden truncate text-xs text-muted-foreground sm:block">
            {trip.destination
              ? `${trip.destination} · ${formatDateRange(trip.startDate, trip.endDate)}`
              : formatDateRange(trip.startDate, trip.endDate)}
          </div>
        </div>

        <div className="no-print flex items-center gap-2 sm:gap-3">
          <LanguageToggle className="hidden sm:inline-flex" />

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenShare}
            className="shrink-0"
          >
            <Share2 className="size-3.5" />
            <span className="hidden sm:inline">{t("share")}</span>
          </Button>
          <Button size="sm" onClick={onOpenExport} className="shrink-0">
            <Download className="size-3.5" />
            <span className="hidden sm:inline">{t("export")}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                aria-label={t("moreOptions")}
              >
                <Settings className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => openSettings(true)}>
                <Pencil />
                {t("renameTrip")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openSettings(false)}>
                <Settings />
                {t("tripSettings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 />
                {t("deleteTripMenu")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Settings / rename dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent sheetOnMobile className="sm:max-w-md">
          <DialogHeader className="pr-8">
            <DialogTitle>{t("settingsTitle")}</DialogTitle>
            <DialogDescription>{t("settingsDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="tb-set-name">{t("tripName")}</Label>
              <Input
                id="tb-set-name"
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("defaultTripName")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tb-set-dest">{t("destination")}</Label>
              <Input
                id="tb-set-dest"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={t("phDestination")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
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
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={saveSettings}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteTripTitle")}
        description={t("deleteTripDesc").replace("{name}", trip.name)}
        confirmLabel={t("deleteTripMenu")}
        onConfirm={onDelete}
      />
    </header>
  );
}
