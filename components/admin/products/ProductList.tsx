"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { errorMessage, useDemoQuery } from "@/lib/demo/client";
import { deleteProduct } from "@/lib/demo/commands";
import { listProducts, type ProductFilters } from "@/lib/demo/queries";
import { getDemoSnapshot } from "@/lib/demo/store";
import type { AdminProduct } from "@/lib/admin/types";
import { getCollectionTitle } from "@/lib/data/collections";
import {
  AdminActionBar,
  AdminIcon,
  Alert,
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeading,
  Pagination,
  StatusBadge,
} from "../ui";
import { adminStyles } from "../styles";
import { RestockDialog } from "./RestockDialog";

const money = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 2,
});

export function ProductList() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const query = params.get("query") ?? "";
  const stock = params.get("stock") ?? "";
  const includeInactive = params.get("includeInactive") === "true";
  const filters: ProductFilters = {
    page,
    pageSize: 20,
    query,
    includeInactive,
    stock: stock === "low" || stock === "out" ? stock : undefined,
  };
  const { data, error, loading, reload } = useDemoQuery((state) =>
    listProducts(state, filters),
  );
  const [exporting, setExporting] = useState(false);
  const [restock, setRestock] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace(`${pathname}?${next}`, { scroll: false });
  }
  function searchProducts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    filter(
      "query",
      String(new FormData(event.currentTarget).get("query") ?? ""),
    );
  }
  function archive() {
    if (!deleting || busy) return;
    setBusy(true);
    setActionError("");
    try {
      deleteProduct(deleting.id);
      setNotice(
        `“${deleting.title}” was removed from the shop. You can reactivate it by including archived products.`,
      );
      setDeleting(null);
      reload();
    } catch (error) {
      setActionError(errorMessage(error));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }
  async function downloadProducts() {
    if (exporting) return;
    setExporting(true);
    setActionError("");
    try {
      const state = getDemoSnapshot();
      if (!state)
        throw new Error("The demo is still loading. Please try again.");
      const products: AdminProduct[] = [];
      let exportPage = 1;
      while (true) {
        const result = listProducts(state, {
          ...filters,
          page: exportPage,
          pageSize: 100,
        });
        products.push(...result.items);
        if (products.length >= result.total || result.items.length === 0) break;
        exportPage += 1;
      }
      const { exportSpreadsheet } = await import("@/lib/demo/downloads");
      await exportSpreadsheet("products", products, state.settings);
    } catch (failure) {
      setActionError(errorMessage(failure));
    } finally {
      setExporting(false);
    }
  }
  return (
    <>
      <PageHeading
        title="Products"
        description="Keep your collection fresh and your stock in check."
      />
      <div className={adminStyles.stack}>
        {notice && <Alert tone="success">{notice}</Alert>}
        {(actionError || error) && (
          <Alert>
            {actionError || error}
            <Button variant="secondary" onClick={reload}>
              Try again
            </Button>
          </Alert>
        )}
        <div className={adminStyles.card}>
          <AdminActionBar
            label="Product actions"
            actions={
              <>
                <Button
                  variant="secondary"
                  onClick={downloadProducts}
                  disabled={exporting || loading}
                >
                  <AdminIcon name="download" size={17} />
                  {exporting ? "Preparing Excel…" : "Export Excel"}
                </Button>
                <Link
                  href="/admin/products/new"
                  className={adminStyles.buttonPrimary}
                >
                  <AdminIcon name="plus" size={17} />
                  Add product
                </Link>
              </>
            }
          >
            <form
              className="relative flex w-full min-w-0 max-w-[410px] items-center gap-2 max-[641px]:max-w-none [&>svg]:pointer-events-none [&>svg]:absolute [&>svg]:left-[13px] [&>svg]:text-[#a1a5ae]"
              onSubmit={searchProducts}
            >
              <AdminIcon name="search" size={17} />
              <input
                key={query}
                className={`${adminStyles.input} max-w-none! pl-[38px]!`}
                name="query"
                type="search"
                defaultValue={query}
                maxLength={200}
                placeholder="Search products…"
                aria-label="Search products"
              />
              <Button variant="secondary" type="submit">
                Search
              </Button>
            </form>
          </AdminActionBar>
          <div className="my-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2>
                {stock === "low"
                  ? "Low stock products"
                  : stock === "out"
                    ? "Out of stock products"
                    : "Your collection"}
              </h2>
              {data && (
                <span className="text-[11px] text-admin-muted">
                  {data.total} product{data.total === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 max-[641px]:w-full">
              <select
                className={`${adminStyles.select} w-auto! min-w-[140px] min-[641px]:text-[11px]! max-[641px]:min-w-0 max-[641px]:flex-1 max-[641px]:basis-[150px]`}
                aria-label="Filter by stock"
                value={stock}
                onChange={(event) => filter("stock", event.target.value)}
              >
                <option value="">All stock levels</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
              <label className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-[11px] text-admin-muted">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(event) =>
                    filter("includeInactive", String(event.target.checked))
                  }
                />
                Include archived
              </label>
            </div>
          </div>
          {loading ? (
            <div
              className={adminStyles.stack}
              role="status"
              aria-label="Loading products"
            >
              {[1, 2, 3].map((item) => (
                <div className={`${adminStyles.skeleton} h-16`} key={item} />
              ))}
            </div>
          ) : data?.items.length ? (
            <>
              <div className={adminStyles.tableWrap}>
                <table
                  className={`${adminStyles.table} [&_td:nth-child(2)>strong]:whitespace-nowrap [&_td:nth-child(2)>strong]:font-medium [&_td:last-child]:whitespace-nowrap max-[641px]:[&_tbody_tr]:p-[15px]! max-[641px]:[&_td:first-child]:col-span-full max-[641px]:[&_td:first-child]:border-b! max-[641px]:[&_td:first-child]:border-[#f1f2f5]! max-[641px]:[&_td:first-child]:pb-3! max-[641px]:[&_td:first-child]:before:hidden! max-[641px]:[&_td:last-child]:border-t! max-[641px]:[&_td:last-child]:border-[#f1f2f5]! max-[641px]:[&_td:last-child]:pt-2.5! max-[641px]:[&_td:last-child]:before:hidden!`}
                >
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((product) => (
                      <tr key={product.id}>
                        <td data-label="Product">
                          <Link
                            className="flex min-w-[180px] max-w-[320px] items-center gap-3 max-[641px]:min-w-0 max-[641px]:max-w-none [&>span:last-child]:min-w-0 [&_strong]:block [&_strong]:text-[11px] [&_strong]:leading-[1.7] [&_strong]:font-medium max-[641px]:[&_strong]:text-xs"
                            href={`/admin/products/${product.id}`}
                          >
                            <span className="relative flex h-14 w-[46px] shrink-0 basis-[46px] items-center justify-center overflow-hidden rounded-[7px] border border-[#eceef1] bg-[#f7f7f8] text-[#b1a78f] max-[641px]:h-[58px] max-[641px]:w-12 max-[641px]:basis-12 [&_img]:object-contain">
                              {product.images[0] ? (
                                <Image
                                  src={product.images[0]}
                                  alt=""
                                  fill
                                  sizes="48px"
                                  unoptimized
                                />
                              ) : (
                                <AdminIcon name="products" />
                              )}
                            </span>
                            <span>
                              <strong>{product.title}</strong>
                              <small>
                                {getCollectionTitle(product.collectionHandle)}
                              </small>
                            </span>
                          </Link>
                        </td>
                        <td data-label="Selling price">
                          <strong>{money.format(product.price)}</strong>
                          <small>Cost {money.format(product.costPrice)}</small>
                        </td>
                        <td data-label="Stock">
                          <span
                            className={
                              product.stock <= product.lowStockThreshold
                                ? "font-medium text-[#c29445]"
                                : ""
                            }
                          >
                            {product.stock} units
                          </span>
                          <small>
                            {product.stock === 0
                              ? "Out of stock"
                              : product.stock <= product.lowStockThreshold
                                ? "Running low"
                                : "In stock"}
                          </small>
                        </td>
                        <td data-label="Status">
                          <StatusBadge
                            stage={product.active ? "active" : "inactive"}
                          />
                        </td>
                        <td data-label="Actions">
                          <div
                            className={`${adminStyles.actions} flex-nowrap! gap-[7px]! max-[1201px]:flex-wrap! max-[641px]:flex-nowrap! max-[641px]:[&>a]:flex-1 max-[641px]:[&>button:not([title])]:flex-1`}
                          >
                            <Link
                              className={adminStyles.buttonSecondary}
                              href={`/admin/products/${product.id}`}
                              aria-label={`Edit ${product.title}`}
                            >
                              <AdminIcon name="edit" size={14} />
                              Edit
                            </Link>
                            <Button
                              variant="secondary"
                              onClick={() => setRestock(product)}
                              aria-label={`Restock ${product.title}`}
                            >
                              <AdminIcon name="plus" size={14} />
                              Restock
                            </Button>
                            {product.active && (
                              <button
                                className={`${adminStyles.iconButton} h-[34px]! w-8! basis-8! p-0! text-[#ba8e8a]! hover:bg-[#fff0ee]! hover:text-[#b95650]! max-[641px]:h-10! max-[641px]:w-10! max-[641px]:basis-10!`}
                                aria-label={`Delete ${product.title}`}
                                title="Delete product"
                                onClick={() => setDeleting(product)}
                              >
                                <AdminIcon name="trash" size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={data.page}
                total={data.total}
                pageSize={data.pageSize}
                onChange={(page) => filter("page", String(page))}
              />
            </>
          ) : (
            !error && (
              <EmptyState
                title={
                  query || stock
                    ? "No matching products"
                    : "Your collection starts here"
                }
                description={
                  query || stock
                    ? "Try a different search or stock filter."
                    : "Add your first product, upload a photo, and set its stock."
                }
                action={
                  query || stock ? (
                    <Button
                      variant="secondary"
                      onClick={() => router.replace(pathname)}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    <Link
                      className={adminStyles.buttonPrimary}
                      href="/admin/products/new"
                    >
                      Add product
                    </Link>
                  )
                }
              />
            )
          )}
        </div>
        <p className="flex items-start gap-2 px-[3px] text-[10px] text-[#a0a3ac] [&_svg]:shrink-0">
          <AdminIcon name="products" size={16} />
          Sample inventory is tracked per product across all sizes and colors.
          Try restocking a product to update this demo.
        </p>
      </div>
      <RestockDialog
        product={restock}
        onClose={() => setRestock(null)}
        onRestocked={() => {
          setNotice("Stock updated successfully.");
          reload();
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this product?"
        description={`“${deleting?.title ?? "This product"}” will be hidden from your shop. Existing orders stay intact, and you can reactivate it later.`}
        onConfirm={archive}
        onClose={() => setDeleting(null)}
        busy={busy}
      />
    </>
  );
}
