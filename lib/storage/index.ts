import type { Trip } from "@/types/trip";
import { buildDays, newId, sanitizeTrip } from "@/lib/trip-utils";

/**
 * TripBoard storage service — the single source of truth for persisting
 * trips in localStorage. No component touches localStorage directly; all
 * data operations go through this module so the persistence layer can be
 * swapped for a real backend later without touching UI code.
 *
 * API:
 *   getTrips() / getTrip(id)
 *   saveTrip(trip) / deleteTrip(id)
 *   createTrip(input) / duplicateTrip(id)
 */

const STORAGE_KEY = "tripboard.trips.v1";
const CORRUPT_BACKUP_KEY = "tripboard.corrupt-backup.v1";

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeRaw(value: string): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
    return true;
  } catch {
    return false;
  }
}

export function getTrips(): Trip[] {
  const raw = readRaw();
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("tripboard: store is not an array");
    return parsed
      .map(sanitizeTrip)
      .filter((t): t is Trip => t !== null);
  } catch {
    // Preserve the corrupt payload so nothing is silently destroyed.
    try {
      window.localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
    } catch {
      // ignore
    }
    return [];
  }
}

export function getTrip(id: string): Trip | null {
  const trips = getTrips();
  return trips.find((t) => t.id === id) ?? null;
}

/** Insert or replace a trip, then persist the whole collection. */
export function saveTrip(trip: Trip): boolean {
  const trips = getTrips();
  const idx = trips.findIndex((t) => t.id === trip.id);
  if (idx === -1) trips.push(trip);
  else trips[idx] = trip;
  return saveTrips(trips);
}

export function deleteTrip(id: string): boolean {
  const trips = getTrips();
  const next = trips.filter((t) => t.id !== id);
  if (next.length === trips.length) return true;
  return saveTrips(next);
}

/** Persist a full collection (used after batch operations). */
export function saveTrips(trips: Trip[]): boolean {
  try {
    return writeRaw(JSON.stringify(trips));
  } catch {
    return false;
  }
}

export interface NewTripInput {
  name: string;
  destination: string;
  currency: string;
  startDate: string;
  endDate: string;
}

/** Build a brand-new trip with one empty day per calendar date. */
export function createTrip(input: NewTripInput): Trip {
  const now = Date.now();
  const trip: Trip = {
    id: newId(),
    name: input.name.trim() || "My Trip",
    destination: input.destination.trim(),
    currency: input.currency || "JPY",
    startDate: input.startDate,
    endDate: input.endDate,
    days: buildDays(input.startDate, input.endDate),
    createdAt: now,
    updatedAt: now,
  };
  saveTrip(trip);
  return trip;
}

export function duplicateTrip(id: string): Trip | null {
  const trip = getTrip(id);
  if (!trip) return null;
  const copy: Trip = {
    ...trip,
    id: newId(),
    name: `${trip.name} (Copy)`,
    days: trip.days.map((d) => ({
      ...d,
      id: newId(),
      activities: d.activities.map((a) => ({ ...a, id: newId() })),
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveTrip(copy);
  return copy;
}

// Backwards-compatible aliases (V0.1 API).
export const loadTrips = getTrips;
export const loadTrip = getTrip;
export const removeTrip = deleteTrip;
