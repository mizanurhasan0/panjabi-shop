"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCollectionTitle } from "@/lib/data/collections";
import { useCatalog } from "@/lib/store/catalog";
import type { Product, SortOption } from "@/lib/types";
import {
  filterProducts,
  getSizeCounts,
  sortProducts,
} from "@/lib/utils/products";
import { CollectionFilters } from "@/components/CollectionFilters";
import { CollectionProductCard } from "@/components/CollectionProductCard";
import styles from "./CollectionPageClient.module.css";

interface CollectionPageClientProps {
  handle: string;
}

export function CollectionPageClient({ handle }: CollectionPageClientProps) {
  const { getProductsByCollection } = useCatalog();
  const allProducts = useMemo(() => getProductsByCollection(handle), [handle, getProductsByCollection]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>(
    [],
  );
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<SortOption>("date-desc");

  const sizeCounts = useMemo(() => getSizeCounts(allProducts), [allProducts]);

  const products = useMemo(() => {
    const filtered = filterProducts(allProducts, {
      sizes: selectedSizes,
      productTypes: selectedProductTypes,
      minPrice,
      maxPrice,
    });
    return sortProducts(filtered, sort);
  }, [
    allProducts,
    selectedSizes,
    selectedProductTypes,
    minPrice,
    maxPrice,
    sort,
  ]);

  return (
    <>
      <CollectionFilters
        products={allProducts}
        selectedSizes={selectedSizes}
        selectedProductTypes={selectedProductTypes}
        onProductTypesChange={setSelectedProductTypes}
        resultCount={products.length}
        onSizesChange={setSelectedSizes}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        sort={sort}
        onSortChange={setSort}
        sizeCounts={sizeCounts}
      />

      <div className={styles.results}>
        {products.length === 0 ? (
          <p className={styles.empty} role="status">
            No products found in {getCollectionTitle(handle)}.
          </p>
        ) : (
          <CollectionResults
            key={JSON.stringify([
              selectedSizes,
              selectedProductTypes,
              minPrice,
              maxPrice,
              sort,
            ])}
            products={products}
          />
        )}
      </div>
    </>
  );
}

const PAGE_SIZE = 20;

function CollectionResults({ products }: { products: Product[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMore = useRef<HTMLButtonElement>(null);
  const hasMore = visibleCount < products.length;

  useEffect(() => {
    const target = loadMore.current;
    if (!target || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.unobserve(target);
          setVisibleCount((count) => count + PAGE_SIZE);
        }
      },
      { rootMargin: "150px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  return (
    <>
      <div className={styles.grid}>
        {products.slice(0, visibleCount).map((product) => (
          <CollectionProductCard key={product.handle} product={product} />
        ))}
      </div>
      {hasMore && (
        <button
          ref={loadMore}
          type="button"
          className={styles.loadMore}
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          Load more products
        </button>
      )}
    </>
  );
}
