export const ACTIVITY_TYPES = [
  "transportation",
  "hotel",
  "food",
  "attraction",
  "shopping",
  "activity",
  "cafe",
  "other",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  /** "HH:MM" in 24h format, or "" when unset */
  time: string;
  location?: string;
  /** Positive number; absent when the activity has no recorded cost */
  cost?: number;
  notes?: string;
  url?: string;
  createdAt: number;
}

export interface Day {
  id: string;
  /** ISO date "yyyy-MM-dd" (local) */
  date: string;
  activities: Activity[];
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  /** ISO 4217 currency code, e.g. "JPY" */
  currency: string;
  /** ISO date "yyyy-MM-dd" (local) */
  startDate: string;
  endDate: string;
  days: Day[];
  createdAt: number;
  updatedAt: number;
  /** V0.3 cloud fields (optional for local/guest trips) */
  slug?: string;
  visibility?: TripVisibility;
  status?: TripStatus;
  theme?: ThemeId;
  cover?: string;
  showBudget?: boolean;
  showNotes?: boolean;
}

/* ── V0.3 cloud enums ─────────────────────────────────────────── */

export const VISIBILITIES = ["private", "unlisted", "public"] as const;
export type TripVisibility = (typeof VISIBILITIES)[number];

export const TRIP_STATUSES = ["draft", "planning", "ready", "completed"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const THEMES = [
  { id: "minimal", pro: false },
  { id: "classic", pro: false },
  { id: "mono", pro: false },
  { id: "japan", pro: true },
  { id: "pastel", pro: true },
  { id: "retro", pro: true },
  { id: "luxury", pro: true },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const COVERS = ["tokyo", "seoul", "paris", "singapore", "taipei"] as const;
export type CoverId = (typeof COVERS)[number];

export function isVisibility(v: unknown): v is TripVisibility {
  return typeof v === "string" && (VISIBILITIES as readonly string[]).includes(v);
}

export function isTheme(v: unknown): v is ThemeId {
  return typeof v === "string" && (THEMES as readonly { id: string }[]).some((t) => t.id === v);
}

export function isTripStatus(v: unknown): v is TripStatus {
  return typeof v === "string" && (TRIP_STATUSES as readonly string[]).includes(v);
}

export const CURRENCIES = [
  { code: "USD", label: "USD $", symbol: "$", locale: "en-US" },
  { code: "EUR", label: "EUR €", symbol: "€", locale: "de-DE" },
  { code: "GBP", label: "GBP £", symbol: "£", locale: "en-GB" },
  { code: "JPY", label: "JPY ¥", symbol: "¥", locale: "ja-JP" },
  { code: "CNY", label: "CNY ¥", symbol: "¥", locale: "zh-CN" },
  { code: "KRW", label: "KRW ₩", symbol: "₩", locale: "ko-KR" },
  { code: "TWD", label: "TWD NT$", symbol: "NT$", locale: "zh-TW" },
  { code: "SGD", label: "SGD $", symbol: "$", locale: "en-SG" },
] as const;

export const CURRENCY_CODES: readonly string[] = CURRENCIES.map((c) => c.code);

export function currencyInfo(code: string) {
  return (
    CURRENCIES.find((c) => c.code === code) ?? {
      code,
      label: code,
      symbol: code,
      locale: "en-US",
    }
  );
}
