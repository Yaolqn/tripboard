import type { Activity, Day, Place, Trip } from "@/types/trip";
import { sanitizeTrip } from "@/lib/trip-utils";

/**
 * Mappers between the UI Trip shape and the Supabase relational rows
 * (trips / trip_days / activities). Pure functions — no supabase calls.
 */

export interface PlaceRow {
  id: string;
  provider: string;
  provider_place_id: string;
  name: string;
  formatted_address: string;
  city: string | null;
  country: string | null;
  country_code: string | null;
  latitude: number;
  longitude: number;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityRow {
  id: string;
  day_id: string;
  title: string;
  time: string;
  type: string;
  location: string | null;
  place_id: string | null;
  place?: PlaceRow | null;
  cost: number | null;
  notes: string | null;
  url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DayRow {
  id: string;
  trip_id: string;
  day_number: number;
  date: string | null;
  title: string | null;
  sort_order: number;
  activities: ActivityRow[];
}

export interface TripRow {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  currency: string;
  cover: string | null;
  theme: string | null;
  visibility: string;
  status: string;
  slug: string | null;
  show_budget: boolean;
  show_notes: boolean;
  created_at: string;
  updated_at: string;
  trip_days?: DayRow[];
}

const toISO = (d: string | null): string => d ?? "";

function rowToPlace(row: PlaceRow): Place | undefined {
  if (row.provider !== "amap") return undefined;
  return {
    id: row.id,
    provider: "amap",
    providerPlaceId: row.provider_place_id,
    name: row.name,
    formattedAddress: row.formatted_address,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    countryCode: row.country_code ?? undefined,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
  };
}

export function rowsToTrip(row: TripRow): Trip | null {
  const days: Day[] = (row.trip_days ?? [])
    .slice()
    .sort((a, b) => a.day_number - b.day_number)
    .map((d) => {
      const activities: Activity[] = (d.activities ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((a) => ({
          id: a.id,
          type: a.type as Activity["type"],
          title: a.title,
          time: a.time ?? "",
          location: a.location ?? undefined,
          placeId: a.place_id ?? undefined,
          place: a.place ? rowToPlace(a.place) : undefined,
          cost: a.cost != null && a.cost > 0 ? Number(a.cost) : undefined,
          notes: a.notes ?? undefined,
          url: a.url ?? undefined,
          createdAt: new Date(a.created_at ?? 0).getTime(),
        }));
      return {
        id: d.id,
        date: toISO(d.date),
        activities,
      };
    });

  const trip: Trip = {
    id: row.id,
    name: row.title,
    destination: row.destination ?? "",
    currency: row.currency ?? "JPY",
    startDate: toISO(row.start_date),
    endDate: toISO(row.end_date),
    days,
    createdAt: new Date(row.created_at ?? 0).getTime(),
    updatedAt: new Date(row.updated_at ?? 0).getTime(),
    slug: row.slug ?? undefined,
    visibility: (row.visibility as Trip["visibility"]) ?? "private",
    status: (row.status as Trip["status"]) ?? "draft",
    theme: (row.theme as Trip["theme"]) ?? "minimal",
    cover: row.cover ?? undefined,
    showBudget: row.show_budget ?? true,
    showNotes: row.show_notes ?? true,
  };
  return sanitizeTrip(trip);
}

export interface TripWriteSet {
  trip: Omit<TripRow, "user_id" | "created_at" | "updated_at" | "trip_days">;
  days: Array<{
    id: string;
    trip_id: string;
    day_number: number;
    date: string | null;
    title: string | null;
    sort_order: number;
    activities: Array<{
      id: string;
      day_id: string;
      title: string;
      time: string;
      type: string;
      location: string | null;
      place_id: string | null;
      cost: number | null;
      notes: string | null;
      url: string | null;
      sort_order: number;
    }>;
  }>;
}

/** Convert a UI Trip into the rows needed for an upsert. */
export function tripToWriteSet(trip: Trip): TripWriteSet {
  return {
    trip: {
      id: trip.id,
      title: trip.name,
      destination: trip.destination ?? "",
      start_date: trip.startDate || null,
      end_date: trip.endDate || null,
      currency: trip.currency ?? "JPY",
      cover: trip.cover ?? null,
      theme: trip.theme ?? "minimal",
      visibility: trip.visibility ?? "private",
      status: trip.status ?? "draft",
      slug: trip.slug ?? null,
      show_budget: trip.showBudget ?? true,
      show_notes: trip.showNotes ?? true,
    },
    days: trip.days.map((d, dayIdx) => ({
      id: d.id,
      trip_id: trip.id,
      day_number: dayIdx + 1,
      date: d.date || null,
      title: null,
      sort_order: dayIdx,
      activities: d.activities.map((a, actIdx) => ({
        id: a.id,
        day_id: d.id,
        title: a.title,
        time: a.time ?? "",
        type: a.type,
        location: a.location ?? null,
        place_id: a.placeId ?? null,
        cost: typeof a.cost === "number" && a.cost > 0 ? a.cost : null,
        notes: a.notes ?? null,
        url: a.url ?? null,
        sort_order: actIdx,
      })),
    })),
  };
}

/** Compute a simple planning-progress percent for a trip (0–100). */
export function tripProgress(trip: Trip): number {
  if (trip.days.length === 0) return 0;
  const withActivities = trip.days.filter((d) => d.activities.length > 0).length;
  const progress = (withActivities / trip.days.length) * 100;
  return Math.round(progress);
}
