import type { Product, SortOption } from "@/lib/types";

export function formatPrice(amount: number): string {
  return `Tk ${amount.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function sortProducts(products: Product[], sort: SortOption): Product[] {
  const copy = [...products];
  switch (sort) {
    case "availability":
      return copy.sort((a, b) => Number(b.available) - Number(a.available));
    case "best-selling":
      return copy;
    case "title-asc":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return copy.sort((a, b) => b.title.localeCompare(a.title));
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "date-asc":
      return copy.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case "date-desc":
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

export function filterProducts(
  products: Product[],
  filters: {
    sizes: string[];
    productTypes?: string[];
    minPrice: number | null;
    maxPrice: number | null;
  },
): Product[] {
  return products.filter((p) => {
    if (
      filters.productTypes?.length &&
      !filters.productTypes.includes(p.productType)
    )
      return false;
    if (filters.sizes.length) {
      const hasSize = p.variants.some(
        (v) => filters.sizes.includes(v.size) && v.available,
      );
      if (!hasSize) return false;
    }
    if (filters.minPrice !== null && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== null && p.price > filters.maxPrice) return false;
    return true;
  });
}

export function getSizeCounts(products: Product[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of products) {
    const availableSizes = new Set(
      p.variants
        .filter((variant) => variant.available && variant.size)
        .map((variant) => variant.size),
    );
    for (const size of availableSizes) {
      counts[size] = (counts[size] || 0) + 1;
    }
  }
  return counts;
}

export function getDefaultVariant(product: Product) {
  return (
    product.variants.find((v) => v.available) || product.variants[0] || null
  );
}

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: "availability", label: "Availability" },
  { value: "best-selling", label: "Best Selling" },
  { value: "title-asc", label: "Alphabetically, A-Z" },
  { value: "title-desc", label: "Alphabetically, Z-A" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "date-desc", label: "Date, new to old" },
  { value: "date-asc", label: "Date, old to new" },
];
