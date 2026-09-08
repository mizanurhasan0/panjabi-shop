"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { messages } from "./translations";
import { translateMessage } from "./translate";

export type AdminLanguage = "en" | "bn";
const storageKey = "panjabi-admin-language";
const listeners = new Set<() => void>();
let preference: AdminLanguage = "en";
let initialized = false;
let sessionOnly = false;

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(storageKey);
    preference = stored === "bn" ? "bn" : "en";
  } catch {
    /* Keep the session preference when browser storage is unavailable. */
  }
}
function getLanguage(): AdminLanguage {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    readStoredLanguage();
  }
  return preference;
}
function onStorage(event: StorageEvent) {
  if (event.key !== storageKey && event.key !== null) return;
  try {
    if (event.storageArea && event.storageArea !== localStorage) return;
  } catch {
    return;
  }
  preference =
    event.key === storageKey && event.newValue === "bn" ? "bn" : "en";
  initialized = true;
  sessionOnly = false;
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("storage", onStorage);
    // Catch changes made while no admin page was mounted.
    if (!sessionOnly) readStoredLanguage();
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}
function setLanguage(language: AdminLanguage) {
  preference = language;
  initialized = true;
  try {
    localStorage.setItem(storageKey, language);
    sessionOnly = false;
  } catch {
    sessionOnly = true;
  }
  listeners.forEach((listener) => listener());
}
function createLanguageTools(language: AdminLanguage) {
  const locale = language === "bn" ? "bn-BD" : "en-BD";
  const number = new Intl.NumberFormat(locale);
  const currency = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BDT",
  });
  const dates = new Map<string, Intl.DateTimeFormat>();
  return {
    language,
    locale,
    setLanguage,
    t(english: string, params: Record<string, string | number> = {}) {
      return translateMessage(english, language, messages, params);
    },
    formatCurrency: (value: number) => currency.format(value),
    formatNumber: (value: number) => number.format(value),
    formatDate(
      value: string | Date,
      options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    ) {
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return "—";
      const key = JSON.stringify(options);
      let formatter = dates.get(key);
      if (!formatter) {
        formatter = new Intl.DateTimeFormat(locale, {
          timeZone: "Asia/Dhaka",
          ...options,
        });
        dates.set(key, formatter);
      }
      return formatter.format(date);
    },
  };
}
const LanguageContext = createContext<ReturnType<
  typeof createLanguageTools
> | null>(null);
export function AdminLanguageProvider({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const language = useSyncExternalStore(
    subscribe,
    getLanguage,
    () => "en" as const,
  );
  const value = useMemo(() => createLanguageTools(language), [language]);
  return (
    <LanguageContext.Provider value={value}>
      <div lang={language} className={className}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}
export function useAdminLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("Admin language provider is missing.");
  return context;
}
