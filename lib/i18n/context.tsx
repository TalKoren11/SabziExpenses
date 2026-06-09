"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Locale, Translations } from "./types";
import he from "./he";
import en from "./en";

const DICT: Record<Locale, Translations> = { he, en };

type LangCtx = { locale: Locale; t: (key: string) => string; setLocale: (l: Locale) => void };

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => { setLocale(initialLocale); }, [initialLocale]);

  function t(key: string): string {
    const parts = key.split(".");
    let val: unknown = DICT[locale];
    for (const part of parts) val = (val as Record<string, unknown>)?.[part];
    return typeof val === "string" ? val : key;
  }

  return <Ctx.Provider value={{ locale, t, setLocale }}>{children}</Ctx.Provider>;
}

export function useTranslation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTranslation must be used inside LanguageProvider");
  return ctx;
}
