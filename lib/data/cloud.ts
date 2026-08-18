import type { SupabaseClient } from "@supabase/supabase-js";
import type { ThemeId, Trip } from "@/types/trip";
import { buildDays, newId } from "@/lib/trip-utils";
import { slugify } from "@/lib/slug";
import {
  rowsToTrip,
  tripToWriteSet,
  type TripRow,
} from "@/lib/data/supabase-rows";

/**
 * Cloud data operations against Supabase (browser client). Components go
 * through lib/data instead of calling these directly.
 */

const TRIP_SELECT = "*, trip_days(*, activities(*, place:places(*)))";

export interface CloudCreateInput {
  name: string;
  destination: string;
  currency: string;
  startDate: string;
  endDate: string;
  fromTemplate?: {
    name: string;
    destination: string;
    currency: string;
    startDate: string;
    endDate: string;
    days: Array<{ date: string; activities: Trip["days"][number]["activities"] }>;
    theme?: ThemeId;
    cover?: string;
  };
}

interface PlaceInput {
  provider: "amap";
  provider_place_id: string;
  name: string;
  formatted_address: string;
  city: string | null;
  country: string | null;
  country_code: string | null;
  latitude: number;
  longitude: number;
}

async function resolvePlaceIds(
  supabase: SupabaseClient,
  trip: Trip,
): Promise<Trip> {
  const inputs = trip.days.flatMap((day) =>
    day.activities.flatMap((activity): PlaceInput[] => {
      const place = activity.place;
      if (!place) return [];
      return [{
        provider: place.provider,
        provider_place_id: place.providerPlaceId,
        name: place.name,
        formatted_address: place.formattedAddress,
        city: place.city ?? null,
        country: place.country ?? null,
        country_code: place.countryCode ?? null,
        latitude: place.latitude,
        longitude: place.longitude,
      }];
    }),
  );
  const uniqueInputs = Array.from(
    new Map(inputs.map((input) => [`${input.provider}:${input.provider_place_id}`, input])).values(),
  );
  if (uniqueInputs.length === 0) return trip;

  const { data, error } = await supabase.rpc("resolve_places", {
    place_inputs: uniqueInputs,
  });
  if (error) throw new Error(`Unable to save map locations: ${error.message}`);
  const ids = new Map(
    ((data ?? []) as Array<{ id: string; provider: string; provider_place_id: string }>)
      .map((row) => [`${row.provider}:${row.provider_place_id}`, row.id]),
  );
  for (const input of uniqueInputs) {
    if (!ids.has(`${input.provider}:${input.provider_place_id}`)) {
      throw new Error(`Unable to resolve map location ${input.provider_place_id}`);
    }
  }
  return {
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      activities: day.activities.map((activity) => ({
        ...activity,
        placeId: activity.place
          ? ids.get(`${activity.place.provider}:${activity.place.providerPlaceId}`)
          : undefined,
      })),
    })),
  };
}

export async function cloudGetTrips(
  supabase: SupabaseClient
): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((row) => rowsToTrip(row as TripRow))
    .filter((t): t is Trip => t !== null);
}

export async function cloudGetTrip(
  supabase: SupabaseClient,
  id: string
): Promise<Trip | null> {
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowsToTrip(data as TripRow) : null;
}

export async function cloudGetPublicTripBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Trip | null> {
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .eq("slug", slug)
    .neq("visibility", "private")
    .maybeSingle();
  if (error) throw error;
  return data ? rowsToTrip(data as TripRow) : null;
}

export async function cloudGetPublicTrips(
  supabase: SupabaseClient,
  limit = 40
): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .eq("visibility", "public")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? [])
    .map((row) => rowsToTrip(row as TripRow))
    .filter((t): t is Trip => t !== null);
}

