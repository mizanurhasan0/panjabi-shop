import type { CollectionMeta } from "@/lib/types";

export const collections: CollectionMeta[] = [
  { handle: "fall-2026", title: "New Arrival" },
  { handle: "men", title: "All Products" },
  { handle: "men-s-panjabi", title: "Panjabi" },
  { handle: "premium-panjabi", title: "Premium Panjabi" },
  { handle: "signature-panjabi", title: "Signature Panjabi" },
  { handle: "printed-panjabi", title: "Printed Panjabi" },
  { handle: "luxury-panjabi", title: "Luxury Panjabi" },
  { handle: "sequence-panjabi", title: "Sequence Panjabi" },
  { handle: "waistcoat", title: "Waistcoat" },
  { handle: "premium-trousers", title: "Premium Trousers" },
  { handle: "watches", title: "Watches" },
];

export function getCollectionTitle(handle: string): string {
  return (
    collections.find((collection) => collection.handle === handle)?.title ??
    "Collection"
  );
}

export function getAllCollectionHandles(): string[] {
  return collections.map((collection) => collection.handle);
}
