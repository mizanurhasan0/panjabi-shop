"use client";

import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { useCatalog } from "@/lib/store/catalog";
import { formatPrice } from "@/lib/utils/products";
import { ProductSection } from "@/components/ProductSection";
import { CartProductImage } from "@/components/cart/CartProductImage";
import { CheckoutPreview } from "@/components/cart/CheckoutPreview";
import { QuantityControl } from "@/components/cart/QuantityControl";


export default function CartPage() {
  const { products } = useCatalog();
  const recommendations = products.slice(0, 8);
  const { getLineItems, updateQuantity, removeItem, subtotal, count } =
    useCart();
  const lineItems = getLineItems();

  return (
    <div className="container-ylw pb-16">
      <h1 className="py-10 text-center text-[24px] font-normal uppercase tracking-[0.1em]">
        Your cart
      </h1>

      {count === 0 ? (
        <div className="py-8 text-center">
          <p className="mb-6 text-[14px] text-ylw-text-secondary">
            Your cart is empty
          </p>
          <Link href="/" className="btn-outline">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mx-auto max-w-[800px]">
          <div className="divide-y divide-ylw-border border-y border-ylw-border">
            {lineItems.map(({ item, product, variant, lineTotal }) => (
              <div key={item.variantId} className="flex gap-4 py-6">
                <CartProductImage product={product} layout="page" />
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link
                      href={`/products/${product.handle}`}
                      className="text-[14px] hover:underline"
                    >
                      {product.title}
                    </Link>
                    <p className="mt-1 text-[12px] text-ylw-text-secondary">
                      {variant.color}
                      {variant.size ? ` / ${variant.size}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <QuantityControl
                      quantity={item.quantity}
                      label={`${product.title}, ${variant.title}`}
                      layout="page"
                      onChange={(quantity) =>
                        updateQuantity(item.variantId, quantity)
                      }
                    />
                    <p className="text-[14px] font-medium">
                      {formatPrice(lineTotal)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    aria-label={`Remove ${product.title}, ${variant.title}`}
                    className="self-start text-[11px] text-ylw-text-secondary underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-ylw-border pt-6">
            <span className="text-[14px] uppercase tracking-[0.05em]">
              Subtotal
            </span>
            <span className="text-[18px] font-semibold" aria-live="polite">
              {formatPrice(subtotal)}
            </span>
          </div>

          <CheckoutPreview
            layout="page"

          />
        </div>
      )}

      <ProductSection
        title="You may also like"
        products={recommendations}
        showEmpty
      />
    </div>
  );
}
