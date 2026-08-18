export interface AMapLngLat {
  lng: number;
  lat: number;
}

export interface AMapMapInstance {
  setCenter(center: AMapLngLat): void;
  setZoom(zoom: number): void;
  setFitView(overlays?: unknown[], immediately?: boolean, avoid?: number[]): void;
  add(overlays: unknown | unknown[]): void;
  remove(overlays: unknown | unknown[]): void;
  destroy(): void;
  on(event: string, handler: (event: unknown) => void): void;
}

export interface AMapMarkerInstance {
  setMap(map: AMapMapInstance | null): void;
  on(event: string, handler: (event: unknown) => void): void;
}

export interface AMapPolylineInstance {
  setMap(map: AMapMapInstance | null): void;
}

export interface AMapApi {
  Map: new (container: HTMLElement, options?: Record<string, unknown>) => AMapMapInstance;
  Marker: new (options?: Record<string, unknown>) => AMapMarkerInstance;
  Polyline: new (options?: Record<string, unknown>) => AMapPolylineInstance;
  Pixel?: new (x: number, y: number) => unknown;
}

declare global {
  interface Window {
    AMap?: AMapApi;
    _AMapSecurityConfig?: { securityJsCode?: string };
  }
}

const SCRIPT_ID = "tripboard-amap-js-api";
const API_URL = "https://webapi.amap.com/maps?v=2.0";
let loading: Promise<AMapApi | null> | null = null;

function getConfig() {
  return {
    key: process.env.NEXT_PUBLIC_AMAP_JS_KEY ?? process.env.NEXT_PUBLIC_AMAP_KEY,
    securityJsCode: process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE,
  };
}

/** Load AMap only in a browser. A missing key or failed script resolves to null. */
export function loadAMap(): Promise<AMapApi | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(null);
  }
  if (window.AMap) return Promise.resolve(window.AMap);
  if (loading) return loading;

  const { key, securityJsCode } = getConfig();
  if (!key) return Promise.resolve(null);
  if (securityJsCode) window._AMapSecurityConfig = { securityJsCode };

  loading = new Promise<AMapApi | null>((resolve) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.AMap ?? null), { once: true });
      existing.addEventListener("error", () => resolve(null), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `${API_URL}&key=${encodeURIComponent(key)}`;
    script.onload = () => resolve(window.AMap ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  }).finally(() => {
    loading = null;
  });
  return loading;
}

export function isValidCoordinate(value: unknown): value is AMapLngLat {
  if (!value || typeof value !== "object") return false;
  const point = value as Partial<AMapLngLat>;
  return (
    typeof point.lng === "number" && Number.isFinite(point.lng) && point.lng >= -180 && point.lng <= 180 &&
    typeof point.lat === "number" && Number.isFinite(point.lat) && point.lat >= -90 && point.lat <= 90
  );
}
