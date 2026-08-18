import type { Place, PlaceSearchResponse } from "@/types/place";

const cache = new Map<string, { expiresAt: number; places: Place[] }>();

export class PlaceSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlaceSearchError";
  }
}

export async function searchPlaces(
  keyword: string,
  options: { signal?: AbortSignal } = {}
): Promise<PlaceSearchResponse> {
  const query = keyword.trim();
  if (!query) return { places: [], configured: true };

  const cached = cache.get(query);
  if (cached && cached.expiresAt > Date.now()) {
    return { places: cached.places, configured: true };
  }

  let response: Response;
  try {
    response = await fetch(`/api/places/search?keywords=${encodeURIComponent(query)}`, {
      signal: options.signal,
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new PlaceSearchError("网络连接失败，请稍后重试");
  }

  let data: PlaceSearchResponse & { error?: string };
  try {
    data = (await response.json()) as PlaceSearchResponse & { error?: string };
  } catch {
    throw new PlaceSearchError("搜索服务暂时不可用");
  }

  if (!response.ok) throw new PlaceSearchError(data.error || "搜索服务暂时不可用");
  if (!data.configured) return data;

  cache.set(query, { expiresAt: Date.now() + 5 * 60 * 1000, places: data.places });
  return data;
}

export function clearPlaceSearchCache() {
  cache.clear();
}
