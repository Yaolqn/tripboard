import { currencyInfo } from "@/types/trip";

/**
 * UI language for date formatting ("en" | "zh"). Set by the LanguageProvider;
 * defaults to English so server-rendered output is deterministic.
 */
let dateLocale: "en" | "zh" = "en";

export function setDateLocale(locale: "en" | "zh") {
  dateLocale = locale;
}

export function getDateLocale() {
  return dateLocale;
}

/** Parse an ISO "yyyy-MM-dd" string as a *local* date (no UTC shift). */
export function parseISODate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Add n days to an ISO date, returning a new ISO date. */
export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

function short(date: Date): string {
  return new Intl.DateTimeFormat(dateLocale, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function weekday(date: Date): string {
  return new Intl.DateTimeFormat(dateLocale, { weekday: "short" }).format(date);
}

function full(date: Date): string {
  return new Intl.DateTimeFormat(dateLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatShort(date: Date): string {
  return short(date);
}

export function formatWeekday(date: Date): string {
  return weekday(date);
}

export function formatFull(date: Date): string {
  return full(date);
}

export function formatISODateShort(iso: string): string {
  return short(parseISODate(iso));
}

export function formatISODateFull(iso: string): string {
  return full(parseISODate(iso));
}

/** "Aug 20 — Aug 25"; includes year only when it differs from start. */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = parseISODate(startIso);
  const end = parseISODate(endIso);
  const s = short(start);
  const e = start.getFullYear() === end.getFullYear() ? short(end) : full(end);
  return `${s} — ${e}`;
}

export function formatMoney(amount: number, currency: string): string {
  if (!isFinite(amount)) return "";
  const { locale } = currencyInfo(currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount}`;
  }
}

/** "09:30" stays as-is; empty becomes "—". */
export function formatTime(time: string): string {
  return time || "—";
}

export function todayISO(): string {
  return toISODate(new Date());
}
