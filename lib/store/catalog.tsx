"use client";

import { createContext, useContext, useMemo } from "react";
import { useDemoQuery } from "@/lib/demo/client";
import { toPublicProduct } from "@/lib/admin/public-shop";
import type { Product } from "@/lib/types";
import type { ShopSettings } from "@/lib/admin/types";

export interface PublicShop {
  products: Product[];
  settings: ShopSettings;
}
const CatalogContext = createContext<
  | (PublicShop & {
      getProductByHandle: (handle: string) => Product | undefined;
      getProductsByCollection: (handle: string) => Product[];
      searchProducts: (query: string) => Product[];
    })
  | null
>(null);

export function CatalogProvider({
  initial,
  children,
}: {
  initial: PublicShop;
  children: React.ReactNode;
}) {
  const { data } = useDemoQuery((state) => state);
  const shop = useMemo(
    () =>
      data
        ? {
            products: data.products
              .filter((product) => product.active)
              .map(toPublicProduct),
            settings: data.settings,
          }
        : initial,
    [data, initial],
  );
  const value = useMemo(() => {
    const byHandle = new Map(
      shop.products.map((product) => [product.handle, product]),
    );
    return {
      ...shop,
      getProductByHandle: (handle: string) => byHandle.get(handle),
      getProductsByCollection: (handle: string) =>
        shop.products.filter(
          (product) =>
            handle === "men" ||
            handle === "fall-2026" ||
            (handle === "men-s-panjabi" &&
              product.collectionHandle.endsWith("panjabi")) ||
            product.collectionHandle === handle,
        ),
      searchProducts: (query: string) => {
        const term = query.trim().toLowerCase();
        return term
          ? shop.products.filter((product) =>
              [product.title, product.productType, ...product.tags].some(
                (field) => field.toLowerCase().includes(term),
              ),
            )
          : shop.products.slice(0, 12);
      },
    };
  }, [shop]);
  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside CatalogProvider");
  return value;
}
