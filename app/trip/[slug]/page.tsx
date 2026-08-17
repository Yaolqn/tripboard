import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Trip } from "@/types/trip";
import { serverGetPublicTripBySlug } from "@/lib/data/server";
import { siteUrl } from "@/lib/site";
import { THEME_CONFIGS, coverColors } from "@/lib/themes";
import { formatDateRange, formatMoney } from "@/lib/format";
import { computeBudget } from "@/lib/trip-utils";
import { ReadOnlyDay } from "@/components/trip/readonly-day";
import { TripEditor } from "@/components/trip/trip-editor";
import { Wordmark } from "@/components/trip/wordmark";
import { cn } from "@/lib/utils";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * /trip/[slug]
 * - a UUID segment → the editor (cloud or local)
 * - a public slug → the public, SEO-ready trip page
 */
export default async function TripRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (UUID_RE.test(slug)) {
    return <TripEditor id={slug} />;
  }

  const trip = await serverGetPublicTripBySlug(slug);
  if (!trip) notFound();
  return <PublicTripView trip={trip} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (UUID_RE.test(slug)) return {};
  const trip = await serverGetPublicTripBySlug(slug);
  if (!trip) return {};
  const title = `${trip.destination || trip.name} Itinerary | TripBoard`;
  const activityCount = trip.days.reduce((n, d) => n + d.activities.length, 0);
  const description = `A ${trip.days.length}-day ${
    trip.destination || trip.name
  } itinerary with ${activityCount} stops. ${trip.name}.`;
  return {
    title,
    description,
    alternates: { canonical: siteUrl() + `/trip/${trip.slug}` },
    openGraph: {
      title,
      description,
      url: siteUrl() + `/trip/${trip.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function PublicTripView({ trip }: { trip: Trip }) {
  const theme = THEME_CONFIGS[trip.theme ?? "minimal"];
  const cover = coverColors(trip.cover);
  const budget = computeBudget(trip);
  const activityCount = trip.days.reduce((n, d) => n + d.activities.length, 0);

  return (
    <div className={cn("flex min-h-dvh flex-col", theme.shell)}>
      <header className="no-print mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" aria-label="TripBoard">
          <Wordmark />
        </Link>
      </header>

      {/* cover band */}
      {trip.cover && (
        <div
          className="mx-auto w-full max-w-2xl overflow-hidden rounded-b-2xl px-5 sm:px-8"
          aria-hidden="true"
        >
          <div
            className="h-24 rounded-xl"
            style={{
              background: `linear-gradient(120deg, ${cover.from}, ${cover.to})`,
            }}
          />
        </div>
      )}

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-24 sm:px-8">
        <div className="mt-10 animate-tb-rise sm:mt-14">
          {trip.destination && (
            <p className={cn("text-xs text-muted-foreground", theme.label)}>
              {trip.destination}
            </p>
          )}
          <h1
            className={cn(
              "mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl",
              theme.heading
            )}
          >
            {trip.name}
          </h1>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-muted-foreground">
            {trip.startDate && trip.endDate ? (
              <span className="text-base sm:text-lg">
                {formatDateRange(trip.startDate, trip.endDate)}
              </span>
            ) : null}
            <span className="text-sm sm:text-base">·</span>
            <span className="text-sm sm:text-base">
              {trip.days.length} {trip.days.length === 1 ? "day" : "days"}
            </span>
            <span className="text-sm sm:text-base">·</span>
            <span className="text-sm sm:text-base">
              {activityCount} {activityCount === 1 ? "activity" : "activities"}
            </span>
            {trip.showBudget && budget.total > 0 && (
              <>
                <span className="text-sm sm:text-base">·</span>
                <span className="text-sm sm:text-base tabular-nums">
                  {formatMoney(budget.total, trip.currency)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="mt-12 sm:mt-16">
          {trip.days.map((day, i) => (
            <div key={day.id} className={i > 0 ? "mt-4" : ""}>
              <ReadOnlyDay day={day} dayNumber={i + 1} currency={trip.currency} />
            </div>
          ))}
        </div>
      </main>

      <footer className="no-print border-t">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-center px-5 py-6 text-[13px] text-muted-foreground sm:px-8">
          <Link href="/" className="hover:underline">
            Created with TripBoard
          </Link>
        </div>
      </footer>
    </div>
  );
}
