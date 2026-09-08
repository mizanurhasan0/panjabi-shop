"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { CartItem, Product, ProductVariant } from "@/lib/types";
import { useCatalog } from "./catalog";
import { usePersistedState } from "./use-persisted-state";

interface CartContextValue {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  items: CartItem[];
  count: number;
  subtotal: number;
  note: string;
  setNote: (note: string) => void;
  addItem: (
    product: Product,
    variant: ProductVariant,
    quantity?: number,
  ) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getLineItems: () => Array<{
    item: CartItem;
    product: Product;
    variant: ProductVariant;
    lineTotal: number;
  }>;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ylw-cart";
const NOTE_STORAGE_KEY = "ylw-cart-note";
const parseStoredNote = (stored: string | null) => stored ?? "";
const serializeNote = (note: string) => note;

/** Treat persisted cart data as untrusted and keep one line per variant. */
function parseStoredCart(
  stored: string | null,
  getProductByHandle: (handle: string) => Product | undefined,
): CartItem[] {
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    const lines = new Map<string, CartItem>();
    for (const entry of parsed) {
      if (
        !entry ||
        typeof entry !== "object" ||
        typeof entry.productHandle !== "string" ||
        typeof entry.variantId !== "string" ||
        !Number.isSafeInteger(entry.quantity) ||
        entry.quantity <= 0
      )
        continue;
      const product = getProductByHandle(entry.productHandle);
      const variant = product?.variants.find(
        (candidate) => candidate.id === entry.variantId,
      );
      if (!product || !variant) continue;
      const quantity = (lines.get(variant.id)?.quantity ?? 0) + entry.quantity;
      if (!Number.isSafeInteger(quantity)) continue;
      lines.set(variant.id, {
        productHandle: product.handle,
        variantId: variant.id,
        quantity,
        color: variant.color,
        size: variant.size,
      });
    }
    return [...lines.values()];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { getProductByHandle } = useCatalog();
  const parseCart = useCallback(
    (stored: string | null) => parseStoredCart(stored, getProductByHandle),
    [getProductByHandle],
  );
  const [isOpen, setIsOpen] = useState(false);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const [items, setItems] = usePersistedState<CartItem[]>(
    STORAGE_KEY,
    [],
    parseCart,
  );
  const [note, setNote] = usePersistedState(
    NOTE_STORAGE_KEY,
    "",
    parseStoredNote,
    serializeNote,
  );

  const addItem = useCallback(
    (product: Product, variant: ProductVariant, quantity = 1) => {
      if (!variant.available || !Number.isSafeInteger(quantity) || quantity < 1)
        return;
      setIsOpen(true);
      setItems((prev) => {
        const existing = prev.find((i) => i.variantId === variant.id);
        if (existing) {
          if (!Number.isSafeInteger(existing.quantity + quantity)) return prev;
          return prev.map((i) =>
            i.variantId === variant.id
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          );
        }
        return [
          ...prev,
          {
            productHandle: product.handle,
            variantId: variant.id,
            quantity,
            color: variant.color,
            size: variant.size,
          },
        ];
      });
    },
    [setItems],
  );

  const removeItem = useCallback(
    (variantId: string) => {
      setItems((prev) => prev.filter((i) => i.variantId !== variantId));
    },
    [setItems],
  );

  const updateQuantity = useCallback(
    (variantId: string, quantity: number) => {
      if (!Number.isSafeInteger(quantity)) return;
      if (quantity <= 0) {
        setItems((prev) => prev.filter((i) => i.variantId !== variantId));
        return;
      }
      setItems((prev) =>
        prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
      );
    },
    [setItems],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setNote("");
  }, [setItems, setNote]);

  const getLineItems = useCallback(() => {
    return items
      .map((item) => {
        const product = getProductByHandle(item.productHandle);
        if (!product) return null;
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) return null;
        return {
          item,
          product,
          variant,
          lineTotal: variant.price * item.quantity,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [items, getProductByHandle]);

  const value = useMemo(() => {
    const lineItems = getLineItems();
    return {
      isOpen,
      openCart,
      closeCart,
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: lineItems.reduce((s, l) => s + l.lineTotal, 0),
      note,
      setNote,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getLineItems,
    };
  }, [
    isOpen,
    openCart,
    closeCart,
    items,
    note,
    setNote,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getLineItems,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
