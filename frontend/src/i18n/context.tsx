import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  content,
  DEFAULT_LOCALE,
  type Locale,
  type ContentKey,
} from "./content";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: ContentKey) => string;
  td: (district: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "smartestate_locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    return saved && ["hy", "ru", "en"].includes(saved) ? saved : DEFAULT_LOCALE;
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: ContentKey): string => {
      const entry = content[key];
      if (typeof entry === "object" && "hy" in entry) {
        return entry[locale];
      }
      return String(entry);
    },
    [locale]
  );

  const td = useCallback(
    (district: string): string => {
      const map = content.districts as Record<string, Record<Locale, string>>;
      return map[district]?.[locale] ?? district;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, td }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
