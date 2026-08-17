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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
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

/** Import local trips into the cloud; returns how many were imported. */
export async function importLocalTrips(): Promise<number> {
  const local = storage.getTrips();
  if (local.length === 0) return 0;
  const user = await currentUser();
  if (!user || !getBrowserSupabase()) return 0;
  return cloudImportTrips(getBrowserSupabase()!, local);
}
