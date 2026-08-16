/**
 * Analytics placeholder for TripBoard.
 *
 * V0.2 intentionally ships without any third-party analytics. `track` is a
 * no-op that logs to the console in development only. Swap the body for
 * Vercel Analytics, PostHog, or any other provider without touching call
 * sites.
 */

export type TrackEvent =
  | "trip_created"
  | "trip_opened"
  | "trip_duplicated"
  | "trip_deleted"
  | "trip_shared"
  | "trip_exported"
  | "activity_added";

export function track(event: TrackEvent, props?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[analytics] ${event}`, props ?? {});
  }
}
