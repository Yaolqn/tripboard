import type { ActivityType, Trip } from "@/types/trip";
import { saveTrip } from "@/lib/storage";
import { addDays, todayISO } from "@/lib/format";
import { newId } from "@/lib/trip-utils";

/**
 * Sample trips for the landing page. Clicking an example card creates a real,
 * fully editable trip in localStorage — no fake buttons.
 */

interface Seed {
  time: string;
  type: ActivityType;
  title: string;
  location?: string;
  cost?: number;
}

const TOKYO: Seed[][] = [
  [
    { time: "09:30", type: "transportation", title: "Flight · Singapore → Tokyo", location: "Narita Airport", cost: 52000 },
    { time: "14:00", type: "hotel", title: "Check in", location: "Shibuya Hotel", cost: 24000 },
    { time: "17:30", type: "food", title: "Ramen at Ichiran", location: "Shibuya", cost: 1500 },
    { time: "19:00", type: "attraction", title: "Shibuya Crossing", location: "Shibuya" },
  ],
  [
    { time: "08:30", type: "cafe", title: "Blue Bottle Coffee", location: "Aoyama", cost: 800 },
    { time: "09:30", type: "attraction", title: "Senso-ji Temple", location: "Asakusa" },
    { time: "11:30", type: "food", title: "Sushi lunch", location: "Toyosu Market", cost: 4500 },
    { time: "14:00", type: "attraction", title: "teamLab Planets", location: "Toyosu", cost: 3200 },
    { time: "18:00", type: "food", title: "Yakitori dinner", location: "Shinjuku", cost: 2800 },
  ],
  [
    { time: "09:00", type: "attraction", title: "Meiji Shrine", location: "Harajuku" },
    { time: "10:30", type: "shopping", title: "Harajuku & Takeshita St", cost: 8500 },
    { time: "13:00", type: "food", title: "Katsu curry", location: "Omotesando", cost: 1600 },
    { time: "15:00", type: "activity", title: "Shibuya Sky observatory", cost: 2200 },
    { time: "19:00", type: "food", title: "Izakaya night", location: "Golden Gai", cost: 3800 },
  ],
  [
    { time: "09:00", type: "attraction", title: "Ghibli Museum", location: "Mitaka", cost: 2500 },
    { time: "12:00", type: "food", title: "Okonomiyaki", location: "Nakano", cost: 1800 },
    { time: "14:00", type: "attraction", title: "Shinjuku Gyoen Garden", cost: 700 },
    { time: "18:00", type: "shopping", title: "Akihabara arcades", cost: 12000 },
    { time: "20:00", type: "food", title: "Late-night ramen", cost: 1200 },
  ],
  [
    { time: "09:00", type: "hotel", title: "Check out", location: "Shibuya Hotel" },
    { time: "10:00", type: "shopping", title: "Omotesando boutiques", cost: 6000 },
    { time: "13:00", type: "food", title: "Soba lunch", location: "Tokyo Station", cost: 1400 },
    { time: "15:30", type: "transportation", title: "Airport transfer", location: "Narita", cost: 3200 },
  ],
];

const SEOUL: Seed[][] = [
  [
    { time: "10:00", type: "transportation", title: "Flight · Singapore → Seoul", location: "Incheon Airport", cost: 380000 },
    { time: "14:00", type: "hotel", title: "Check in", location: "Myeongdong", cost: 210000 },
    { time: "17:30", type: "food", title: "Bibimbap dinner", location: "Myeongdong", cost: 12000 },
    { time: "19:30", type: "attraction", title: "N Seoul Tower", cost: 16000 },
  ],
  [
    { time: "08:30", type: "cafe", title: "Morning coffee", location: "Bukchon", cost: 7000 },
    { time: "09:30", type: "attraction", title: "Gyeongbokgung Palace", cost: 3000 },
    { time: "12:00", type: "food", title: "Ginseng chicken soup", cost: 15000 },
    { time: "14:00", type: "shopping", title: "Insadong galleries", cost: 45000 },
    { time: "18:30", type: "food", title: "Korean BBQ", location: "Hongdae", cost: 42000 },
  ],
  [
    { time: "09:00", type: "attraction", title: "Bukchon Hanok Village" },
    { time: "11:30", type: "shopping", title: "Hongdae shopping", cost: 38000 },
    { time: "14:00", type: "activity", title: "Han River bike ride", cost: 18000 },
    { time: "18:00", type: "food", title: "Fried chicken & beer", cost: 26000 },
  ],
  [
    { time: "09:30", type: "activity", title: "DMZ tour", cost: 75000 },
    { time: "15:00", type: "cafe", title: "Cafe hopping", location: "Seongsu", cost: 9000 },
    { time: "18:30", type: "food", title: "Tteokbokki street food", cost: 8000 },
    { time: "20:00", type: "activity", title: "Noraebang night", cost: 30000 },
  ],
];

