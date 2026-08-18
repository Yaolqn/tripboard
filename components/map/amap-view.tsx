"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AMapLoadError,
  isValidCoordinate,
  loadAMap,
  type AMapApi,
  type AMapLngLat,
  type AMapMapInstance,
} from "@/lib/amap/client";

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
  onLoadError?: (error: AMapLoadError) => void;
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
  onLoadError,
}: AMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapMapInstance | null>(null);
  const overlaysRef = useRef<unknown[]>([]);
  const onLoadErrorRef = useRef(onLoadError);
  const [api, setApi] = useState<AMapApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AMapLoadError | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
  }, [onLoadError]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    loadAMap()
      .then((loaded) => {
        if (active) {
          setApi(loaded);
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        const failure = cause instanceof AMapLoadError
          ? cause
          : new AMapLoadError("script-error", cause instanceof Error ? cause.message : "AMap failed to load.");
        if (active) {
          setApi(null);
          setError(failure);
          setLoading(false);
          onLoadErrorRef.current?.(failure);
          toast.error("地图加载失败", { description: `${failure.message}（错误代码：${failure.code}）` });
        }
      });
    return () => {
      active = false;
    };
  }, [retry]);

  useEffect(() => {
    if (!api || !containerRef.current || mapRef.current) return;
    try {
      mapRef.current = new api.Map(containerRef.current, {
        zoom,
        center: center ? [center.lng, center.lat] : undefined,
        resizeEnable: true,
        viewMode: "2D",
      });
    } catch (cause) {
      const failure = new AMapLoadError(
        "api-missing",
        cause instanceof Error ? cause.message : "AMap map initialization failed.",
      );
      setApi(null);
      setError(failure);
      onLoadErrorRef.current?.(failure);
      toast.error("地图初始化失败", { description: failure.message });
      return;
    }
    return () => {
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [api, center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!api || !map) return;
    try {
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
    } catch (cause) {
      const failure = new AMapLoadError(
        "api-missing",
        cause instanceof Error ? cause.message : "AMap overlay rendering failed.",
      );
      setError(failure);
      onLoadErrorRef.current?.(failure);
      toast.error("地图标记渲染失败", { description: failure.message });
    }
  }, [api, center, markers, onMarkerClick, path, zoom]);

  const hasMapData = markers.some((marker) => isValidCoordinate(marker.position))
    || path.some(isValidCoordinate);

  return (
    <div
      ref={containerRef}
      className={className ?? "relative w-full overflow-hidden rounded-md border border-border bg-muted"}
      style={{ height, minHeight: 180 }}
      role="img"
      aria-label="Travel map"
    >
      {api && !hasMapData && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-4">
          <p className="rounded-md border bg-background/90 px-3 py-2 text-center text-xs text-muted-foreground shadow-sm">
            {emptyMessage}
          </p>
        </div>
      )}
      {!api && (
        <div className="absolute inset-0 grid place-items-center gap-2 px-4 text-center text-sm text-muted-foreground">
          {loading ? (
            "Loading map..."
          ) : error ? (
            <div className="flex max-w-sm flex-col items-center gap-2">
              <p className="font-medium text-foreground">{error.message}</p>
              <p className="text-xs">Check the AMap key, security code, domain whitelist, and browser network access.</p>
              <Button type="button" size="sm" variant="outline" onClick={() => setRetry((value) => value + 1)}>
                Retry
              </Button>
            </div>
          ) : (
            emptyMessage
          )}
        </div>
      )}
    </div>
  );
}
