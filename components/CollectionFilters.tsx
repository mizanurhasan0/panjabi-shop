"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Product, SortOption } from "@/lib/types";
import { formatPrice, sortOptions } from "@/lib/utils/products";
import { IconChevronDown, IconClose, IconSearch } from "./icons";
import { Modal } from "./Modal";
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
  const hasFilters =
    selectedSizes.length > 0 ||
    selectedProductTypes.length > 0 ||
    minPrice !== null ||
    maxPrice !== null;
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
          onChange={props.onProductTypesChange ?? (() => {})}
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
  const activeFilters = hasFilters && (
    <div className={styles.activeFilters} aria-label="Selected filters">
      <button type="button" onClick={clearAll} className={styles.clearAll}>
        Clear all
      </button>
      {selectedProductTypes.map((type) => (
        <button
          type="button"
          key={type}
          onClick={() =>
            props.onProductTypesChange?.(
              selectedProductTypes.filter((value) => value !== type),
            )
          }
          aria-label={`Remove product type ${type}`}
        >
          {type}
          <IconClose />
        </button>
      ))}
      {selectedSizes.map((size) => (
        <button
          type="button"
          key={size}
          onClick={() =>
            props.onSizesChange(selectedSizes.filter((value) => value !== size))
          }
          aria-label={`Remove size ${size}`}
        >
          {size}
          <IconClose />
        </button>
      ))}
      {(minPrice !== null || maxPrice !== null) && (
        <button
          type="button"
          onClick={() => {
            props.onMinPriceChange(null);
            props.onMaxPriceChange(null);
          }}
          aria-label="Remove price filter"
        >
          {formatPrice(minPrice ?? priceBounds.min)} –{" "}
          {formatPrice(maxPrice ?? priceBounds.max)}
          <IconClose />
        </button>
      )}
    </div>
  );

  return (
    <section
      className={styles.filters}
      aria-label="Collection filters and sorting"
    >
      <div className={styles.toolbar}>
        <div className={styles.desktopFilters}>
          {groups.map(({ label, content }) => (
            <Dropdown key={label} label={label}>
              {content}
            </Dropdown>
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
        <Dropdown
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
        </Dropdown>
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

function OptionList({
  counts,
  selected,
  onChange,
  searchable = false,
}: {
  counts: Record<string, number>;
  selected: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
}) {
  const [query, setQuery] = useState("");
  const values = Object.keys(counts)
    .sort()
    .filter((value) =>
      value.toLowerCase().includes(query.trim().toLowerCase()),
    );
  return (
    <div className={styles.optionList}>
      {searchable && (
        <label className={styles.optionSearch}>
          <IconSearch />
          <input
            type="search"
            placeholder="Search options"
            aria-label="Search size options"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      )}
      <div className={styles.options}>
        {values.map((value) => (
          <label key={value} className={styles.option}>
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, value]
                    : selected.filter((item) => item !== value),
                )
              }
            />
            <span>
              {value}
              <span className={styles.count}>({counts[value]})</span>
            </span>
          </label>
        ))}
        {values.length === 0 && (
          <p className={styles.noOptions}>No matching options</p>
        )}
      </div>
    </div>
  );
}

function PriceFilter({
  min,
  max,
  bounds,
  onMinChange,
  onMaxChange,
}: {
  min: number | null;
  max: number | null;
  bounds: { min: number; max: number };
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
}) {
  const lower = min ?? bounds.min;
  const upper = max ?? bounds.max;
  const clamp = (value: number) =>
    Math.max(bounds.min, Math.min(bounds.max, value));
  return (
    <div className={styles.priceFilter}>
      <div className={styles.priceInputs}>
        <input
          aria-label="Minimum price"
          type="number"
          min={bounds.min}
          max={upper}
          value={lower}
          onChange={(event) =>
            onMinChange(
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
          onBlur={() =>
            onMinChange(min === null ? null : Math.min(clamp(lower), upper))
          }
        />
        <span aria-hidden="true">-</span>
        <input
          aria-label="Maximum price"
          type="number"
          min={lower}
          max={bounds.max}
          value={upper}
          onChange={(event) =>
            onMaxChange(
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
          onBlur={() =>
            onMaxChange(max === null ? null : Math.max(clamp(upper), lower))
          }
        />
      </div>
      <div className={styles.rangeInputs}>
        <input
          aria-label="Minimum price slider"
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={clamp(lower)}
          onChange={(event) =>
            onMinChange(Math.min(Number(event.target.value), upper))
          }
        />
        <input
          aria-label="Maximum price slider"
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={clamp(upper)}
          onChange={(event) =>
            onMaxChange(Math.max(Number(event.target.value), lower))
          }
        />
      </div>
      <div className={styles.priceLabels}>
        <span>{formatPrice(lower)}</span>
        <span>{formatPrice(upper)}</span>
      </div>
    </div>
  );
}

function Dropdown({
  label,
  children,
  sort = false,
}: {
  label: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  sort?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  return (
    <div
      ref={root}
      className={`${styles.dropdown} ${sort ? styles.sortDropdown : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        id={`${id}-trigger`}
        type="button"
        className={styles.dropdownTrigger}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {label}
        <IconChevronDown />
      </button>
      {open && (
        <div id={id} className={styles.dropdownContent}>
          {typeof children === "function"
            ? children(() => {
                setOpen(false);
                document.getElementById(`${id}-trigger`)?.focus();
              })
            : children}
        </div>
      )}
    </div>
  );
}
