"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/products";
import { createOrder } from "@/lib/demo/commands";

export function CheckoutForm() {
  const { getLineItems, subtotal, note, clearCart } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{
    number: string;
    total: number;
  } | null>(null);
  const lines = getLineItems();
  if (confirmation)
    return (
      <div className="container-ylw py-16 text-center">
        <h1 className="mb-4 text-2xl">Demo order created</h1>
        <p className="mb-2">
          Your order number is <strong>{confirmation.number}</strong>.
        </p>
        <p className="mb-6">
          Total: {formatPrice(confirmation.total)}. View it in the demo
          dashboard.
        </p>
        <Link href="/" className="btn-outline">
          Continue shopping
        </Link>
      </div>
    );
  if (!lines.length)
    return (
      <div className="container-ylw py-16 text-center">
        <h1 className="mb-6 text-2xl">Your cart is empty</h1>
        <Link href="/" className="btn-outline">
          Continue shopping
        </Link>
      </div>
    );
  return (
    <div className="container-ylw max-w-[1000px] py-10">
      <h1 className="mb-8 text-2xl">Checkout</h1>
      <p className="mb-6 border border-ylw-border p-4 text-sm">
        Demo checkout · Try the order flow with sample details. No purchase or
        payment is made.
      </p>
      <div className="grid gap-8 md:grid-cols-2">
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            const form = new FormData(event.currentTarget);
            try {
              const order = createOrder(
                {
                  customerName: String(form.get("name") ?? ""),
                  customerPhone: String(form.get("phone") ?? ""),
                  customerEmail: String(form.get("email") ?? ""),
                  address: String(form.get("address") ?? ""),
                  notes: String(form.get("notes") ?? ""),
                  paymentMethod: "cod",
                  items: lines.map(({ item, product }) => ({
                    productId: product.id,
                    variantId: item.variantId,
                    quantity: item.quantity,
                  })),
                },
                { storefront: true },
              );
              setConfirmation(order);
              clearCart();
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Unable to place order.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {[
            {
              name: "name",
              label: "Full name",
              type: "text",
              autoComplete: "name",
              required: true,
            },
            {
              name: "phone",
              label: "Phone number",
              type: "tel",
              autoComplete: "tel",
              required: true,
            },
            {
              name: "email",
              label: "Email address (optional)",
              type: "email",
              autoComplete: "email",
              required: false,
            },
          ].map((field) => (
            <label key={field.name} className="block text-sm">
              {field.label}
              <input
                {...field}
                aria-label={field.label}
                className="mt-1 block w-full border border-ylw-border px-3 py-3"
                maxLength={150}
              />
            </label>
          ))}
          <label className="block text-sm">
            Delivery address
            <textarea
              name="address"
              required
              autoComplete="street-address"
              rows={3}
              maxLength={1000}
              className="mt-1 block w-full border border-ylw-border px-3 py-3"
            />
          </label>
          <label className="block text-sm">
            Order notes (optional)
            <textarea
              name="notes"
              defaultValue={note}
              rows={2}
              maxLength={1000}
              className="mt-1 block w-full border border-ylw-border px-3 py-3"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <button disabled={busy} className="btn-primary w-full" type="submit">
            {busy ? "Creating…" : "Create demo order · Cash on delivery"}
          </button>
        </form>
        <section className="h-fit border border-ylw-border p-6">
          <h2 className="mb-5 text-lg">Order summary</h2>
          {lines.map(({ item, product, variant, lineTotal }) => (
            <div
              key={item.variantId}
              className="mb-4 flex justify-between gap-4"
            >
              <div>
                {product.title}
                <p className="text-ylw-text-secondary">
                  {variant.title} × {item.quantity}
                </p>
              </div>
              <span>{formatPrice(lineTotal)}</span>
            </div>
          ))}
          <div className="mt-5 flex justify-between border-t border-ylw-border pt-4 text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-4 text-ylw-text-secondary">
            Sample cash-on-delivery checkout with free delivery. No payment is
            collected.
          </p>
        </section>
      </div>
    </div>
  );
}
