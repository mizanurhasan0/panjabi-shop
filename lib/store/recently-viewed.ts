"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isStorageChange,
  parseStoredHandles,
  readStorage,
  writeStorage,
} from "./storage";

const STORAGE_KEY = "ylw-recently-viewed";
const HISTORY_LIMIT = 12;

export function getRecentlyViewedHandles(): string[] {
  return parseStoredHandles(readStorage(STORAGE_KEY)).slice(0, HISTORY_LIMIT);
}

export function useRecentlyViewed() {
  const [handles, setHandles] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setHandles(getRecentlyViewedHandles()),
      0,
    );
    const onStorage = (event: StorageEvent) => {
      if (isStorageChange(event, STORAGE_KEY))
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
    if (!handle) return;
    const next = [
      handle,
      ...getRecentlyViewedHandles().filter((value) => value !== handle),
    ].slice(0, HISTORY_LIMIT);
    setHandles(next);
    writeStorage(STORAGE_KEY, JSON.stringify(next));
  }, []);

  return { handles, addViewed };
}
