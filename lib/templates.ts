import type { ActivityType, ThemeId } from "@/types/trip";

/**
 * Code-defined travel templates (V0.3). Templates are public, static data —
 * they double as SEO landing pages. "Use this template" copies one into a
 * new cloud trip for the signed-in user.
 */

export interface TemplateActivity {
  time: string;
  type: ActivityType;
  title: string;
  location?: string;
  cost?: number;
}

export interface TemplateDay {
  title: string;
  activities: TemplateActivity[];
}

export interface TravelTemplate {
  slug: string;
  title: string;
  destination: string;
  currency: string;
  description: string;
  days: TemplateDay[];
  theme?: ThemeId;
  cover?: string;
}

const t = (
  time: string,
  type: ActivityType,
  title: string,
  location?: string,
  cost?: number
): TemplateActivity => ({ time, type, title, location, cost });

export const TEMPLATES: TravelTemplate[] = [
  {
    slug: "tokyo-5-day-first-trip",
    title: "Tokyo 5-Day First Trip",
    destination: "Tokyo, Japan",
    currency: "JPY",
    description: "A simple first-time Tokyo itinerary covering the classics.",
    theme: "minimal",
    cover: "tokyo",
    days: [
      {
        title: "Arrival & Shibuya",
        activities: [
          t("09:30", "transportation", "Flight · Singapore → Tokyo", "Narita Airport", 52000),
          t("14:00", "hotel", "Check in", "Shibuya Hotel", 24000),
          t("17:30", "food", "Ramen at Ichiran", "Shibuya", 1500),
          t("19:00", "attraction", "Shibuya Crossing", "Shibuya"),
        ],
      },
      {
        title: "Asakusa & Ueno",
        activities: [
          t("08:30", "cafe", "Blue Bottle Coffee", "Aoyama", 800),
          t("09:30", "attraction", "Senso-ji Temple", "Asakusa"),
          t("11:30", "food", "Sushi lunch", "Toyosu Market", 4500),
          t("14:00", "attraction", "teamLab Planets", "Toyosu", 3200),
          t("18:00", "food", "Yakitori dinner", "Shinjuku", 2800),
        ],
      },
      {
        title: "Harajuku & Shibuya",
        activities: [
          t("09:00", "attraction", "Meiji Shrine", "Harajuku"),
          t("10:30", "shopping", "Harajuku & Takeshita St", undefined, 8500),
          t("13:00", "food", "Katsu curry", "Omotesando", 1600),
          t("15:00", "activity", "Shibuya Sky observatory", undefined, 2200),
          t("19:00", "food", "Izakaya night", "Golden Gai", 3800),
        ],
      },
      {
        title: "Ghibli & Akihabara",
        activities: [
          t("09:00", "attraction", "Ghibli Museum", "Mitaka", 2500),
          t("12:00", "food", "Okonomiyaki", "Nakano", 1800),
          t("14:00", "attraction", "Shinjuku Gyoen Garden", undefined, 700),
          t("18:00", "shopping", "Akihabara arcades", undefined, 12000),
        ],
      },
      {
        title: "Departure",
        activities: [
          t("09:00", "hotel", "Check out", "Shibuya Hotel"),
          t("10:00", "shopping", "Omotesando boutiques", undefined, 6000),
          t("13:00", "food", "Soba lunch", "Tokyo Station", 1400),
          t("15:30", "transportation", "Airport transfer", "Narita", 3200),
        ],
      },
    ],
  },
  {
    slug: "tokyo-food-trip",
    title: "Tokyo Food Trip",
    destination: "Tokyo, Japan",
    currency: "JPY",
    description: "Eat your way through Tokyo — ramen, sushi, izakaya and more.",
    theme: "classic",
    cover: "tokyo",
    days: [
      {
        title: "Tsukiji & Ginza",
        activities: [
          t("07:00", "food", "Tsukiji outer market", undefined, 2500),
          t("10:00", "food", "Omakase sushi lunch", "Ginza", 12000),
          t("15:00", "cafe", "Specialty coffee", "Ginza", 900),
          t("19:00", "food", "Kaiseki dinner", "Ginza", 15000),
        ],
      },
      {
        title: "Ramen crawl",
        activities: [
          t("08:00", "cafe", "Morning toast & coffee", "Omotesando", 800),
          t("12:00", "food", "Tonkotsu ramen", "Iidabashi", 1100),
          t("15:00", "food", "Taiyaki & street snacks", "Nakamise", 600),
          t("19:00", "food", "Soba tasting", "Kanda", 2000),
        ],
      },
      {
        title: "Izakaya night",
        activities: [
          t("11:00", "food", "Tempura lunch", "Nihonbashi", 3500),
          t("15:00", "food", "Monjayaki", "Tsukishima", 1800),
          t("19:30", "food", "Izakaya crawl", "Omoide Yokocho", 6000),
        ],
      },
    ],
  },
  {
    slug: "seoul-4-day-trip",
    title: "Seoul 4-Day Trip",
    destination: "Seoul, South Korea",
    currency: "KRW",
    description: "Palaces, street food and night markets in four days.",
    theme: "minimal",
    cover: "seoul",
    days: [
      {
        title: "Arrival & Myeongdong",
        activities: [
          t("10:00", "transportation", "Flight · Singapore → Seoul", "Incheon Airport", 380000),
          t("14:00", "hotel", "Check in", "Myeongdong", 210000),
          t("17:30", "food", "Bibimbap dinner", "Myeongdong", 12000),
          t("19:30", "attraction", "N Seoul Tower", undefined, 16000),
        ],
      },
      {
        title: "Palaces & Insadong",
        activities: [
          t("08:30", "cafe", "Morning coffee", "Bukchon", 7000),
          t("09:30", "attraction", "Gyeongbokgung Palace", undefined, 3000),
          t("12:00", "food", "Ginseng chicken soup", undefined, 15000),
          t("14:00", "shopping", "Insadong galleries", undefined, 45000),
          t("18:30", "food", "Korean BBQ", "Hongdae", 42000),
        ],
      },
      {
        title: "Hanok & Han River",
        activities: [
          t("09:00", "attraction", "Bukchon Hanok Village"),
          t("11:30", "shopping", "Hongdae shopping", undefined, 38000),
          t("14:00", "activity", "Han River bike ride", undefined, 18000),
          t("18:00", "food", "Fried chicken & beer", undefined, 26000),
        ],
      },
      {
        title: "DMZ & Departure",
        activities: [
          t("09:30", "activity", "DMZ tour", undefined, 75000),
          t("15:00", "cafe", "Cafe hopping", "Seongsu", 9000),
          t("18:30", "food", "Tteokbokki street food", undefined, 8000),
        ],
      },
    ],
  },
  {
    slug: "seoul-cafe-trip",
    title: "Seoul Cafe Trip",
    destination: "Seoul, South Korea",
    currency: "KRW",
    description: "Seongsu, Yeonnam and Hongdae — Seoul's best coffee spots.",
    theme: "classic",
    cover: "seoul",
    days: [
      {
        title: "Seongsu",
        activities: [
          t("10:00", "cafe", "Onion Seongsu", undefined, 9000),
          t("12:00", "food", "Pasta lunch", "Seongsu", 22000),
          t("14:30", "cafe", "Daelim Changgo", undefined, 8000),
          t("17:00", "shopping", "Seongsu vintage", undefined, 30000),
        ],
      },
      {
        title: "Yeonnam",
        activities: [
          t("10:30", "cafe", "Yeonnam-dong brunch", undefined, 16000),
          t("13:00", "cafe", "Toast House", undefined, 7000),
          t("15:30", "activity", "Hongdae street art walk"),
          t("19:00", "food", "Local BBQ", "Hongdae", 40000),
        ],
      },
    ],
  },
  {
    slug: "taipei-4-day-trip",
    title: "Taipei 4-Day Trip",
    destination: "Taipei, Taiwan",
    currency: "TWD",
    description: "Night markets, temples and tea houses in Taipei.",
    theme: "minimal",
    cover: "taipei",
    days: [
      {
        title: "Arrival & Taipei 101",
        activities: [
          t("10:30", "transportation", "Flight · Singapore → Taipei", "Taoyuan Airport", 12000),
          t("14:00", "hotel", "Check in", "Ximending", 4200),
          t("16:30", "food", "Beef noodle soup", undefined, 220),
          t("19:00", "attraction", "Taipei 101 observatory", undefined, 600),
        ],
      },
      {
        title: "Old Taipei",
        activities: [
          t("08:30", "food", "Dan bing breakfast", undefined, 90),
          t("09:30", "attraction", "Chiang Kai-shek Memorial Hall"),
          t("13:00", "food", "Din Tai Fung", "Xinyi", 850),
          t("15:00", "attraction", "National Palace Museum", undefined, 350),
          t("18:30", "food", "Shilin Night Market", undefined, 400),
        ],
      },
      {
        title: "Jiufen & Shifen",
        activities: [
          t("09:00", "transportation", "Train to Ruifang", undefined, 120),
          t("10:30", "attraction", "Jiufen Old Street"),
          t("13:00", "food", "Tea house lunch", "Jiufen", 380),
          t("16:30", "attraction", "Shifen Waterfall"),
        ],
      },
      {
        title: "Nature & Departure",
        activities: [
          t("09:30", "activity", "Yangmingshan hike"),
          t("12:30", "food", "Hot spring restaurant", undefined, 650),
          t("15:00", "cafe", "Specialty coffee", undefined, 180),
          t("18:00", "shopping", "Ximending shopping", undefined, 2500),
        ],
      },
    ],
  },
  {
    slug: "singapore-3-day-trip",
    title: "Singapore 3-Day Trip",
    destination: "Singapore",
    currency: "SGD",
    description: "Hawker food, gardens and a skyline in three days.",
    theme: "minimal",
    cover: "singapore",
    days: [
      {
        title: "Marina Bay",
        activities: [
          t("12:00", "food", "Lunch at Lau Pa Sat", undefined, 18),
          t("14:00", "attraction", "Gardens by the Bay", undefined, 28),
          t("17:00", "hotel", "Check in", "Marina Bay", 320),
          t("19:30", "attraction", "Marina Bay Sands light show"),
        ],
      },
      {
        title: "Chinatown & Kampong",
        activities: [
          t("09:00", "food", "Kaya toast breakfast", "Tong Shing", 8),
          t("10:30", "attraction", "Buddha Tooth Relic Temple"),
          t("13:00", "food", "Hainanese chicken rice", "Maxwell", 6),
          t("15:00", "attraction", "Kampong Glam & Haji Lane"),
          t("19:00", "food", "Chilli crab dinner", undefined, 90),
        ],
      },
      {
        title: "Sentosa",
        activities: [
          t("09:30", "activity", "Sentosa cable car", undefined, 35),
          t("12:00", "food", "Beach club lunch", "Palawan", 45),
          t("15:00", "attraction", "Universal Studios", undefined, 83),
          t("19:30", "transportation", "Airport transfer"),
        ],
      },
    ],
  },
  {
    slug: "paris-7-day-trip",
    title: "Paris 7-Day Trip",
    destination: "Paris, France",
    currency: "EUR",
    description: "Museums, cafés and arrondissements over a week in Paris.",
    theme: "classic",
    cover: "paris",
    days: [
      {
        title: "Arrival & Louvre",
        activities: [
          t("14:00", "hotel", "Check in", "Le Marais", 180),
          t("16:00", "attraction", "Louvre Museum", undefined, 22),
          t("19:30", "food", "Bistro dinner", "Le Marais", 45),
        ],
      },
      {
        title: "Montmartre",
        activities: [
          t("09:30", "attraction", "Sacré-Cœur", "Montmartre"),
          t("11:30", "cafe", "Café de Flore style brunch", undefined, 20),
          t("14:00", "attraction", "Musée de l'Orangerie", undefined, 12),
          t("19:00", "food", "Crêpes & cider", undefined, 25),
        ],
      },
      {
        title: "Seine & Eiffel",
        activities: [
          t("10:00", "attraction", "Eiffel Tower", undefined, 30),
          t("13:00", "food", "Picnic by the Seine", undefined, 18),
          t("15:00", "activity", "Seine river cruise", undefined, 20),
          t("19:30", "food", "Dinner with a view", "Trocadéro", 70),
        ],
      },
      {
        title: "Versailles",
        activities: [
          t("09:00", "transportation", "Train to Versailles", undefined, 7),
          t("10:30", "attraction", "Château de Versailles", undefined, 21),
          t("16:00", "food", "Market dinner", "Le Marais", 35),
        ],
      },
      {
        title: "Marais & Shopping",
        activities: [
          t("10:00", "shopping", "Le Marais boutiques", undefined, 150),
          t("13:00", "food", "Falafel at L'As du Fallafel", undefined, 12),
          t("15:00", "attraction", "Centre Pompidou", undefined, 15),
          t("19:00", "food", "Wine bar tasting", undefined, 40),
        ],
      },
      {
        title: "Orsay & Latin Quarter",
        activities: [
          t("09:30", "attraction", "Musée d'Orsay", undefined, 16),
          t("13:00", "food", "Bouillon lunch", "Latin Quarter", 22),
          t("15:30", "attraction", "Luxembourg Gardens"),
          t("19:00", "food", "Cheese & baguette night", undefined, 30),
        ],
      },
      {
        title: "Departure",
        activities: [
          t("09:00", "hotel", "Check out"),
          t("10:30", "cafe", "Last café & croissant", undefined, 8),
          t("12:30", "transportation", "Airport transfer"),
        ],
      },
    ],
  },
];

export function getTemplate(slug: string): TravelTemplate | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}
