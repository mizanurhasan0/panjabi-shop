"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/lib/store/cart";
import { products } from "@/lib/data/products";
import { formatPrice } from "@/lib/utils/products";
import { ProductCard } from "@/components/ProductCard";
import { IconMinus, IconPlus } from "@/components/icons";

export default function CartPage() {
  const [checkoutRequested, setCheckoutRequested] = useState(false);
  const { getLineItems, updateQuantity, removeItem, subtotal, count } =
    useCart();
  const lineItems = getLineItems();
  const recommendations = products.slice(0, 8);

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
                <Link
                  href={`/products/${product.handle}`}
                  className="relative h-28 w-20 shrink-0 overflow-hidden bg-[#f6f6f6]"
                >
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </Link>
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
                    <div className="flex items-center border border-ylw-border">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity - 1)
                        }
                        className="px-2 py-1"
                        aria-label={`Decrease quantity of ${product.title}, ${variant.title}`}
                      >
                        <IconMinus className="h-3 w-3" />
                      </button>
                      <span className="px-3 text-[12px]" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity + 1)
                        }
                        className="px-2 py-1"
                        aria-label={`Increase quantity of ${product.title}, ${variant.title}`}
                      >
                        <IconPlus className="h-3 w-3" />
                      </button>
                    </div>
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

          <p className="mt-4 text-[13px] text-ylw-text-secondary">
            Taxes to be included at checkout. Delivery is FREE nationwide.
          </p>
          <button
            type="button"
            onClick={() => setCheckoutRequested(true)}
            className="btn-primary mt-6 w-full"
          >
            Checkout
          </button>
          {checkoutRequested && (
            <p
              role="status"
              className="mt-3 text-[13px] text-ylw-text-secondary"
            >
              Checkout is not available on this preview. Your cart is saved.
            </p>
          )}
        </div>
      )}

      <section className="mt-16">
        <h3 className="section-heading mb-8">You may also like</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {recommendations.map((p) => (
            <ProductCard key={p.handle} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
