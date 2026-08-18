"use client";

import type { Activity } from "@/types/trip";
import type { AMapLngLat } from "@/lib/amap/client";
import { AMapView, type AMapViewProps, type MapMarkerData } from "./amap-view";

export interface DayRouteActivity extends Activity {
  /** Coordinates are intentionally component-level until the map schema is introduced. */
  coords?: AMapLngLat | null;
}

export interface DayRouteMapProps extends Omit<AMapViewProps, "markers" | "path" | "emptyMessage"> {
  activities: DayRouteActivity[];
  emptyMessage?: string;
  noPlacesMessage?: string;
}

export function DayRouteMap({
  activities,
  emptyMessage = "No places planned for this day",
  noPlacesMessage = "Add place coordinates to see the route",
  ...props
}: DayRouteMapProps) {
  const places = activities
    .map((activity, index) => ({ activity, index }))
    .filter(({ activity }) => activity.coords)
    .filter(({ activity }) => Number.isFinite(activity.coords?.lng) && Number.isFinite(activity.coords?.lat));

  const markers: MapMarkerData[] = places.map(({ activity, index }) => ({
    id: activity.id,
    position: activity.coords as AMapLngLat,
    title: activity.title,
    label: String(index + 1),
    detail: activity.location,
  }));
  const path = markers.map((marker) => marker.position);

  return (
    <AMapView
      {...props}
      markers={markers}
      path={path}
      emptyMessage={places.length === 0 ? emptyMessage : noPlacesMessage}
    />
  );
}
