"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCatalog } from "@/lib/store/catalog";
import { trendingTags } from "@/lib/data/navigation";
import { ProductCard } from "@/components/ProductCard";

export default function SearchPageContent() {
  const { searchProducts } = useCatalog();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const results = useMemo(() => searchProducts(query), [query, searchProducts]);

  return (
    <div className="container-ylw pb-16">
      <h1 className="py-10 text-center text-[24px] font-normal uppercase tracking-[0.1em]">
        Search
      </h1>

      <form
        action="/search"
        method="GET"
        className="mx-auto mb-8 max-w-[500px]"
      >
        <div className="flex gap-2">
          <input
            key={query}
            type="search"
            name="q"
            aria-label="Search products"
            defaultValue={query}
            placeholder="Search products..."
            className="flex-1 border border-ylw-border px-4 py-3 text-[14px] outline-none focus:border-ylw-text"
          />
          <button type="submit" className="btn-primary shrink-0">
            Search
          </button>
        </div>
      </form>

      {!query && (
        <div className="mb-8 text-center">
          <p className="mb-3 text-[12px] uppercase tracking-[0.05em]">
            Trending Now
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {trendingTags.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="rounded border border-ylw-border px-3 py-1 text-[12px] hover:border-ylw-text"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {query && (
        <p className="mb-6 text-center text-[13px] text-ylw-text-secondary">
          {results.length} result{results.length !== 1 ? "s" : ""} for &quot;
          {query}&quot;
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {results.map((product) => (
          <ProductCard key={product.handle} product={product} />
        ))}
      </div>

      {query && results.length === 0 && (
        <p className="py-12 text-center text-[14px] text-ylw-text-secondary">
          No products found. Try a different search term.
        </p>
      )}
    </div>
  );
}
