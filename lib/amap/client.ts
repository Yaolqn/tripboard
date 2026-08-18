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

export interface AMapInfoWindowInstance {
  setContent(content: string | HTMLElement): void;
  open(map: AMapMapInstance, position: AMapLngLat): void;
  close(): void;
}

export interface AMapApi {
  Map: new (container: HTMLElement, options?: Record<string, unknown>) => AMapMapInstance;
  Marker: new (options?: Record<string, unknown>) => AMapMarkerInstance;
  Polyline: new (options?: Record<string, unknown>) => AMapPolylineInstance;
  InfoWindow: new (options?: Record<string, unknown>) => AMapInfoWindowInstance;
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
const LOAD_TIMEOUT_MS = 12_000;
let loading: Promise<AMapApi> | null = null;

export type AMapLoadErrorCode =
  | "ssr"
  | "missing-key"
  | "script-error"
  | "timeout"
  | "api-missing";

export class AMapLoadError extends Error {
  readonly code: AMapLoadErrorCode;

  constructor(code: AMapLoadErrorCode, message: string) {
    super(message);
    this.name = "AMapLoadError";
    this.code = code;
  }
}

function getConfig() {
  return {
    key: process.env.NEXT_PUBLIC_AMAP_JS_KEY?.trim(),
    securityJsCode: process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE?.trim(),
  };
}

function removeFailedScript() {
  document.getElementById(SCRIPT_ID)?.remove();
}

/** Load AMap only in a browser and preserve a useful failure reason for the UI. */
export function loadAMap(): Promise<AMapApi> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new AMapLoadError("ssr", "AMap can only load in a browser."));
  }
  if (window.AMap) return Promise.resolve(window.AMap);
  if (loading) return loading;

  const { key, securityJsCode } = getConfig();
  if (!key) {
    return Promise.reject(
      new AMapLoadError("missing-key", "NEXT_PUBLIC_AMAP_JS_KEY is not configured."),
    );
  }
  // AMap reads this global while the script initializes, so assign it first.
  window._AMapSecurityConfig = securityJsCode ? { securityJsCode } : undefined;

  loading = new Promise<AMapApi>((resolve, reject) => {
    let settled = false;
    const finish = (error?: AMapLoadError) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (error) {
        removeFailedScript();
        reject(error);
      } else if (window.AMap) {
        resolve(window.AMap);
      } else {
        removeFailedScript();
        reject(new AMapLoadError("api-missing", "AMap script loaded without exposing window.AMap."));
      }
    };
    const timer = window.setTimeout(
      () => finish(new AMapLoadError("timeout", "AMap script loading timed out.")),
      LOAD_TIMEOUT_MS,
    );
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");
    script.id = SCRIPT_ID;
    script.onload = () => finish();
    script.onerror = () => finish(new AMapLoadError("script-error", "AMap script failed to load."));
    if (!existing) {
      script.async = true;
      script.src = `${API_URL}&key=${encodeURIComponent(key)}`;
      document.head.appendChild(script);
    } else if (window.AMap) {
      finish();
    }
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