/** Ensure a unique public slug for a trip (set once, stays stable). */
export async function cloudEnsureSlug(
  supabase: SupabaseClient,
  trip: Trip
): Promise<string> {
  if (trip.slug) return trip.slug;
  const base = slugify(trip.name);
  let candidate = base;
  let n = 2;
  while (true) {
    const { data } = await supabase
      .from("trips")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

export async function cloudCreateTrip(
  supabase: SupabaseClient,
  input: CloudCreateInput
): Promise<Trip> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const now = Date.now();
  const id = newId();
  const days = input.fromTemplate
    ? input.fromTemplate.days.map((d) => ({
        id: newId(),
        date: d.date,
        activities: d.activities.map((a) => ({ ...a, id: newId() })),
      }))
    : buildDays(input.startDate, input.endDate).map((d) => ({
        ...d,
        activities: [],
      }));
  const trip: Trip = {
    id,
    name: input.name.trim() || "My Trip",
    destination: input.destination.trim(),
    currency: input.currency || "JPY",
    startDate: input.startDate,
    endDate: input.endDate,
    days,
    createdAt: now,
    updatedAt: now,
    visibility: "private",
    status: "draft",
    theme: input.fromTemplate?.theme ?? "minimal",
    cover: input.fromTemplate?.cover,
  };

  const resolvedTrip = await resolvePlaceIds(supabase, trip);
  const set = tripToWriteSet(resolvedTrip);

  const { error: tripErr } = await supabase
    .from("trips")
    .insert({ ...set.trip, user_id: user.id });
  if (tripErr) throw tripErr;

  for (const day of set.days) {
    const { error: dayErr } = await supabase.from("trip_days").insert({
      id: day.id,
      trip_id: id,
      day_number: day.day_number,
      date: day.date,
      title: day.title,
      sort_order: day.sort_order,
    });
    if (dayErr) throw dayErr;
    if (day.activities.length > 0) {
      const { error: actErr } = await supabase
        .from("activities")
        .insert(day.activities);
      if (actErr) throw actErr;
    }
  }

  // owner membership row (RLS uses trips.user_id as the primary owner)
  try {
    await supabase.from("trip_members").upsert(
      { trip_id: id, user_id: user.id, role: "owner" },
      { onConflict: "trip_id,user_id" }
    );
  } catch {
    // non-fatal — ownership is enforced by trips.user_id
  }
  return resolvedTrip;
}

/** Full-document upsert: trip + days + activities (removes deleted rows). */
export async function cloudSaveTrip(
  supabase: SupabaseClient,
  trip: Trip
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const resolvedTrip = await resolvePlaceIds(supabase, trip);
  const set = tripToWriteSet(resolvedTrip);

  const { error: tripErr } = await supabase
    .from("trips")
    .upsert({ ...set.trip, user_id: user.id });
  if (tripErr) throw tripErr;

  // existing days & activities for this trip
  const { data: existingDays } = await supabase
    .from("trip_days")
    .select("id")
    .eq("trip_id", trip.id);
  const existingDayIds = new Set((existingDays ?? []).map((d) => d.id));
  const newDayIds = new Set(set.days.map((d) => d.id));

  const { data: existingActs } = await supabase
    .from("activities")
    .select("id")
    .in(
      "day_id",
      Array.from(existingDayIds).length ? Array.from(existingDayIds) : ["00000000-0000-0000-0000-000000000000"]
    );
  const existingActIds = new Set((existingActs ?? []).map((a) => a.id));
  const newActIds = new Set(set.days.flatMap((d) => d.activities.map((a) => a.id)));

  if (set.days.length > 0) {
    const dayRows = set.days.map((d) => ({
      id: d.id,
      trip_id: d.trip_id,
      day_number: d.day_number,
      date: d.date,
      title: d.title,
      sort_order: d.sort_order,
    }));
    const { error: dayErr } = await supabase.from("trip_days").upsert(dayRows);
    if (dayErr) throw dayErr;
  }

  const allActs = set.days.flatMap((d) => d.activities);
  if (allActs.length > 0) {
    const { error: actErr } = await supabase.from("activities").upsert(allActs);
    if (actErr) throw actErr;
  }

  const removedDays = Array.from(existingDayIds).filter((id) => !newDayIds.has(id));
  const removedActs = Array.from(existingActIds).filter((id) => !newActIds.has(id));
  if (removedActs.length > 0) {
    await supabase.from("activities").delete().in("id", removedActs);
  }
  if (removedDays.length > 0) {
    await supabase.from("trip_days").delete().in("id", removedDays);
  }
}

export async function cloudDeleteTrip(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Insert local trips into the cloud (used by the import flow).
 * Returns how many were imported and the ids of the trips that failed
 * (so callers can prune the successfully imported ones from localStorage).
 */
export async function cloudImportTrips(
  supabase: SupabaseClient,
  trips: Trip[]
): Promise<{ imported: number; failedIds: Set<string> }> {
  let imported = 0;
  const failedIds = new Set<string>();
  for (const trip of trips) {
    const cloudTrip: Trip = {
      ...trip,
      id: newId(),
      slug: undefined,
      visibility: "private",
      status: "draft",
      days: trip.days.map((d) => ({
        ...d,
        id: newId(),
        // Local/demo trips can carry non-UUID activity ids (e.g.
        // "demo-tokyo-0-0") which the uuid columns reject — remap them.
        activities: d.activities.map((a) => ({ ...a, id: newId() })),
      })),
    };
    try {
      await cloudSaveTrip(supabase, cloudTrip);
      imported += 1;
    } catch (err) {
      // Best-effort rollback of partially inserted rows (each request is a
      // separate transaction), then keep going with the rest.
      try {
        await supabase.from("trips").delete().eq("id", cloudTrip.id);
      } catch {
        // ignore
      }
      failedIds.add(trip.id);
      console.error(
        "[tripboard] import failed for",
        trip.name,
        JSON.stringify(err)
      );
    }
  }
  return { imported, failedIds };
}

/* ── invitations ──────────────────────────────────────────────── */

export async function cloudCreateInvite(
  supabase: SupabaseClient,
  tripId: string,
  role: "editor" | "viewer"
): Promise<{ token: string; url: string } | null> {
  const token = `${newId().replace(/-/g, "").slice(0, 20)}${Date.now().toString(36)}`;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("trip_invites")
    .insert({ trip_id: tripId, token, role, created_by: user.id })
    .select("token")
    .single();
  if (error || !data) return null;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return { token: data.token, url: `${origin}/invite/${data.token}` };
}

export interface InviteInfo {
  tripId: string;
  tripTitle: string;
  role: "editor" | "viewer";
  valid: boolean;
}

export async function cloudGetInvite(
  supabase: SupabaseClient,
  token: string
): Promise<InviteInfo | null> {
  const { data, error } = await supabase.rpc("get_invite", {
    invite_token: token,
  });
  if (error || !data) return null;
  const row = data as unknown as { trip_id: string; role: string; trip_title: string };
  return {
    tripId: row.trip_id,
    tripTitle: row.trip_title ?? "Trip",
    role: row.role as InviteInfo["role"],
    valid: true,
  };
}

/** Accept an invite: adds the current user as a member (via RPC). */
export async function cloudAcceptInvite(
  supabase: SupabaseClient,
  token: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("accept_invite", {
    invite_token: token,
  });
  if (error) return false;
  return data === true;
}
