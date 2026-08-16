"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { setDateLocale } from "@/lib/format";
import { translations, type Language, type TKey } from "@/lib/strings";

const LANGUAGE_KEY = "tripboard.lang";

function detectLanguage(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(LANGUAGE_KEY);
    if (saved === "en" || saved === "zh") return saved;
  } catch {
    // ignore storage errors
  }
  return typeof navigator !== "undefined" &&
    navigator.language.toLowerCase().startsWith("zh")
    ? "zh"
    : "en";
}

interface I18nValue {
  lang: Language;
  setLang: (l: Language) => void;
  toggle: () => void;
  t: (key: TKey) => string;
  /** "Day 1" / "第 1 天" */
  dayLabel: (n: number) => string;
  /** "5 days" / "5 天" (handles the English singular) */
  dayCount: (n: number) => string;
  /** "3 activities" / "3 个活动" */
  activityCount: (n: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const detected = detectLanguage();
    setLangState(detected);
    setDateLocale(detected);
    document.documentElement.lang = detected;
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    setDateLocale(l);
    document.documentElement.lang = l;
    try {
      window.localStorage.setItem(LANGUAGE_KEY, l);
    } catch {
      // ignore storage errors
    }
  };

  const value: I18nValue = {
    lang,
    setLang,
    toggle: () => setLang(lang === "en" ? "zh" : "en"),
    t: (key) => translations[lang][key] ?? translations.en[key] ?? key,
    dayLabel: (n) => (lang === "zh" ? `第 ${n} 天` : `Day ${n}`),
    dayCount: (n) =>
      lang === "zh" ? `${n} 天` : n === 1 ? "1 day" : `${n} days`,
    activityCount: (n) =>
      lang === "zh" ? `${n} 个活动` : n === 1 ? "1 activity" : `${n} activities`,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
