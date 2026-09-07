"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product } from "@/lib/types";
import { getProductByHandle } from "@/lib/data/products";

interface WishlistContextValue {
  handles: string[];
  count: number;
  toggle: (handle: string) => void;
  isWishlisted: (handle: string) => boolean;
  getProducts: () => Product[];
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "ylw-wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [handles, setHandles] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setHandles([
              ...new Set(
                parsed.filter(
                  (handle): handle is string =>
                    typeof handle === "string" &&
                    Boolean(getProductByHandle(handle)),
                ),
              ),
            ]);
          }
        }
      } catch {
        /* ignore */
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(handles));
    }
  }, [handles, hydrated]);

  const toggle = useCallback((handle: string) => {
    setHandles((prev) =>
      prev.includes(handle)
        ? prev.filter((h) => h !== handle)
        : [...prev, handle],
    );
  }, []);

  const isWishlisted = useCallback(
    (handle: string) => handles.includes(handle),
    [handles],
  );

  const getProducts = useCallback(
    () =>
      handles
        .map((h) => getProductByHandle(h))
        .filter((p): p is Product => Boolean(p)),
    [handles],
  );

  const value = useMemo(
    () => ({
      handles,
      count: handles.length,
      toggle,
      isWishlisted,
      getProducts,
    }),
    [handles, toggle, isWishlisted, getProducts],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
