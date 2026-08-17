"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  ListChecks,
  Map,
  Plus,
  Share2,
} from "lucide-react";
import { DEMO_CARDS, buildDemoTrip, createDemoTrip } from "@/lib/demo";
import { addDays, formatDateRange, todayISO } from "@/lib/format";
import { track } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { HeaderAuth, CreateTripButton } from "@/components/auth/header-auth";
import { SiteFooter } from "@/components/site-footer";
import { ReadOnlyDay } from "@/components/trip/readonly-day";
import { Wordmark } from "@/components/trip/wordmark";

export default function LandingPage() {
  const router = useRouter();
  const { t, dayCount } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const demoDates = useMemo(
    () =>
      Object.fromEntries(
        DEMO_CARDS.map((c) => {
          const start = todayISO();
          return [c.key, formatDateRange(start, addDays(start, c.days - 1))];
        })
      ),
    []
  );

  // Real itinerary data rendered with the real read-only timeline UI.
  // Built after mount so dates (derived from "today") never differ between
  // server and client renders.
  const demo = useMemo(() => (mounted ? buildDemoTrip("tokyo") : null), [mounted]);

  const openDemo = async (key: string) => {
    const trip = await createDemoTrip(key);
    if (!trip) {
      toast.error("Couldn't create the example trip");
      return;
    }
    track("trip_created", { source: "landing_demo", key });
    toast.success(t("addedToTrips").replace("{name}", trip.name));
    router.push(`/trip/${trip.id}`);
  };

  const features = [
    { icon: CalendarDays, title: t("featPlanTitle"), desc: t("featPlanDesc") },
    { icon: ListChecks, title: t("featOrganizeTitle"), desc: t("featOrganizeDesc") },
    { icon: Share2, title: t("featShareTitle"), desc: t("featShareDesc") },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <Wordmark />
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <HeaderAuth />
          <CreateTripButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 sm:px-8">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="flex flex-col items-center py-20 text-center sm:py-28">
          <h1 className="max-w-2xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            {t("hero1")}
            <br />
            <span className="text-muted-foreground">{t("hero2")}</span>
          </h1>
          <p className="mt-6 max-w-md text-balance text-base text-muted-foreground sm:text-lg">
            {t("heroSub")}
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/new">
                <Plus />
                {t("createTrip")}
              </Link>
            </Button>
            <Button size="lg" variant="outline" onClick={() => openDemo("tokyo")}>
              {t("viewDemo")}
            </Button>
          </div>
          <p className="mt-6 text-[13px] text-muted-foreground/80">
            {t("savedLocally")}
          </p>
        </section>

        {/* ── Features ─────────────────────────────────────────── */}
        <section className="grid gap-4 pb-20 sm:grid-cols-3 sm:pb-24">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-card p-5"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <f.icon className="size-4" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </section>

        {/* ── Live demo timeline ───────────────────────────────── */}
        {demo && (
          <section className="pb-20 sm:pb-24">
            <div className="mb-6 flex items-center gap-4">
              <h2 className="shrink-0 text-sm font-medium text-muted-foreground">
                {t("demoLabel")}
              </h2>
              <Separator className="flex-1" />
            </div>

            <div className="mx-auto max-w-xl rounded-xl border bg-card px-5 py-8 sm:px-8">
              {demo.destination && (
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {demo.destination}
                </p>
              )}
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                {demo.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatDateRange(demo.startDate, demo.endDate)} ·{" "}
                {dayCount(demo.days.length)}
              </p>

              <div className="mt-8">
                {demo.days.slice(0, 2).map((day, i) => (
                  <div key={day.id} className={i > 0 ? "mt-2" : ""}>
                    <ReadOnlyDay
                      day={day}
                      dayNumber={i + 1}
                      currency={demo.currency}
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => openDemo("tokyo")}
                className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("openExample")}
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </section>
        )}

        {/* ── Example trips ────────────────────────────────────── */}
        <section className="pb-20 sm:pb-24">
          <div className="mb-5 flex items-center gap-4">
            <h2 className="shrink-0 text-sm font-medium text-muted-foreground">
              {t("exampleTrips")}
            </h2>
            <Separator className="flex-1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {DEMO_CARDS.map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={() => openDemo(card.key)}
                className="group flex flex-col items-start rounded-xl border bg-card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:text-foreground">
                  <Map className="size-4" />
                </div>
                <div className="mt-4 text-lg font-semibold tracking-tight">
                  {card.destination}
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {mounted
                    ? `${dayCount(card.days)} · ${demoDates[card.key]}`
                    : dayCount(card.days)}
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  {t("openExample")}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
