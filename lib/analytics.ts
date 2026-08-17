/**
 * Analytics for TripBoard.
 *
 * V0.3 keeps the pluggable placeholder: events are logged to the console in
 * development and are no-ops in production until a provider is configured
 * (Vercel Web Analytics, PostHog, …). Swap the body of `track` without
 * touching call sites.
 *
 * Never record private trip content, notes, or precise itinerary data.
 */

export type TrackEvent =
  | "page_view"
  | "signup"
  | "login"
  | "trip_created"
  | "trip_duplicated"
  | "trip_deleted"
  | "trip_published"
  | "trip_imported"
  | "trip_shared"
  | "png_exported"
  | "template_viewed"
  | "template_used"
  | "activity_added"
  | "invite_accepted";

export function track(event: TrackEvent, props?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[analytics] ${event}`, props ?? {});
  }
}
