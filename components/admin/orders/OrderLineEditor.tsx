import type { AdminProduct } from "@/lib/admin/types";
import { formatPrice } from "@/lib/utils/products";
import { adminStyles } from "../styles";
import { AdminIcon, Button, Field } from "../ui";

export interface DraftOrderLine {
  id: string;
  kind: "catalog" | "custom";
  product: AdminProduct | null;
  variantId: string;
  title: string;
  sku: string;
  variant: string;
  quantity: string;
  price: string;
  costPrice: string;
  customizations: string;
}

export function blankOrderLine(kind: DraftOrderLine["kind"]): DraftOrderLine {
  return {
    id: crypto.randomUUID(),
    kind,
    product: null,
    variantId: "",
    title: "",
    sku: "",
    variant: "",
    quantity: "1",
    price: "",
    costPrice: "0",
    customizations: "",
  };
}

export function draftAmounts(line: DraftOrderLine): {
  price: number;
  costPrice: number;
  quantity: number;
} {
  return {
    price: line.product
      ? (line.product.variants.find((variant) => variant.id === line.variantId)
          ?.price ?? line.product.price)
      : Number(line.price) || 0,
    costPrice: line.product?.costPrice ?? (Number(line.costPrice) || 0),
    quantity: Number(line.quantity) || 0,
  };
}

export function OrderLineEditor({
  line,
  index,
  products,
  loading,
  onChange,
  onRemove,
  canRemove,
}: {
  line: DraftOrderLine;
  index: number;
  products: AdminProduct[];
  loading: boolean;
  onChange: (update: Partial<DraftOrderLine>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const choices =
    line.product && !products.some((product) => product.id === line.product?.id)
      ? [line.product, ...products]
      : products;
  const amounts = draftAmounts(line);
  function selectProduct(id: string) {
    const product = choices.find((product) => product.id === id) ?? null;
    onChange({
      product,
      variantId:
        product?.variants.find((variant) => variant.available)?.id ?? "",
    });
  }
  return (
    <div className="rounded-[10px] border border-admin-line p-5 motion-safe:animate-admin-enter max-[1201px]:p-4 max-[641px]:p-3.5">
      <div className="mb-5 flex items-center justify-between gap-3 max-[641px]:gap-2">
        <h3 className="flex items-center gap-2.5 max-[641px]:text-xs!">
          <span className="inline-flex size-[27px] items-center justify-center rounded-[7px] bg-admin-accent-soft text-[10px] text-[#aa8034]">
            {String(index + 1).padStart(2, "0")}
          </span>
          {line.kind === "custom" ? "Custom item" : "Catalog item"}
        </h3>
        <Button
          className="min-h-[34px]! px-2.5! py-[7px]! text-[10px]! max-[641px]:min-h-[42px]! max-[641px]:min-w-[42px]"
          variant="secondary"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Remove item ${index + 1}`}
        >
          <AdminIcon name="trash" size={15} />
          <span className="max-[641px]:hidden">Remove</span>
        </Button>
      </div>
      <div className={`${adminStyles.formGrid} gap-4!`}>
        {line.kind === "catalog" ? (
          <>
            <div className={adminStyles.formFull}>
              <Field label="Product">
                <select
                  className={adminStyles.select}
                  value={line.product?.id ?? ""}
                  onChange={(event) => selectProduct(event.target.value)}
                  required
                >
                  <option value="">
                    {loading ? "Loading products…" : "Choose a product"}
                  </option>
                  {choices.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                      disabled={!product.available}
                    >
                      {product.title} · {product.stock} in stock
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Size / color">
              <select
                className={adminStyles.select}
                value={line.variantId}
                onChange={(event) =>
                  onChange({ variantId: event.target.value })
                }
                required
                disabled={!line.product}
              >
                <option value="">Choose a variant</option>
                {line.product?.variants.map((variant) => (
                  <option
                    key={variant.id}
                    value={variant.id}
                    disabled={!variant.available}
                  >
                    {[variant.color, variant.size]
                      .filter(Boolean)
                      .join(" / ") || variant.title}
                    {!variant.available ? " · Unavailable" : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Quantity"
              hint={
                line.product
                  ? `${line.product.stock} units available across this product`
                  : undefined
              }
            >
              <input
                className={adminStyles.input}
                type="number"
                min="1"
                max={line.product?.stock || 10000}
                step="1"
                value={line.quantity}
                onChange={(event) => onChange({ quantity: event.target.value })}
                required
                inputMode="numeric"
              />
            </Field>
            {line.product && (
              <div
                className={`${adminStyles.formFull} flex flex-wrap justify-between gap-2.5 rounded-[7px] bg-[#fafbfc] p-[13px] text-[10px] text-admin-muted max-[641px]:gap-[15px] [&>span]:grid [&>span]:gap-[3px] [&_strong]:font-medium [&_strong]:text-admin-ink`}
              >
                <span>
                  Unit price <strong>{formatPrice(amounts.price)}</strong>
                </span>
                <span>
                  Unit cost <strong>{formatPrice(amounts.costPrice)}</strong>
                </span>
                <span>
                  Line total{" "}
                  <strong>
                    {formatPrice(amounts.price * amounts.quantity)}
                  </strong>
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={adminStyles.formFull}>
              <Field label="Custom item name">
                <input
                  className={adminStyles.input}
                  value={line.title}
                  onChange={(event) => onChange({ title: event.target.value })}
                  placeholder="e.g. Ivory wedding panjabi"
                  required
                  maxLength={200}
                />
              </Field>
            </div>
            <Field label="Size / variation">
              <input
                className={adminStyles.input}
                value={line.variant}
                onChange={(event) => onChange({ variant: event.target.value })}
                placeholder="e.g. Size 42 / Ivory"
                maxLength={200}
              />
            </Field>
            <Field label="SKU / reference (optional)">
              <input
                className={adminStyles.input}
                value={line.sku}
                onChange={(event) => onChange({ sku: event.target.value })}
                maxLength={100}
              />
            </Field>
            <Field label="Selling price (Tk)">
              <input
                className={adminStyles.input}
                type="number"
                value={line.price}
                onChange={(event) => onChange({ price: event.target.value })}
                min="0"
                max="10000000"
                step="0.01"
                inputMode="decimal"
                required
              />
            </Field>
            <Field label="Cost price (Tk)">
              <input
                className={adminStyles.input}
                type="number"
                value={line.costPrice}
                onChange={(event) =>
                  onChange({ costPrice: event.target.value })
                }
                min="0"
                max="10000000"
                step="0.01"
                inputMode="decimal"
                required
              />
            </Field>
            <Field label="Quantity">
              <input
                className={adminStyles.input}
                type="number"
                value={line.quantity}
                onChange={(event) => onChange({ quantity: event.target.value })}
                min="1"
                max="10000"
                step="1"
                inputMode="numeric"
                required
              />
            </Field>
          </>
        )}
        <div className={adminStyles.formFull}>
          <Field label="Customization notes (optional)">
            <textarea
              className={`${adminStyles.textarea} min-h-[75px]!`}
              value={line.customizations}
              onChange={(event) =>
                onChange({ customizations: event.target.value })
              }
              placeholder="Measurements, embroidery, fabric or special instructions…"
              maxLength={2000}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
