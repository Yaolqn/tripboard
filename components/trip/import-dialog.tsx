"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Trip } from "@/types/trip";
import * as storage from "@/lib/storage";
import { importLocalTrips } from "@/lib/data";
import { track } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Shows when a signed-in user still has trips in localStorage:
 * "We found trips saved on this device. Import them to your account?"
 */
export function ImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const { t, dayCount } = useI18n();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setTrips(storage.getTrips());
  }, [open]);

  const handleImport = async () => {
    setBusy(true);
    try {
      const { imported, total } = await importLocalTrips();
      if (imported > 0) {
        track("trip_imported", { count: imported });
        toast.success(t("tripsSynced"));
        onImported();
        onOpenChange(false);
      } else if (total > 0) {
        // storage had trips but nothing made it to the cloud — surface it
        toast.error(t("saveFailed"));
      } else {
        toast(t("nothingToImport"));
        onOpenChange(false);
      }
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent sheetOnMobile className="sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>{t("foundLocalTrips")}</DialogTitle>
          <DialogDescription>{t("importThem")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {trips.slice(0, 6).map((trip) => (
            <div
              key={trip.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <span className="truncate font-medium">{trip.name}</span>
              <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                {dayCount(trip.days.length)}
              </span>
            </div>
          ))}
          {trips.length > 6 && (
            <p className="text-xs text-muted-foreground">+{trips.length - 6} …</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
            {t("notNow")}
          </Button>
          <Button className="flex-1" onClick={handleImport} disabled={busy}>
            {busy ? "…" : t("importAll")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
