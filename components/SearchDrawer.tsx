"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCatalog } from "@/lib/store/catalog";
import searchConfig from "@/lib/data/search-config.json";
import {
  featuredSearchBadges,
  mobileTrendingTerms,
  popularSearchTerms,
} from "@/lib/data/search";
import { formatPrice } from "@/lib/utils/products";
import { IconClose, IconSearch } from "./icons";
import { Modal } from "./Modal";
import styles from "./SearchDrawer.module.css";

const mobileSearchQuery = "(max-width: 1023px)";
function subscribeToViewport(onChange: () => void) {
  const media = window.matchMedia(mobileSearchQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
const getMobileSnapshot = () => window.matchMedia(mobileSearchQuery).matches;
const getServerSnapshot = () => false;

interface SearchQueryProps {
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
}

interface SearchDrawerProps extends SearchQueryProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDrawer({
  open,
  onClose,
  initialQuery = "",
  onQueryChange,
}: SearchDrawerProps) {
  return (
    <Modal
      id="site-search"
      label="Search"
      open={open}
      onClose={onClose}
      className={`search-panel ${styles.panel}`}
    >
      {open && (
        <SearchContent
          onClose={onClose}
          initialQuery={initialQuery}
          onQueryChange={onQueryChange}
        />
      )}
    </Modal>
  );
}

function SearchContent({
  onClose,
  initialQuery = "",
  onQueryChange,
}: SearchQueryProps & { onClose: () => void }) {
  const { searchProducts, getProductByHandle } = useCatalog();
  const [query, setQuery] = useState(initialQuery);
  const isMobile = useSyncExternalStore(
    subscribeToViewport,
    getMobileSnapshot,
    getServerSnapshot,
  );
  const router = useRouter();
  const term = query.trim();
  const results = useMemo(
    () => (term ? searchProducts(term) : searchConfig.featuredProducts.flatMap(({handle}) => { const product = getProductByHandle(handle); return product ? [product] : []; })),
    [term, searchProducts, getProductByHandle],
  );
  const searchHref = `/search?q=${encodeURIComponent(term)}`;

  return (
    <>
      <div className="mobile-search-title">
        <h2>Search</h2>
        <button type="button" onClick={onClose} aria-label="Close search">
          <IconClose />
        </button>
      </div>
      <div className="search-panel-header">
        <form
          action="/search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            if (!term) return;
            router.push(searchHref);
            onClose();
          }}
        >
          <button type="submit" aria-label="Submit search">
            <IconSearch className="h-5 w-5" />
          </button>
          <input
            data-autofocus
            type="search"
            name="q"
            aria-label="Search products"
            placeholder={isMobile ? "Search products..." : "Search"}
            autoComplete="off"
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              onQueryChange?.(nextQuery);
            }}
          />
        </form>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="search-close"
        >
          <IconClose className="h-4 w-4" />
        </button>
      </div>
      {!term && (
        <div className="search-popular">
          <h2 className="desktop-only">Popular search terms</h2>
          <h2 className="mobile-only">Trending Now</h2>
          <div className="desktop-only flex flex-wrap gap-2">
            {popularSearchTerms.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                onClick={onClose}
              >
                <span aria-hidden="true">↗</span>
                {tag}
              </Link>
            ))}
          </div>
          <div className="mobile-only search-trending">
            {mobileTrendingTerms.map((tag, index) => (
              <Link
                key={`${tag}-${index}`}
                href={`/search?q=${encodeURIComponent(tag)}`}
                onClick={onClose}
              >
                <IconSearch className="h-3.5 w-3.5" />
                {tag.toLowerCase()}
              </Link>
            ))}
          </div>
        </div>
      )}
      <section aria-label={term ? "Search results" : "Featured products"}>
        <div className="search-results-heading">
          <h2 className="desktop-only">
            {term ? "Products" : "Featured products"}
          </h2>
          <h2 className="mobile-only">
            {term ? "Search Results" : "Popular Products"}
          </h2>
          {term && (
            <Link href={searchHref} onClick={onClose}>
              View all results ({results.length})
            </Link>
          )}
        </div>
        <p className="sr-only" role="status">
          {term ? `${results.length} results for ${term}` : "Featured products"}
        </p>
        {results.length ? (
          <div className={`search-products ${term ? "has-query" : ""}`}>
            {results.slice(0, !term && isMobile ? 3 : 8).map((product) => (
              <Link
                className="search-product"
                key={product.handle}
                href={`/products/${product.handle}`}
                onClick={onClose}
              >
                <div className="search-product-image">
                  {(product.isNew ||
                    (!term && featuredSearchBadges.get(product.handle))) && (
                    <span className="search-product-badge">
                      {featuredSearchBadges.get(product.handle) || "New"}
                    </span>
                  )}
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    sizes="(max-width: 1023px) 220px, 20vw"
                    className="object-contain"
                  />
                </div>
                <h3>{product.title}</h3>
                <p>
                  {formatPrice(product.price)}
                  {isMobile && <span className={styles.vat}> + VAT</span>}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="search-empty" role="status">
            No products found. Try a different search term.
          </p>
        )}
      </section>
    </>
  );
}
