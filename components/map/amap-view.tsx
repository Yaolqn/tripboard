"use client";

import { useEffect, useRef, useState } from "react";
import { isValidCoordinate, loadAMap, type AMapApi, type AMapLngLat, type AMapMapInstance } from "@/lib/amap/client";

export interface MapMarkerData {
  id: string;
  position: AMapLngLat;
  title?: string;
  label?: string;
  kind?: "default" | "visited" | "planned";
  detail?: string;
}

export interface AMapViewProps {
  markers?: MapMarkerData[];
  path?: AMapLngLat[];
  className?: string;
  height?: number | string;
  zoom?: number;
  center?: AMapLngLat;
  emptyMessage?: string;
  onMarkerClick?: (marker: MapMarkerData) => void;
}

function markerColor(kind: MapMarkerData["kind"]): string {
  if (kind === "visited") return "#16a34a";
  if (kind === "planned") return "#f59e0b";
  return "#2563eb";
}

export function AMapView({
  markers = [],
  path = [],
  className,
  height = 360,
  zoom = 5,
  center,
  emptyMessage = "Map unavailable",
  onMarkerClick,
}: AMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapMapInstance | null>(null);
  const overlaysRef = useRef<unknown[]>([]);
  const [api, setApi] = useState<AMapApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadAMap().then((loaded) => {
      if (active) {
        setApi(loaded);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!api || !containerRef.current || mapRef.current) return;
    mapRef.current = new api.Map(containerRef.current, {
      zoom,
      center: center ? [center.lng, center.lat] : undefined,
      resizeEnable: true,
      viewMode: "2D",
    });
    return () => {
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [api, center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!api || !map) return;
    map.remove(overlaysRef.current);
    overlaysRef.current = [];

    const validMarkers = markers.filter((marker) => isValidCoordinate(marker.position));
    const markerOverlays = validMarkers.map((marker) => {
      const overlay = new api.Marker({
        position: [marker.position.lng, marker.position.lat],
        title: marker.title,
        content: `<span style="display:block;width:16px;height:16px;border:3px solid white;border-radius:50%;background:${markerColor(marker.kind)};box-shadow:0 1px 4px #0006"></span>`,
        offset: api.Pixel ? new api.Pixel(-8, -8) : undefined,
      });
      overlay.on("click", () => onMarkerClick?.(marker));
      return overlay;
    });
    const validPath = path.filter(isValidCoordinate);
    const line = validPath.length > 1
      ? new api.Polyline({
          path: validPath.map((point) => [point.lng, point.lat]),
          strokeColor: "#2563eb",
          strokeWeight: 4,
          strokeOpacity: 0.8,
          lineJoin: "round",
        })
      : null;
    const overlays = [...markerOverlays, ...(line ? [line] : [])];
    if (overlays.length) map.add(overlays);
    overlaysRef.current = overlays;
    if (overlays.length) {
      map.setFitView(overlays, false, [48, 48, 48, 48]);
    } else if (center) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
    return () => {
      map.remove(overlays);
    };
  }, [api, center, markers, onMarkerClick, path, zoom]);

  return (
    <div
      ref={containerRef}
      className={className ?? "relative w-full overflow-hidden rounded-md border border-border bg-muted"}
      style={{ height, minHeight: 180 }}
      role="img"
      aria-label="Travel map"
    >
      {!api && (
        <div className="absolute inset-0 grid place-items-center px-4 text-center text-sm text-muted-foreground">
          {loading ? "Loading map..." : emptyMessage}
        </div>
      )}
    </div>
  );
}
