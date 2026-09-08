"use client";

import { useMemo, useState } from "react";
import type { Product, SortOption } from "@/lib/types";
import { formatPrice, sortOptions } from "@/lib/utils/products";
import { IconChevronDown, IconClose } from "./icons";
import { Modal } from "./Modal";
import {
  ActiveFilters,
  type ActiveFilter,
} from "./collection-filters/ActiveFilters";
import { FilterDropdown } from "./collection-filters/FilterDropdown";
import { OptionList } from "./collection-filters/OptionList";
import { PriceFilter } from "./collection-filters/PriceFilter";
import styles from "./CollectionFilters.module.css";

interface CollectionFiltersProps {
  products: Product[];
  selectedSizes: string[];
  onSizesChange: (sizes: string[]) => void;
  selectedProductTypes?: string[];
  onProductTypesChange?: (types: string[]) => void;
  minPrice: number | null;
  maxPrice: number | null;
  onMinPriceChange: (value: number | null) => void;
  onMaxPriceChange: (value: number | null) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  sizeCounts: Record<string, number>;
  resultCount?: number;
}

export function CollectionFilters(props: CollectionFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    products,
    selectedSizes,
    selectedProductTypes = [],
    minPrice,
    maxPrice,
  } = props;
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const product of products) {
      if (product.productType)
        counts[product.productType] = (counts[product.productType] ?? 0) + 1;
    }
    return counts;
  }, [products]);
  const priceBounds = useMemo(() => {
    const prices = products.map((product) => product.price);
    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    };
  }, [products]);
  const clearAll = () => {
    props.onSizesChange([]);
    props.onProductTypesChange?.([]);
    props.onMinPriceChange(null);
    props.onMaxPriceChange(null);
  };
  const groups = [
    {
      label: "Product Type",
      content: (
        <OptionList
          counts={typeCounts}
          selected={selectedProductTypes}
          onChange={props.onProductTypesChange}
        />
      ),
    },
    {
      label: "Size",
      content: (
        <OptionList
          counts={props.sizeCounts}
          selected={selectedSizes}
          onChange={props.onSizesChange}
          searchable
        />
      ),
    },
    {
      label: "Price",
      content: (
        <PriceFilter
          min={minPrice}
          max={maxPrice}
          bounds={priceBounds}
          onMinChange={props.onMinPriceChange}
          onMaxChange={props.onMaxPriceChange}
        />
      ),
    },
  ];
  const filterChips: ActiveFilter[] = [
    ...selectedProductTypes.map((type) => ({
      id: `type-${type}`,
      label: type,
      removeLabel: `Remove product type ${type}`,
      onRemove: () =>
        props.onProductTypesChange?.(
          selectedProductTypes.filter((value) => value !== type),
        ),
    })),
    ...selectedSizes.map((size) => ({
      id: `size-${size}`,
      label: size,
      removeLabel: `Remove size ${size}`,
      onRemove: () =>
        props.onSizesChange(selectedSizes.filter((value) => value !== size)),
    })),
  ];
  if (minPrice !== null || maxPrice !== null) {
    filterChips.push({
      id: "price",
      label: `${formatPrice(minPrice ?? priceBounds.min)} – ${formatPrice(maxPrice ?? priceBounds.max)}`,
      removeLabel: "Remove price filter",
      onRemove: () => {
        props.onMinPriceChange(null);
        props.onMaxPriceChange(null);
      },
    });
  }
  const activeFilters = <ActiveFilters filters={filterChips} onClear={clearAll} />;

  return (
    <section
      className={styles.filters}
      aria-label="Collection filters and sorting"
    >
      <div className={styles.toolbar}>
        <div className={styles.desktopFilters}>
          {groups.map(({ label, content }) => (
            <FilterDropdown key={label} label={label}>
              {content}
            </FilterDropdown>
          ))}
        </div>
        <button
          className={styles.mobileTrigger}
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-haspopup="dialog"
          aria-controls="collection-filter-drawer"
          aria-expanded={mobileOpen}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M1 3h14M1 8h14M1 13h14M4 1v4M11 6v4M6 11v4"
              fill="none"
              stroke="currentColor"
            />
          </svg>
          Filter By
        </button>
        <FilterDropdown
          label={
            <>
              <span className={styles.sortPrefix}>Sort By: </span>
              {sortOptions.find((option) => option.value === props.sort)?.label}
            </>
          }
          sort
        >
          {(close) => (
            <div
              className={styles.sortOptions}
              role="group"
              aria-label="Sort products"
            >
              {sortOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  aria-pressed={props.sort === option.value}
                  onClick={() => {
                    props.onSortChange(option.value);
                    close();
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </FilterDropdown>
      </div>
      {activeFilters}
      <Modal
        id="collection-filter-drawer"
        label="Filter By"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        className={styles.drawer}
        animateExit
      >
        <div className={styles.drawerHeader}>
          <h2>Filter By</h2>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close filter"
          >
            <IconClose />
          </button>
        </div>
        <div className={styles.drawerContents}>
          {activeFilters}
          {groups.map(({ label, content }) => (
            <details key={label} className={styles.accordion}>
              <summary>
                <IconChevronDown />
                {label}
              </summary>
              {content}
            </details>
          ))}
        </div>
        <div className={styles.drawerFooter}>
          <button type="button" onClick={() => setMobileOpen(false)}>
            View {props.resultCount ?? products.length} Products
          </button>
        </div>
      </Modal>
    </section>
  );
}
