"use client";

import Link from "next/link";
import type { FormEventHandler } from "react";
import { AdminActionBar, AdminIcon, Button } from "../ui";
import { adminStyles } from "../styles";

type FilterKey = "query" | "stock" | "includeInactive";

interface ProductToolbarProps {
  query: string;
  stock: string;
  includeInactive: boolean;
  total?: number;
  loading: boolean;
  exporting: boolean;
  onSearch: FormEventHandler<HTMLFormElement>;
  onFilter: (key: FilterKey, value: string) => void;
  onReset: () => void;
  onExport: () => void;
}

export function ProductToolbar({
  query,
  stock,
  includeInactive,
  total,
  loading,
  exporting,
  onSearch,
  onFilter,
  onReset,
  onExport,
}: ProductToolbarProps) {
  const activeFilters = [
    ...(query ? [{ key: "query" as const, label: `Search: ${query}` }] : []),
    ...(stock
      ? [
          {
            key: "stock" as const,
            label: stock === "low" ? "Low stock" : "Out of stock",
          },
        ]
      : []),
    ...(includeInactive
      ? [{ key: "includeInactive" as const, label: "Including archived" }]
      : []),
  ];

  return (
    <div className="mb-4 grid min-w-0 gap-4">
      <AdminActionBar
        label="Product actions"
        actions={
          <>
            <Button
              variant="secondary"
              className="max-[401px]:px-2.5!"
              onClick={onExport}
              disabled={exporting || loading}
            >
              <AdminIcon name="download" size={16} />
              {exporting ? "Preparing Excel…" : "Export Excel"}
            </Button>
            <Link
              href="/admin/products/new"
              className={`${adminStyles.buttonPrimary} max-[401px]:px-2.5!`}
            >
              <AdminIcon name="plus" size={17} />
              Add product
            </Link>
          </>
        }
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#f2e5ca] bg-admin-accent-soft text-[#a17a36]">
          <AdminIcon name="products" size={21} />
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h2 className="text-base!">
            {stock === "low"
              ? "Low stock products"
              : stock === "out"
                ? "Out of stock products"
                : "Your collection"}
          </h2>
          <span
            role="status"
            className="rounded-md bg-admin-bg px-2 py-1 text-[10px] font-medium tabular-nums text-admin-muted"
          >
            {total === undefined
              ? "Loading…"
              : `${total} product${total === 1 ? "" : "s"}`}
          </span>
        </div>
      </AdminActionBar>

      <div
        role="group"
        aria-label="Product filters"
        className="flex min-w-0 flex-wrap items-center gap-2.5 rounded-xl border border-admin-line bg-admin-bg/70 p-2.5 max-[641px]:grid max-[641px]:grid-cols-2 max-[641px]:gap-2"
      >
        <form
          role="search"
          aria-label="Search collection"
          onSubmit={onSearch}
          className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-[#dfe1e7] bg-white pl-3 transition-[border-color,box-shadow] duration-160 focus-within:border-[#caa260] focus-within:shadow-[0_0_0_3px_#ffbb491a] max-[901px]:basis-full max-[641px]:col-span-full max-[641px]:min-w-0 motion-reduce:transition-none"
        >
          <AdminIcon
            name="search"
            size={17}
            className="shrink-0 text-[#989da8] max-[481px]:hidden"
          />
          <input
            key={query}
            name="query"
            type="search"
            defaultValue={query}
            maxLength={200}
            placeholder="Search products…"
            aria-label="Search products"
            className="min-h-11 w-full min-w-0 border-0 bg-transparent py-2.5 text-[12px] text-admin-ink outline-none placeholder:text-[#989da8] max-[641px]:text-base"
          />
          <button
            type="submit"
            className="min-h-11 shrink-0 self-stretch rounded-r-lg border-l border-admin-line px-3 text-[11px] font-medium text-[#626873] transition-colors duration-160 hover:bg-admin-accent-soft hover:text-[#8b682f] motion-reduce:transition-none"
          >
            Search
          </button>
        </form>
        <select
          aria-label="Filter by stock"
          value={stock}
          onChange={(event) => onFilter("stock", event.target.value)}
          className={`${adminStyles.select} w-auto! min-w-[160px] text-[12px] max-[641px]:w-full! max-[641px]:min-w-0`}
        >
          <option value="">All stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#dfe1e7] bg-white px-3 text-[11px] text-[#626873] transition-colors duration-160 hover:border-[#caa260] has-checked:border-[#dbc393] has-checked:bg-admin-accent-soft has-checked:text-[#8b682f] motion-reduce:transition-none">
          <input
            type="checkbox"
            aria-label="Include archived"
            checked={includeInactive}
            onChange={(event) =>
              onFilter("includeInactive", event.target.checked ? "true" : "")
            }
            className="shrink-0"
          />
          <span>Include archived</span>
        </label>
      </div>

      {activeFilters.length > 0 && (
        <div
          className="flex min-w-0 flex-wrap items-center gap-2"
          role="group"
          aria-label="Active product filters"
        >
          {activeFilters.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onFilter(key, "")}
              aria-label={`Remove ${label}`}
              title={label}
              className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-lg border border-[#f0dfba] bg-admin-accent-soft px-2.5 text-[11px] text-[#866228] transition-colors duration-160 hover:bg-[#f9ebcf] max-[641px]:min-h-11 motion-reduce:transition-none"
            >
              <span className="truncate">{label}</span>
              <AdminIcon name="close" size={13} className="shrink-0" />
            </button>
          ))}
          <button
            type="button"
            onClick={onReset}
            className="ml-auto min-h-9 px-2 text-[11px] font-medium text-admin-muted transition-colors hover:text-admin-ink max-[641px]:min-h-11 motion-reduce:transition-none"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
