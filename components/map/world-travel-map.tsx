"use client";

import type { AMapViewProps } from "./amap-view";
import { TripPlacesMap, type TripPlace, type TripPlacesMapProps } from "./trip-places-map";

export type WorldTravelPlace = TripPlace;

export interface WorldTravelMapProps extends Omit<TripPlacesMapProps, "places"> {
  places: WorldTravelPlace[];
}

/** Global travel view with deduplicated visited/planned markers and optional stats. */
export function WorldTravelMap(props: WorldTravelMapProps) {
  return <TripPlacesMap {...props} showStats={props.showStats ?? true} />;
}

export type { AMapViewProps, TripPlace };
export { TripPlacesMap };
