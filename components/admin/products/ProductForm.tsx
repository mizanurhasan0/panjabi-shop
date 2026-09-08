"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { errorMessage, useDemoQuery } from "@/lib/demo/client";
import { saveProduct } from "@/lib/demo/commands";
import type { AdminProduct } from "@/lib/admin/types";
import type { ProductVariant } from "@/lib/types";
import { collections } from "@/lib/data/collections";
import {
  AdminIcon,
  Alert,
  Button,
  Field,
  PageHeading,
  StatusBadge,
} from "../ui";
import { ProductImageManager } from "./ProductImageManager";
import "./products.css";

function values(value: string) {
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}
function handleFromTitle(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\u0980-\u09ff]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ProductFormProps {
  product?: AdminProduct;
  onSaved?: () => void;
}

export function ProductForm(props: ProductFormProps) {
  const { data: threshold, loading } = useDemoQuery(
    (state) => state.settings.lowStockThreshold,
  );
  if (!props.product && loading) {
    return (
      <div
        className="admin-stack"
        role="status"
        aria-label="Preparing product form"
      >
        <div className="admin-skeleton admin-skeleton-heading" />
        <div className="admin-skeleton admin-skeleton-table" />
      </div>
    );
  }
  return (
    <ProductFormContent {...props} defaultLowStockThreshold={threshold ?? 5} />
  );
}

