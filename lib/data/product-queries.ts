import type { Product } from "@/lib/types";
import { getProductsByCollection as getMappedProducts } from "./products";
import { getAllCollectionHandles } from "./collections";

const supportedCollections = new Set(getAllCollectionHandles());

/** Collection membership comes from the source catalog, never fuzzy title matches. */
export function getProductsByCollection(handle: string): Product[] {
  return supportedCollections.has(handle) ? getMappedProducts(handle) : [];
}