const TAIPEI: Seed[][] = [
  [
    { time: "10:30", type: "transportation", title: "Flight · Singapore → Taipei", location: "Taoyuan Airport", cost: 12000 },
    { time: "14:00", type: "hotel", title: "Check in", location: "Ximending", cost: 4200 },
    { time: "16:30", type: "food", title: "Beef noodle soup", cost: 220 },
    { time: "19:00", type: "attraction", title: "Taipei 101 observatory", cost: 600 },
  ],
  [
    { time: "08:30", type: "food", title: "Dan bing breakfast", cost: 90 },
    { time: "09:30", type: "attraction", title: "Chiang Kai-shek Memorial Hall" },
    { time: "11:30", type: "activity", title: "Yongkang Street stroll" },
    { time: "13:00", type: "food", title: "Din Tai Fung", location: "Xinyi", cost: 850 },
    { time: "15:00", type: "attraction", title: "National Palace Museum", cost: 350 },
    { time: "18:30", type: "food", title: "Shilin Night Market", cost: 400 },
  ],
  [
    { time: "09:00", type: "transportation", title: "Train to Ruifang", cost: 120 },
    { time: "10:30", type: "attraction", title: "Jiufen Old Street" },
    { time: "13:00", type: "food", title: "Tea house lunch", location: "Jiufen", cost: 380 },
    { time: "16:30", type: "attraction", title: "Shifen Waterfall" },
    { time: "19:00", type: "food", title: "Hotpot dinner", cost: 900 },
  ],
  [
    { time: "09:30", type: "activity", title: "Yangmingshan hike" },
    { time: "12:30", type: "food", title: "Hot spring restaurant", cost: 650 },
    { time: "15:00", type: "cafe", title: "Specialty coffee", cost: 180 },
    { time: "18:00", type: "shopping", title: "Ximending shopping", cost: 2500 },
  ],
];

const DEMOS: Record<string, { name: string; destination: string; currency: string; days: Seed[][] }> = {
  tokyo: { name: "Tokyo Summer Trip", destination: "Tokyo, Japan", currency: "JPY", days: TOKYO },
  seoul: { name: "Seoul Trip", destination: "Seoul, South Korea", currency: "KRW", days: SEOUL },
  taipei: { name: "Taipei Trip", destination: "Taipei, Taiwan", currency: "TWD", days: TAIPEI },
};

export interface DemoCard {
  key: string;
  destination: string;
  /** number of days — rendered through the i18n dayCount helper */
  days: number;
  title: string;
}

export const DEMO_CARDS: DemoCard[] = [
  { key: "tokyo", destination: "Tokyo", days: 5, title: "Tokyo Summer Trip" },
  { key: "seoul", destination: "Seoul", days: 4, title: "Seoul Trip" },
  { key: "taipei", destination: "Taipei", days: 4, title: "Taipei Trip" },
];

/**
 * Build a sample trip (starting a few days from now) WITHOUT persisting it —
 * used by the landing-page demo timeline. Dates are derived from today, so
 * the demo always looks current.
 */
export function buildDemoTrip(key: string): Trip | null {
  const demo = DEMOS[key];
  if (!demo) return null;
  const startDate = todayISO();
  const endDate = addDays(startDate, demo.days.length - 1);
  const now = Date.now();
  const trip: Trip = {
    id: `demo-${key}-${startDate}`,
    name: demo.name,
    destination: demo.destination,
    currency: demo.currency,
    startDate,
    endDate,
    days: demo.days.map((seeds, i) => ({
      id: `demo-${key}-day-${i}`,
      date: addDays(startDate, i),
      activities: seeds.map((s, idx) => ({
        id: `demo-${key}-${i}-${idx}`,
        type: s.type,
        title: s.title,
        time: s.time,
        location: s.location,
        cost: s.cost,
        createdAt: now + idx,
      })),
    })),
    createdAt: now,
    updatedAt: now,
  };
  return trip;
}

/** Create a real sample trip and save it to localStorage. */
export function createDemoTrip(key: string): Trip | null {
  const trip = buildDemoTrip(key);
  if (!trip) return null;
  // Ensure a fresh id so repeated clicks create separate trips.
  trip.id = newId();
  trip.days = trip.days.map((d) => ({ ...d, id: newId() }));
  saveTrip(trip);
  return trip;
}
