"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import type { Product } from "@/lib/types";
import { getProductByHandle } from "@/lib/data/products";
import { parseStoredHandles } from "./storage";
import { usePersistedState } from "./use-persisted-state";

interface WishlistContextValue {
  handles: string[];
  count: number;
  toggle: (handle: string) => void;
  isWishlisted: (handle: string) => boolean;
  getProducts: () => Product[];
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "ylw-wishlist";
const parseWishlist = (stored: string | null) =>
  parseStoredHandles(stored, (handle) => Boolean(getProductByHandle(handle)));

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [handles, setHandles] = usePersistedState<string[]>(
    STORAGE_KEY,
    [],
    parseWishlist,
  );

  const toggle = useCallback((handle: string) => {
    if (!getProductByHandle(handle)) return;
    setHandles((prev) =>
      prev.includes(handle)
        ? prev.filter((h) => h !== handle)
        : [...prev, handle],
    );
  }, [setHandles]);

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
