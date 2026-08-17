"use client";

import { useEffect, useState } from "react";
import type { Activity, ActivityType } from "@/types/trip";
import { ACTIVITY_TYPES, currencyInfo } from "@/types/trip";
import { TYPE_META } from "@/lib/trip-utils";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ActivityDraft {
  title: string;
  time: string;
  type: ActivityType;
  location: string;
  cost?: number;
  notes: string;
  url: string;
}

interface ActivityEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null means "create a new activity" */
  activity: Activity | null;
  currency: string;
  dayLabel: string;
  onSave: (draft: ActivityDraft) => void;
}

export function ActivityEditor({
  open,
  onOpenChange,
  activity,
  currency,
  dayLabel,
  onSave,
}: ActivityEditorProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<ActivityType>("other");
  const [location, setLocation] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");
  const [titleError, setTitleError] = useState(false);

  // Re-seed the form whenever the dialog opens for a different activity.
  useEffect(() => {
    if (!open) return;
    setTitle(activity?.title ?? "");
    setTime(activity?.time ?? "");
    setType(activity?.type ?? "other");
    setLocation(activity?.location ?? "");
    setCost(activity?.cost != null ? String(activity.cost) : "");
    setNotes(activity?.notes ?? "");
    setUrl(activity?.url ?? "");
    setTitleError(false);
  }, [open, activity]);

  const handleSave = () => {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    const parsedCost = cost.trim() === "" ? undefined : Number(cost);
    onSave({
      title: title.trim(),
      time,
      type,
      location: location.trim(),
      cost: parsedCost !== undefined && isFinite(parsedCost) && parsedCost > 0
        ? parsedCost
        : undefined,
      notes: notes.trim(),
      url: url.trim(),
    });
  };

  const symbol = currencyInfo(currency).symbol;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        sheetOnMobile
        className="flex max-h-[92dvh] flex-col overflow-hidden p-0 sm:max-h-[85vh]"
      >
        <div className="flex items-center justify-between gap-4 border-b px-5 pb-4 pt-5 pr-12 sm:px-6">
          <div>
            <DialogTitle className="text-[15px]">
              {activity ? t("editActivityTitle") : t("addActivityTitle")}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs">{dayLabel}</DialogDescription>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="tb-title">{t("title")}</Label>
              <Input
                id="tb-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError && e.target.value.trim()) setTitleError(false);
                }}
                placeholder={t("phTitle")}
                autoFocus
                className={cn(titleError && "border-destructive focus-visible:ring-destructive/50")}
              />
              {titleError && (
                <p className="text-xs text-destructive">{t("errTitleRequired")}</p>
              )}
            </div>

            {/* Time & Cost: stacked on small screens (native time input has a
                large intrinsic width that overlaps a narrow neighbor column). */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tb-time">{t("time")}</Label>
                <Input
                  id="tb-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tb-cost">
                  {t("costCurrency").replace("{currency}", currency)}
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {symbol}
                  </span>
                  <Input
                    id="tb-cost"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("type")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {ACTIVITY_TYPES.map((typeKey) => {
                  const meta = TYPE_META[typeKey];
                  const selected = type === typeKey;
                  return (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => setType(typeKey)}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      )}
                    >
                      <meta.icon className="size-3.5" />
                      {t(meta.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tb-location">{t("location")}</Label>
              <Input
                id="tb-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("phLocation")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tb-url">{t("link")}</Label>
              <Input
                id="tb-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tb-notes">{t("notes")}</Label>
              <Textarea
                id="tb-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("phNotes")}
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t bg-muted/40 px-5 py-4 sm:px-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave}>
            {activity ? t("saveChanges") : t("addToItinerary")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
