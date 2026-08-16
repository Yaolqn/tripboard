import type { Trip } from "@/types/trip";
import { sanitizeTrip } from "@/lib/trip-utils";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

/**
 * Share links carry the full trip payload directly in the URL path:
 *
 *   /share/<lz-compressed JSON>
 *
 * The payload is compressed (lz-string) and URL-safe, so a copied link opens
 * the read-only preview on any browser — no server or database required.
 * Path-based (not hash-based) so links survive apps that strip URL fragments.
 */

/**
 * Compact share serialization. Strips fields that are pure noise for the
 * reader (createdAt/updatedAt timestamps, internal day/activity ids) so
 * share links stay as short as possible — long URLs are more likely to be
 * truncated or rewritten by messengers and chat apps. `sanitizeTrip`
 * rehydrates the missing fields with fresh values on decode.
 */
function toShareableTrip(trip: Trip) {
  return {
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    currency: trip.currency,
    startDate: trip.startDate,
    endDate: trip.endDate,
    days: trip.days.map((d) => ({
      date: d.date,
      activities: d.activities.map((a) => ({
        type: a.type,
        title: a.title,
        time: a.time,
        location: a.location,
        cost: a.cost,
        notes: a.notes,
        url: a.url,
      })),
    })),
  };
}

/** JSON -> lz-string URL-safe payload, hardened for chat transport. */
export function encodeTrip(trip: Trip): string {
  return compressToEncodedURIComponent(JSON.stringify(toShareableTrip(trip)))
    .replace(/\+/g, "~")
    .replace(/\$/g, "!");
}

/** lz-string payload -> validated Trip. Returns null when invalid. */
export function decodeTrip(data: string): Trip | null {
  try {
    const normalized = data.replace(/~/g, "+").replace(/!/g, "$");
    const json = decompressFromEncodedURIComponent(normalized);
    if (!json) return null;
    return sanitizeTrip(JSON.parse(json));
  } catch {
    return null;
  }
}

/** Build a full share link for the current origin. */
export function buildShareUrl(trip: Trip): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/share/${encodeTrip(trip)}`;
}

/** Length of the shareable URL (excluding origin). */
export function sharePayloadLength(trip: Trip): number {
  return encodeTrip(trip).length;
}

/**
 * Hard cap for share links. Trips bigger than this cannot be shared as a
 * link — callers should show a friendly message and suggest PNG export.
 * (Browsers tolerate much longer URLs, but messengers and crawlers truncate.)
 */
export const MAX_SHARE_PAYLOAD_LENGTH = 100_000;

export function canShareAsLink(trip: Trip): boolean {
  return sharePayloadLength(trip) <= MAX_SHARE_PAYLOAD_LENGTH;
}

/* ── legacy V0.1 links (/share/<id>#data=<base64url>) ────────────── */

export function decodeLegacyTrip(data: string): Trip | null {
  try {
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return sanitizeTrip(JSON.parse(json));
  } catch {
    return null;
  }
}

export function readLegacySharedTripFromHash(): Trip | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash.startsWith("#data=")) return null;
  return decodeLegacyTrip(hash.slice("#data=".length));
}
