import type { Place } from "@/types/place";

interface AmapPoi {
  id?: string;
  name?: string;
  address?: string | string[];
  location?: string;
  type?: string;
  tel?: string;
  cityname?: string;
  adname?: string;
}

interface AmapResponse {
  status?: string;
  info?: string;
  pois?: AmapPoi[];
}

export function isAmapConfigured() {
  return Boolean(process.env.AMAP_WEB_SERVICE_KEY?.trim());
}

export async function searchAmapPlaces(keyword: string): Promise<Place[]> {
  const key = process.env.AMAP_WEB_SERVICE_KEY?.trim();
  if (!key) return [];

  const params = new URLSearchParams({
    key,
    keywords: keyword,
    output: "json",
    offset: "10",
    page: "1",
    extensions: "base",
  });

  const response = await fetch(
    `https://restapi.amap.com/v3/place/text?${params.toString()}`,
    { next: { revalidate: 300 } }
  );
  if (!response.ok) throw new Error(`Amap request failed: ${response.status}`);

  const data = (await response.json()) as AmapResponse;
  if (data.status !== "1") throw new Error(data.info || "Amap request failed");

  return (data.pois ?? []).flatMap((poi, index) => {
    if (!poi.name || !poi.location) return [];
    return [{
      id: poi.id || `${poi.name}-${poi.location}-${index}`,
      name: poi.name,
      address: Array.isArray(poi.address) ? poi.address.join(", ") : poi.address || "",
      location: poi.location,
      type: poi.type,
      tel: poi.tel,
      city: poi.cityname,
      district: poi.adname,
    }];
  });
}
