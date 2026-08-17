import type { Trip } from "@/types/trip";
import { getBrowserSupabase } from "@/lib/supabase/client";
import * as storage from "@/lib/storage";
import {
  cloudCreateTrip,
  cloudDeleteTrip,
  cloudGetTrip,
  cloudGetTrips,
  cloudSaveTrip,
  cloudImportTrips,
  cloudEnsureSlug,
  type CloudCreateInput,
} from "@/lib/data/cloud";

/**
 * Unified data access layer for TripBoard.
 *
 * Logged-in users operate on Supabase (cloud is the source of truth);
 * guests operate on localStorage. Components never touch Supabase or
 * localStorage directly — they call the functions here.
 */

async function currentUser() {
  const supabase = getBrowserSupabase();
  if (!supabase) return null;
  // getSession() reads the local session without a network round-trip —
  // used only to decide cloud vs local routing. Real auth failures surface
  // on the database calls themselves.
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export type CreateTripInput = CloudCreateInput;

export async function getTrips(): Promise<Trip[]> {
  const user = await currentUser();
  if (user) {
    const supabase = getBrowserSupabase()!;
    return cloudGetTrips(supabase);
  }
  return storage.getTrips();
}

export async function getTrip(id: string): Promise<Trip | null> {
  const user = await currentUser();
  if (user) {
    const supabase = getBrowserSupabase()!;
    const cloud = await cloudGetTrip(supabase, id);
    if (cloud) return cloud;
    // fall through: maybe it's a local trip while signed in
  }
  return storage.getTrip(id);
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const user = await currentUser();
  if (user) {
    const supabase = getBrowserSupabase()!;
    return cloudCreateTrip(supabase, input);
  }
  return storage.createTrip(input);
}

export async function saveTrip(trip: Trip): Promise<void> {
  const user = await currentUser();
  if (user) {
    const supabase = getBrowserSupabase()!;
    await cloudSaveTrip(supabase, trip);
  } else {
    storage.saveTrip(trip);
  }
}

export async function deleteTrip(id: string): Promise<void> {
  const user = await currentUser();
  if (user) {
    const supabase = getBrowserSupabase()!;
    await cloudDeleteTrip(supabase, id);
  } else {
    storage.deleteTrip(id);
  }
}

export async function duplicateTrip(id: string): Promise<Trip | null> {
  const trip = await getTrip(id);
  if (!trip) return null;
  const copy: Trip = {
    ...trip,
    id: crypto.randomUUID(),
    name: `${trip.name} (Copy)`,
    slug: undefined,
    visibility: "private",
    days: trip.days.map((d) => ({
      ...d,
      id: crypto.randomUUID(),
      activities: d.activities.map((a) => ({ ...a, id: crypto.randomUUID() })),
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await saveTrip(copy);
  return copy;
}

/** Ensure the trip has a public slug (called when publishing). */
export async function ensureSlug(trip: Trip): Promise<string> {
  const user = await currentUser();
  if (user && getBrowserSupabase()) {
    return cloudEnsureSlug(getBrowserSupabase()!, trip);
  }
  return trip.slug ?? trip.id;
}

const tripSignature = (t: Trip) =>
  `${t.name}|${t.destination}|${t.startDate}|${t.endDate}`;

/**
 * Import local trips into the cloud and prune the successfully imported
 * ones from localStorage (failed trips stay for a retry). Trips that are
 * already in the cloud (same name/destination/dates) are skipped — they're
 * treated as done and pruned too, so re-imports don't create duplicates.
 */
export async function importLocalTrips(): Promise<{
  imported: number;
  total: number;
}> {
  const local = storage.getTrips();
  if (local.length === 0) return { imported: 0, total: 0 };
  const user = await currentUser();
  const supabase = getBrowserSupabase();
  if (!user || !supabase) return { imported: 0, total: local.length };

  // Skip trips that already exist in the cloud (same signature).
  let existing = new Set<string>();
  try {
    const cloudTrips = await cloudGetTrips(supabase);
    existing = new Set(cloudTrips.map(tripSignature));
  } catch {
    // if the lookup fails, attempt everything
  }
  const skippedIds = new Set(
    local.filter((t) => existing.has(tripSignature(t))).map((t) => t.id)
  );
  const toImport = local.filter((t) => !existing.has(tripSignature(t)));

  let imported = 0;
  let failedIds = new Set<string>();
  if (toImport.length > 0) {
    const result = await cloudImportTrips(supabase, toImport);
    imported = result.imported;
    failedIds = result.failedIds;
  }

  // Prune everything that's now safely in the cloud (imported or skipped);
  // keep only genuinely failed trips for a retry.
  if (failedIds.size === 0) {
    storage.saveTrips([]);
  } else {
    storage.saveTrips(local.filter((t) => failedIds.has(t.id)));
  }
  return { imported: imported + skippedIds.size, total: local.length };
}
