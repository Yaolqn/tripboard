import type { Trip } from "@/types/trip";
import { getServerSupabase } from "@/lib/supabase/server";
import { rowsToTrip, type TripRow } from "@/lib/data/supabase-rows";

/**
 * Server-side data access (Server Components / generateMetadata / sitemap).
 * Returns null when Supabase isn't configured so pages degrade gracefully.
 */

const TRIP_SELECT = "*, trip_days(*, activities(*, place:places(*)))";

/** Public trip by slug (visibility = public or unlisted). */
export async function serverGetPublicTripBySlug(
  slug: string
): Promise<Trip | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .eq("slug", slug)
    .neq("visibility", "private")
    .maybeSingle();
  if (error || !data) return null;
  return rowsToTrip(data as TripRow);
}

/** Public trips for /explore and /sitemap.xml. */
export async function serverGetPublicTrips(
  limit = 40
): Promise<Trip[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .eq("visibility", "public")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? [])
    .map((row) => rowsToTrip(row as TripRow))
    .filter((t): t is Trip => t !== null);
}
