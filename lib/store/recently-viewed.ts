"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ylw-recently-viewed";
const HISTORY_LIMIT = 12;

export function getRecentlyViewedHandles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]",
    );
    if (!Array.isArray(stored)) return [];
    return [
      ...new Set(
        stored.filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0,
        ),
      ),
    ].slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const [handles, setHandles] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setHandles(getRecentlyViewedHandles()),
      0,
    );
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null)
        setHandles(getRecentlyViewedHandles());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Stable identity prevents the product-page effect from recording on every render.
  const addViewed = useCallback((handle: string) => {
    const next = [
      handle,
      ...getRecentlyViewedHandles().filter((value) => value !== handle),
    ].slice(0, HISTORY_LIMIT);
    setHandles(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Browsing still works when storage is blocked or full.
    }
  }, []);

  return { handles, addViewed };
}
