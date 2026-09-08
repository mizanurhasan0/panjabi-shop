import type { Product } from "@/lib/types";
import catalog from "./catalog.generated.json" with { type: "json" };

// The catalog importer owns the JSON; query behavior lives in this module.
export const products: Product[] = catalog.products;
export const collectionProductMap: Record<string, string[]> =
  catalog.collectionProductMap;

const productsByHandle = new Map(
  products.map((product) => [product.handle, product]),
);

const productsByCollection = new Map(
  Object.entries(collectionProductMap).map(([handle, members]) => {
    const memberHandles = new Set(members);
    // Keep catalog order even when the source membership list has another order.
    return [handle, products.filter((product) => memberHandles.has(product.handle))];
  }),
);

const searchableProducts = products.map((product) => ({
  product,
  fields: [product.title, product.productType, ...product.tags].map((value) =>
    value.toLowerCase(),
  ),
}));

export function getProductByHandle(handle: string): Product | undefined {
  return productsByHandle.get(handle);
}

/** Membership comes from the source catalog, never fuzzy title matches. */
export function getProductsByCollection(handle: string): Product[] {
  // Callers may sort results without changing the cached catalog order.
  return productsByCollection.get(handle)?.slice() ?? [];
}

export function searchProducts(query: string): Product[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return products.slice(0, 12);
  return searchableProducts
    .filter(({ fields }) => fields.some((value) => value.includes(needle)))
    .map(({ product }) => product);
}
