"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { CalendarX2, Link2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Trip } from "@/types/trip";
import { getTrip } from "@/lib/storage";
import {
  buildShareUrl,
  canShareAsLink,
  decodeLegacyTrip,
  decodeTrip,
  readLegacySharedTripFromHash,
} from "@/lib/share";
import { copyText } from "@/lib/clipboard";
import { formatDateRange } from "@/lib/format";
import { track } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ReadOnlyDay } from "@/components/trip/readonly-day";
import { Wordmark } from "@/components/trip/wordmark";

type ShareState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; trip: Trip; editable: boolean };

export default function SharedTripPage({
  params,
}: {
  params: Promise<{ payload: string }>;
}) {
  const { payload } = use(params);
  return <SharedTripView payload={payload} />;
}

function SharedTripView({ payload }: { payload: string }) {
  const { t, dayCount } = useI18n();
  const [state, setState] = useState<ShareState>({ status: "loading" });

  useEffect(() => {
    const fromPayload = decodeTrip(payload);
    if (fromPayload) {
      setState({ status: "ready", trip: fromPayload, editable: false });
      return;
    }
    // Legacy V0.1 links: /share/<id>#data=<base64url> or a stored trip id.
    const fromHash = readLegacySharedTripFromHash();
    if (fromHash) {
      setState({ status: "ready", trip: fromHash, editable: false });
      return;
    }
    const local = getTrip(payload) ?? (decodeLegacyTrip(payload) ? null : getTrip(payload));
    if (local) {
      setState({ status: "ready", trip: local, editable: true });
      return;
    }
    setState({ status: "missing" });
  }, [payload]);

  const copyLink = async (trip: Trip) => {
    if (!canShareAsLink(trip)) {
      toast.error(t("shareTooLarge"), { description: t("shareTooLargeHint") });
      return;
    }
    const ok = await copyText(buildShareUrl(trip));
    if (ok) {
      track("trip_shared", { source: "share_page" });
      toast.success(t("linkCopied"));
    } else {
      toast.error(t("copyFailed"));
    }
  };

  if (state.status === "loading") {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-8">
        <div className="h-8 w-36 animate-pulse rounded bg-muted" />
        <div className="mt-14 h-16 w-72 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-5 w-44 animate-pulse rounded bg-muted" />
        <div className="mt-12 space-y-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/60" />
          ))}
        </div>
      </div>
    );
  }

  if (state.status === "missing") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
          <CalendarX2 className="size-5 text-muted-foreground" />
        </div>
        <h1 className="mt-5 text-lg font-semibold tracking-tight">
          {t("shareInvalidTitle")}
        </h1>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {t("shareInvalidSub")}
        </p>
        <Button asChild className="mt-7">
          <Link href="/new">
            <Plus />
            {t("createYourOwnTrip")}
          </Link>
        </Button>
      </div>
    );
  }

  const { trip } = state;
  const dates = formatDateRange(trip.startDate, trip.endDate);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-5 py-5 sm:px-8">
        <Wordmark />
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <div className="no-print flex items-center gap-2 pl-2">
            {state.editable && (
              <Link
                href={`/trip/${trip.id}`}
                className="rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {t("editTrip")}
              </Link>
            )}
            <Link
              href="/my-trips"
              className="rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t("myTrips")}
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyLink(trip)}
              className="shrink-0 no-print"
            >
              <Link2 className="size-3.5" />
              {t("share")}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-24 sm:px-8">
        {/* magazine-style hero */}
        <div className="mt-14 animate-tb-rise sm:mt-20">
          {trip.destination && (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {trip.destination}
            </p>
          )}
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            {trip.name}
          </h1>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-muted-foreground">
            <span className="text-base sm:text-lg">{dates}</span>
            <span className="text-sm sm:text-base">·</span>
            <span className="text-sm sm:text-base">{dayCount(trip.days.length)}</span>
          </div>
        </div>

        <div className="mt-14 sm:mt-20">
          {trip.days.map((day, i) => (
            <div key={day.id} className={i > 0 ? "mt-4" : ""}>
              <ReadOnlyDay day={day} dayNumber={i + 1} currency={trip.currency} />
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t no-print">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-center px-5 py-6 text-[13px] text-muted-foreground sm:px-8">
          {t("createdWith")}
        </div>
      </footer>
    </div>
  );
}
