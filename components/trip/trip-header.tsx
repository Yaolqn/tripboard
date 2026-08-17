"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Link2,
  Pencil,
  Settings,
  Share2,
  Trash2,
  UserPlus,
} from "lucide-react";
import type { Trip, TripVisibility, ThemeId } from "@/types/trip";
import { CURRENCIES, THEMES, VISIBILITIES, COVERS } from "@/types/trip";
import { formatDateRange } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { TKey } from "@/lib/strings";
import { ensureSlug } from "@/lib/data";
import { cloudCreateInvite } from "@/lib/data/cloud";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { useSession } from "@/components/auth/session-provider";
import { copyText } from "@/lib/clipboard";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
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

const VIS_KEYS: Record<TripVisibility, TKey> = {
  private: "visPrivate",
  unlisted: "visUnlisted",
  public: "visPublic",
};
const VIS_DESC_KEYS: Record<TripVisibility, TKey> = {
  private: "visPrivateDesc",
  unlisted: "visUnlistedDesc",
  public: "visPublicDesc",
};
const THEME_KEYS: Record<string, TKey> = {
  minimal: "themeMinimal",
  classic: "themeClassic",
  mono: "themeMono",
  japan: "themeJapan",
  pastel: "themePastel",
  retro: "themeRetro",
  luxury: "themeLuxury",
};

export function TripHeader({
  trip,
  onUpdate,
  onDelete,
  onOpenShare,
  onOpenExport,
}: TripHeaderProps) {
  const { t } = useI18n();
  const { user } = useSession();
  const configured = isSupabaseConfigured();
  const isCloud = Boolean(user && configured);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [focusName, setFocusName] = useState(false);

  const [name, setName] = useState(trip.name);
  const [destination, setDestination] = useState(trip.destination);
  const [currency, setCurrency] = useState(trip.currency);
  const [visibility, setVisibility] = useState<TripVisibility>(
    trip.visibility ?? "private"
  );
  const [theme, setTheme] = useState<ThemeId>(trip.theme ?? "minimal");
  const [cover, setCover] = useState<string>(trip.cover ?? "");
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [inviteBusy, setInviteBusy] = useState(false);

  const openSettings = (focusNameField: boolean) => {
    setName(trip.name);
    setDestination(trip.destination);
    setCurrency(trip.currency);
    setVisibility(trip.visibility ?? "private");
    setTheme(trip.theme ?? "minimal");
    setCover(trip.cover ?? "");
    setFocusName(focusNameField);
    setSettingsOpen(true);
  };

  useEffect(() => {
    if (settingsOpen && focusName) nameRef.current?.focus();
  }, [settingsOpen, focusName]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      let slug = trip.slug;
      if (visibility !== "private" && !slug) {
        slug = await ensureSlug(trip);
      }
      onUpdate((t) => ({
        ...t,
        name: name.trim() || "My Trip",
        destination: destination.trim(),
        currency,
        visibility,
        theme,
        cover: cover || undefined,
        slug,
      }));
      if (visibility === "public") track("trip_published");
      setSettingsOpen(false);
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    setInviteBusy(true);
    try {
      const supabase = getBrowserSupabase();
      if (!supabase) return;
      const invite = await cloudCreateInvite(supabase, trip.id, inviteRole);
      if (invite) {
        const ok = await copyText(invite.url);
        if (ok) toast.success(t("linkCopied"));
        else toast.error(t("copyFailed"));
      } else {
        toast.error(t("saveFailed"));
      }
      setInviteOpen(false);
    } finally {
      setInviteBusy(false);
    }
  };

  const publicUrl =
    typeof window !== "undefined" && trip.slug
      ? `${window.location.origin}/trip/${trip.slug}`
      : null;

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
              {isCloud && (
                <DropdownMenuItem onSelect={() => setInviteOpen(true)}>
                  <UserPlus />
                  {t("invite")}
                </DropdownMenuItem>
              )}
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

      {/* Settings dialog (name/destination/currency + visibility/theme/cover) */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent sheetOnMobile className="sm:max-w-lg">
          <DialogHeader className="pr-8">
            <DialogTitle>{t("settingsTitle")}</DialogTitle>
            <DialogDescription>{t("settingsDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
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

            {isCloud && (
              <>
                <div className="space-y-2">
                  <Label>{t("visibility")}</Label>
                  <div className="space-y-1.5">
                    {VISIBILITIES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVisibility(v)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                          visibility === v
                            ? "border-foreground/50 bg-accent"
                            : "border-border hover:bg-accent/40"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 size-4 shrink-0 rounded-full border",
                            visibility === v
                              ? "border-[6px] border-foreground"
                              : "border-muted-foreground/40"
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            {t(VIS_KEYS[v])}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                            {t(VIS_DESC_KEYS[v])}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {visibility !== "private" && publicUrl && (
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                        {publicUrl}
                      </span>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={t("copyPublicLink")}
                        onClick={async () => {
                          if (await copyText(publicUrl)) {
                            track("trip_shared", { source: "settings" });
                            toast.success(t("linkCopied"));
                          }
                        }}
                      >
                        <Link2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t("theme")}</Label>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {THEMES.map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        disabled={th.pro}
                        onClick={() => setTheme(th.id)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors",
                          theme === th.id
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                          th.pro && "opacity-70"
                        )}
                      >
                        {t(THEME_KEYS[th.id])}
                        {th.pro && (
                          <span className="rounded bg-muted px-1 py-px text-[9px] font-semibold uppercase tracking-wide">
                            {t("pro")}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {["japan", "pastel", "retro", "luxury"].includes(theme) && (
                    <p className="text-xs text-amber-600">{t("premiumThemes")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t("cover")}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCover("")}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        !cover
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground"
                      )}
                    >
                      —
                    </button>
                    {COVERS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCover(c)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors",
                          cover === c
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background text-muted-foreground"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={() => void saveSettings()} disabled={saving}>
              {saving ? "…" : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent sheetOnMobile className="sm:max-w-md">
          <DialogHeader className="pr-8">
            <DialogTitle>{t("invitePeople")}</DialogTitle>
            <DialogDescription>{t("inviteLink")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{t("invite")}</Label>
            <Select
              value={inviteRole}
              onValueChange={(v) => setInviteRole(v as "editor" | "viewer")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">{t("roleEditor")}</SelectItem>
                <SelectItem value="viewer">{t("roleViewer")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setInviteOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={() => void handleInvite()}
              disabled={inviteBusy}
            >
              <UserPlus />
              {inviteBusy ? "…" : t("copyInviteLink")}
            </Button>
          </div>
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