function ProductFormContent({
  product,
  onSaved,
  defaultLowStockThreshold,
}: ProductFormProps & { defaultLowStockThreshold: number }) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    title: product?.title ?? "",
    handle: product?.handle ?? "",
    sku: product?.variants[0]?.sku ?? "",
    description: product?.description ?? "",
    collectionHandle: product?.collectionHandle ?? "men-s-panjabi",
    vendor: product?.vendor ?? "",
    productType: product?.productType ?? "Panjabi",
    price: String(product?.price ?? ""),
    costPrice: String(product?.costPrice ?? ""),
    compareAtPrice:
      product?.compareAtPrice == null ? "" : String(product.compareAtPrice),
    stock: String(product?.stock ?? 0),
    lowStockThreshold: String(
      product?.lowStockThreshold ?? defaultLowStockThreshold,
    ),
    colors: product?.colors.join(", ") ?? "",
    sizes: product?.sizes.join(", ") ?? "",
    tags: product?.tags.join(", ") ?? "",
    active: product?.active ?? true,
    isNew: product?.isNew ?? true,
  });
  const [images, setImages] = useState(product?.images ?? []);
  const [handleTouched, setHandleTouched] = useState(Boolean(product));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const disabled = busy || uploading;
  const price = Number(draft.price) || 0;
  const cost = Number(draft.costPrice) || 0;
  const combinationCount =
    Math.max(values(draft.colors).length, 1) *
    Math.max(values(draft.sizes).length, 1);
  function change<K extends keyof typeof draft>(
    key: K,
    value: (typeof draft)[K],
  ) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
  }

  function buildVariants(): ProductVariant[] {
    const colors = values(draft.colors);
    const sizes = values(draft.sizes);
    const compareAtPrice =
      draft.compareAtPrice === "" ? null : Number(draft.compareAtPrice);
    const priceChanged = product && price !== product.price;
    const compareChanged = product && compareAtPrice !== product.compareAtPrice;
    const skuChanged =
      product && draft.sku !== (product.variants[0]?.sku ?? "");
    return (colors.length ? colors : [""]).flatMap((color) =>
      (sizes.length ? sizes : [""]).map((size, index) => {
        const previous = product?.variants.find(
          (variant) => variant.color === color && variant.size === size,
        );
        return {
          id: previous?.id ?? crypto.randomUUID(),
          title: [color, size].filter(Boolean).join(" / ") || "Default",
          sku:
            previous && !skuChanged
              ? previous.sku
              : draft.sku
                ? `${draft.sku}${combinationCount > 1 ? `-${[color, size].filter(Boolean).join("-") || index + 1}` : ""}`
                : "",
          price: previous && !priceChanged ? previous.price : price,
          compareAtPrice:
            previous && !compareChanged && !priceChanged
              ? previous.compareAtPrice
              : compareAtPrice,
          color,
          size,
          available: previous?.available ?? true,
        };
      }),
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    setError("");
    setSaved(false);
    if (combinationCount > 200) {
      setError("Use up to 200 combinations of colors and sizes.");
      return;
    }
    if (draft.active && images.length === 0) {
      setError("Add at least one product image before publishing to the shop.");
      return;
    }
    if (draft.compareAtPrice !== "" && Number(draft.compareAtPrice) < price) {
      setError(
        "The compare at price must be equal to or higher than the selling price.",
      );
      return;
    }
    setBusy(true);
    const body = {
      ...draft,
      price,
      costPrice: cost,
      compareAtPrice:
        draft.compareAtPrice === "" ? null : Number(draft.compareAtPrice),
      stock: product ? undefined : Number(draft.stock),
      lowStockThreshold: Number(draft.lowStockThreshold),
      vendor: draft.vendor || undefined,
      images,
      colors: values(draft.colors),
      sizes: values(draft.sizes),
      tags: values(draft.tags),
      variants: buildVariants(),
    };
    try {
      const savedProduct = saveProduct(body, product?.id);
      setSaved(true);
      if (!product)
        router.replace(`/admin/products/${savedProduct.id}?created=1`);
      else onSaved?.();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link href="/admin/products" className="admin-product-back">
        ← All products
      </Link>
      <form onSubmit={submit}>
        <PageHeading
          title={product ? "Edit product" : "Add a product"}
          description={
            product
              ? "A few thoughtful updates keep your collection looking its best."
              : "A new piece for your collection. Let's get the details right."
          }
          actions={
            <>
              <Link
                className="admin-button admin-button-secondary"
                href="/admin/products"
              >
                Cancel
              </Link>
              <Button type="submit" disabled={disabled}>
                <AdminIcon name="check" size={17} />
                {busy ? "Saving…" : product ? "Save changes" : "Create product"}
              </Button>
            </>
          }
        />
        <div className="admin-stack">
          {error && <Alert>{error}</Alert>}
          {saved && <Alert tone="success">Product saved successfully.</Alert>}
          <div className="admin-product-editor">
            <div className="admin-stack">
              <section className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2>Product information</h2>
                    <p>The essentials your customers will see.</p>
                  </div>
                </div>
                <div className="admin-stack">
                  <Field label="Product name">
                    <input
                      className="admin-input"
                      value={draft.title}
                      onChange={(event) => {
                        const title = event.target.value;
                        setDraft((previous) => ({
                          ...previous,
                          title,
                          handle: handleTouched
                            ? previous.handle
                            : handleFromTitle(title),
                        }));
                        setSaved(false);
                      }}
                      placeholder="e.g. Ivory Embroidered Panjabi"
                      maxLength={200}
                      required
                      disabled={disabled}
                    />
                  </Field>
                  <Field
                    label="Description"
                    hint="Describe the fabric, fit, and details in plain text."
                  >
                    <textarea
                      className="admin-textarea"
                      rows={5}
                      value={draft.description}
                      onChange={(event) =>
                        change("description", event.target.value)
                      }
                      maxLength={20_000}
                      placeholder="What makes this piece special?"
                      disabled={disabled}
                    />
                  </Field>
                  <div className="admin-form-grid">
                    <Field label="Collection">
                      <select
                        className="admin-select"
                        value={draft.collectionHandle}
                        onChange={(event) =>
                          change("collectionHandle", event.target.value)
                        }
                        disabled={disabled}
                      >
                        {!collections.some(
                          (item) => item.handle === draft.collectionHandle,
                        ) && (
                          <option value={draft.collectionHandle}>
                            {draft.collectionHandle}
                          </option>
                        )}
                        {collections.map((collection) => (
                          <option
                            key={collection.handle}
                            value={collection.handle}
                          >
                            {collection.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Product type">
                      <input
                        className="admin-input"
                        value={draft.productType}
                        onChange={(event) =>
                          change("productType", event.target.value)
                        }
                        maxLength={100}
                        disabled={disabled}
                      />
                    </Field>
                    <Field
                      label="URL handle"
                      hint="Used in your product's shop link."
                    >
                      <input
                        className="admin-input"
                        value={draft.handle}
                        onChange={(event) => {
                          change("handle", event.target.value);
                          setHandleTouched(true);
                        }}
                        maxLength={200}
                        required
                        disabled={disabled}
                      />
                    </Field>
                    <Field label="Brand / vendor">
                      <input
                        className="admin-input"
                        value={draft.vendor}
                        onChange={(event) =>
                          change("vendor", event.target.value)
                        }
                        placeholder="Your shop name"
                        maxLength={200}
                        disabled={disabled}
                      />
                    </Field>
                  </div>
                </div>
              </section>
              <section className="admin-card">
                <ProductImageManager
                  images={images}
                  onChange={(next) => {
                    setImages(next);
                    setSaved(false);
                  }}
                  disabled={busy}
                  onBusyChange={setUploading}
                />
              </section>
              <section className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2>Colors & sizes</h2>
                    <p>Choose the options customers can order.</p>
                  </div>
                  <span className="admin-badge">
                    {combinationCount} variant
                    {combinationCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="admin-form-grid">
                  <Field label="Colors" hint="Separate colors with commas.">
                    <input
                      className="admin-input"
                      value={draft.colors}
                      onChange={(event) => change("colors", event.target.value)}
                      placeholder="Ivory, Black, Navy"
                      disabled={disabled}
                    />
                  </Field>
                  <Field label="Sizes" hint="Separate sizes with commas.">
                    <input
                      className="admin-input"
                      value={draft.sizes}
                      onChange={(event) => change("sizes", event.target.value)}
                      placeholder="38, 40, 42, 44"
                      disabled={disabled}
                    />
                  </Field>
                  <Field
                    label="SKU / product code"
                    hint="A suffix is added for new color and size combinations."
                  >
                    <input
                      className="admin-input"
                      value={draft.sku}
                      onChange={(event) => change("sku", event.target.value)}
                      maxLength={70}
                      placeholder="PNJ-001"
                      disabled={disabled}
                    />
                  </Field>
                  <Field
                    label="Tags"
                    hint="Optional labels separated by commas."
                  >
                    <input
                      className="admin-input"
                      value={draft.tags}
                      onChange={(event) => change("tags", event.target.value)}
                      placeholder="Cotton, Eid, Embroidered"
                      disabled={disabled}
                    />
                  </Field>
                </div>
                {product && (
                  <p className="admin-product-options-note">
                    Existing matching variants keep their IDs, SKUs, and
                    availability. Changing the selling price updates all variant
                    prices.
                  </p>
                )}
              </section>
            </div>
            <aside className="admin-stack admin-product-editor-sidebar">
              <section className="admin-card">
                <div className="admin-card-header">
                  <h2>Publishing</h2>
                  <StatusBadge stage={draft.active ? "active" : "inactive"} />
                </div>
                <div className="admin-stack">
                  <label className="admin-product-toggle">
                    <span>
                      <strong>Visible in shop</strong>
                      <small>Customers can browse this product.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={draft.active}
                      onChange={(event) =>
                        change("active", event.target.checked)
                      }
                      disabled={disabled}
                    />
                  </label>
                  <label className="admin-product-toggle">
                    <span>
                      <strong>New arrival</strong>
                      <small>Highlight this piece as new.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={draft.isNew}
                      onChange={(event) =>
                        change("isNew", event.target.checked)
                      }
                      disabled={disabled}
                    />
                  </label>
                  {product && !product.active && (
                    <Alert tone="info">
                      Turn on “Visible in shop” to restore this archived
                      product.
                    </Alert>
                  )}
                </div>
              </section>
              <section className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2>Pricing</h2>
                    <p>All prices in Bangladeshi Taka (৳).</p>
                  </div>
                </div>
                <div className="admin-stack">
                  <Field label="Selling price (৳)">
                    <input
                      className="admin-input"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={10_000_000}
                      step="0.01"
                      value={draft.price}
                      onChange={(event) => change("price", event.target.value)}
                      placeholder="0.00"
                      required
                      disabled={disabled}
                    />
                  </Field>
                  <Field
                    label="Cost price (৳)"
                    hint="Used to calculate profit. Customers cannot see this."
                  >
                    <input
                      className="admin-input"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={10_000_000}
                      step="0.01"
                      value={draft.costPrice}
                      onChange={(event) =>
                        change("costPrice", event.target.value)
                      }
                      placeholder="0.00"
                      required
                      disabled={disabled}
                    />
                  </Field>
                  <Field
                    label="Compare at price (৳)"
                    hint="Optional original price to show a discount."
                  >
                    <input
                      className="admin-input"
                      type="number"
                      inputMode="decimal"
                      min={price}
                      max={10_000_000}
                      step="0.01"
                      value={draft.compareAtPrice}
                      onChange={(event) =>
                        change("compareAtPrice", event.target.value)
                      }
                      placeholder="Optional"
                      disabled={disabled}
                    />
                  </Field>
                  <div className="admin-product-margin">
                    <span>Gross profit per item</span>
                    <strong>
                      ৳{" "}
                      {(price - cost).toLocaleString("en-BD", {
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                    <small>
                      {price > 0
                        ? `${(((price - cost) / price) * 100).toFixed(1)}% margin before order expenses`
                        : "Set a selling price to calculate margin"}
                    </small>
                  </div>
                </div>
              </section>
              <section className="admin-card">
                <div className="admin-card-header">
                  <h2>Inventory</h2>
                  <AdminIcon name="products" size={19} />
                </div>
                <div className="admin-stack">
                  {product ? (
                    <div className="admin-stock-summary">
                      <span>Available stock</span>
                      <strong>{product.stock} units</strong>
                    </div>
                  ) : (
                    <Field label="Opening stock">
                      <input
                        className="admin-input"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={1_000_000}
                        step={1}
                        value={draft.stock}
                        onChange={(event) =>
                          change("stock", event.target.value)
                        }
                        required
                        disabled={disabled}
                      />
                    </Field>
                  )}
                  <Field
                    label="Low stock alert at"
                    hint="An alert appears when stock reaches this number."
                  >
                    <input
                      className="admin-input"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={1_000_000}
                      step={1}
                      value={draft.lowStockThreshold}
                      onChange={(event) =>
                        change("lowStockThreshold", event.target.value)
                      }
                      required
                      disabled={disabled}
                    />
                  </Field>
                  <p className="admin-product-options-note">
                    Stock is shared across all variants.
                    {product
                      ? " Use Restock on the products page to add units."
                      : " Orders reduce stock automatically."}
                  </p>
                </div>
              </section>
            </aside>
          </div>
          <div className="admin-product-save-bar">
            <span>
              {uploading
                ? "Wait for image uploads to finish."
                : "Ready when you are. Save to update your shop."}
            </span>
            <Button type="submit" disabled={disabled}>
              {busy ? "Saving…" : product ? "Save changes" : "Create product"}
              <AdminIcon name="check" size={16} />
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
