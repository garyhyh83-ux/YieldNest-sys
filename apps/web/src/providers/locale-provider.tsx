"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { en, zh, type Locale, type TranslationKey } from "@/lib/i18n/translations";

interface LocaleState {
  locale: Locale;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  toggleLocale: () => void;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleState | null>(null);

function getInitialLocale(): Locale {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("yn_locale") as Locale | null;
    if (stored === "en" || stored === "zh") return stored;
    // Detect browser language
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith("zh")) return "zh";
  }
  return "zh";
}

const dicts: Record<Locale, Record<TranslationKey, string>> = { en, zh };

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      let text: string = dicts[locale][key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [locale]
  );

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("yn_locale", l);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "zh" : "en");
  }, [locale, setLocale]);

  return (
    <LocaleContext.Provider value={{ locale, t, toggleLocale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleState {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export { type Locale };
