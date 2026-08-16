import {
  ACTIVITY_TYPES,
  CURRENCY_CODES,
  type Activity,
  type ActivityType,
  type Day,
  type Trip,
} from "@/types/trip";
import { addDays, parseISODate, toISODate } from "@/lib/format";
import type { TKey } from "@/lib/strings";
import {
  Plane,
  BedDouble,
  UtensilsCrossed,
  Map,
  ShoppingBag,
  Ticket,
  Coffee,
  Pin,
  type LucideIcon,
} from "lucide-react";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface TypeMeta {
  /** i18n key; resolve with useI18n().t(...) */
  labelKey: TKey;
  icon: LucideIcon;
  /** tailwind classes for the timeline dot */
  dot: string;
  /** tailwind classes for icon/text accents */
  accent: string;
  /** tailwind classes for soft chips */
  soft: string;
}

export const TYPE_META: Record<ActivityType, TypeMeta> = {
  transportation: {
    labelKey: "typeTransportation",
    icon: Plane,
    dot: "bg-sky-500",
    accent: "text-sky-600",
    soft: "bg-sky-50 text-sky-700",
  },
  hotel: {
    labelKey: "typeHotel",
    icon: BedDouble,
    dot: "bg-violet-500",
    accent: "text-violet-600",
    soft: "bg-violet-50 text-violet-700",
  },
  food: {
    labelKey: "typeFood",
    icon: UtensilsCrossed,
    dot: "bg-amber-500",
    accent: "text-amber-600",
    soft: "bg-amber-50 text-amber-700",
  },
  attraction: {
    labelKey: "typeAttraction",
    icon: Map,
    dot: "bg-emerald-500",
    accent: "text-emerald-600",
    soft: "bg-emerald-50 text-emerald-700",
  },
  shopping: {
    labelKey: "typeShopping",
    icon: ShoppingBag,
    dot: "bg-pink-500",
    accent: "text-pink-600",
    soft: "bg-pink-50 text-pink-700",
  },
  activity: {
    labelKey: "typeActivity",
    icon: Ticket,
    dot: "bg-indigo-500",
    accent: "text-indigo-600",
    soft: "bg-indigo-50 text-indigo-700",
  },
  cafe: {
    labelKey: "typeCafe",
    icon: Coffee,
    dot: "bg-orange-600",
    accent: "text-orange-700",
    soft: "bg-orange-50 text-orange-700",
  },
  other: {
    labelKey: "typeOther",
    icon: Pin,
    dot: "bg-stone-400",
    accent: "text-stone-500",
    soft: "bg-stone-100 text-stone-600",
  },
};

export function isActivityType(v: unknown): v is ActivityType {
  return typeof v === "string" && (ACTIVITY_TYPES as readonly string[]).includes(v);
}

/** Generate one empty Day per calendar date from start to end (inclusive). */
export function buildDays(startDate: string, endDate: string): Day[] {
  const days: Day[] = [];
  const end = parseISODate(endDate);
  let cursor = parseISODate(startDate);
  let guard = 0;
  while (cursor.getTime() <= end.getTime() && guard < 400) {
    const iso = toISODate(cursor);
    days.push({ id: newId(), date: iso, activities: [] });
    cursor = parseISODate(addDays(iso, 1));
    guard += 1;
  }
  return days;
}

export function tripDayCount(trip: Trip): number {
  return trip.days.length;
}

export function createActivity(partial: Partial<Activity> = {}): Activity {
  return {
    id: newId(),
    type: "other",
    title: "",
    time: "",
    createdAt: Date.now(),
    ...partial,
  };
}

/**
 * Insert an activity into a day keeping time order when a time is set,
 * otherwise append at the end.
 */
export function insertActivity(day: Day, activity: Activity): Day {
  if (!activity.time) {
    return { ...day, activities: [...day.activities, activity] };
  }
  const idx = day.activities.findIndex((a) => a.time && a.time > activity.time);
  const activities =
    idx === -1
      ? [...day.activities, activity]
      : [...day.activities.slice(0, idx), activity, ...day.activities.slice(idx)];
  return { ...day, activities };
}

export interface BudgetBreakdown {
  total: number;
  byType: Partial<Record<ActivityType, number>>;
  activityCount: number;
}

/** Only positive, finite costs are counted — zeros are treated as "no cost". */
export function computeBudget(trip: Trip): BudgetBreakdown {
  const byType: Partial<Record<ActivityType, number>> = {};
  let total = 0;
  let activityCount = 0;
  for (const day of trip.days) {
    for (const a of day.activities) {
      activityCount += 1;
      if (typeof a.cost === "number" && isFinite(a.cost) && a.cost > 0) {
        total += a.cost;
        byType[a.type] = (byType[a.type] ?? 0) + a.cost;
      }
    }
  }
  return { total, byType, activityCount };
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function sanitizeActivity(raw: unknown): Activity | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.title !== "string") return null;
  const type = isActivityType(r.type) ? r.type : "other";
  const cost =
    typeof r.cost === "number" && isFinite(r.cost) && r.cost > 0 ? r.cost : undefined;
  return {
    id: typeof r.id === "string" && r.id ? r.id : newId(),
    type,
    title: r.title,
    time: typeof r.time === "string" ? r.time : "",
    location: typeof r.location === "string" && r.location ? r.location : undefined,
    cost,
    notes: typeof r.notes === "string" && r.notes ? r.notes : undefined,
    url: typeof r.url === "string" && r.url ? r.url : undefined,
    createdAt: typeof r.createdAt === "number" ? r.createdAt : Date.now(),
  };
}

function sanitizeDay(raw: unknown): Day | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const date = typeof r.date === "string" && ISO_DATE_RE.test(r.date) ? r.date : null;
  if (!date) return null;
  const activities = Array.isArray(r.activities)
    ? r.activities.map(sanitizeActivity).filter((a): a is Activity => a !== null)
    : [];
  return {
    id: typeof r.id === "string" && r.id ? r.id : newId(),
    date,
    activities,
  };
}

/**
 * Validate and repair a trip loaded from storage or a share link.
 * Returns null when the payload is fundamentally unusable.
 */
export function sanitizeTrip(raw: unknown): Trip | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id) return null;
  const startDate = typeof r.startDate === "string" && ISO_DATE_RE.test(r.startDate) ? r.startDate : null;
  const endDate = typeof r.endDate === "string" && ISO_DATE_RE.test(r.endDate) ? r.endDate : null;
  if (!startDate || !endDate) return null;
  const days = Array.isArray(r.days)
    ? r.days.map(sanitizeDay).filter((d): d is Day => d !== null)
    : [];
  return {
    id: r.id,
    name: typeof r.name === "string" && r.name.trim() ? r.name.trim() : "My Trip",
    destination: typeof r.destination === "string" ? r.destination : "",
    currency:
      typeof r.currency === "string" && CURRENCY_CODES.includes(r.currency)
        ? r.currency
        : "JPY",
    startDate,
    endDate,
    days: days.length > 0 ? days : buildDays(startDate, endDate),
    createdAt: typeof r.createdAt === "number" ? r.createdAt : Date.now(),
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : Date.now(),
  };
}
