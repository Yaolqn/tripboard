"use client";

import type { AMapLngLat } from "@/lib/amap/client";
import { AMapView, type AMapViewProps, type MapMarkerData } from "./amap-view";

export interface TripPlace {
  id: string;
  name: string;
  coords: AMapLngLat;
  /** Defaults to planned when omitted. */
  status?: "visited" | "planned";
  country?: string;
  detail?: string;
  tripId?: string;
  tripName?: string;
}

export interface TripPlacesMapProps extends Omit<AMapViewProps, "markers" | "path"> {
  places: TripPlace[];
  showStats?: boolean;
  onPlaceClick?: (place: TripPlace) => void;
}

export function TripPlacesMap({ places, showStats = false, onPlaceClick, className, ...props }: TripPlacesMapProps) {
  const uniquePlaces = Array.from(
    new Map(
      places
        .filter((place) => Number.isFinite(place.coords?.lng) && Number.isFinite(place.coords?.lat))
        .map((place) => [`${place.coords.lng}:${place.coords.lat}`, place] as const),
    ).values(),
  );
  const markers: MapMarkerData[] = uniquePlaces.map((place) => ({
    id: place.id,
    position: place.coords,
    title: place.name,
    kind: place.status ?? "planned",
    detail: place.detail,
  }));

  return (
    <div className="relative">
      {showStats && (
        <div className="mb-3 flex gap-4 text-sm text-muted-foreground" aria-label="Place statistics">
          <span><strong className="text-foreground">{uniquePlaces.length}</strong> places</span>
          <span><strong className="text-foreground">{uniquePlaces.filter((place) => place.status === "visited").length}</strong> visited</span>
          <span><strong className="text-foreground">{uniquePlaces.filter((place) => place.status !== "visited").length}</strong> planned</span>
        </div>
      )}
      <AMapView
        {...props}
        className={className}
        markers={markers}
        onMarkerClick={(marker) => {
          const place = uniquePlaces.find((candidate) => candidate.id === marker.id);
          if (place) onPlaceClick?.(place);
        }}
      />
    </div>
  );
}
