"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/products";
import { IconClose, IconMinus, IconPlus } from "./icons";
import { Modal } from "./Modal";

function CartNote() {
  const { note, setNote } = useCart();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <div className="mb-4">
      <button
        type="button"
        aria-label="Order special instructions"
        aria-expanded={editing}
        aria-controls="cart-note-editor"
        className="mx-auto flex h-[58px] w-[90px] items-center justify-center border border-ylw-border"
        onClick={() => {
          setDraft(note);
          setEditing(!editing);
        }}
      >
        <svg
          width="20"
          height="24"
          viewBox="0 0 20 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          aria-hidden="true"
        >
          <path d="M7 4H3a1 1 0 0 0-1 1v17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-4" />
          <path d="M7 3h1V2a2 2 0 0 1 4 0v1h1v3H7Z" />
        </svg>
      </button>
      {editing && (
        <div id="cart-note-editor" className="mt-3">
          <label htmlFor="cart-note" className="mb-2 block">
            Order special instructions
          </label>
          <textarea
            id="cart-note"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full resize-y border border-ylw-border p-2"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="cart-action cart-action-dark"
              onClick={() => {
                setNote(draft);
                setEditing(false);
              }}
            >
              Save
            </button>
            <button
              type="button"
              className="cart-action"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CartDrawer() {
  const [checkoutRequested, setCheckoutRequested] = useState(false);
  const {
    isOpen,
    closeCart,
    count,
    subtotal,
    getLineItems,
    updateQuantity,
    removeItem,
  } = useCart();

  return (
    <Modal
      id="shopping-cart"
      label="Shopping Cart"
      open={isOpen}
      onClose={closeCart}
      className="cart-panel"
      animateExit
    >
      <div className="cart-panel-header">
        <h2>Shopping Cart</h2>
        <p aria-live="polite">
          {count} {count === 1 ? "item" : "items"}
        </p>
        <button type="button" onClick={closeCart} aria-label="Close cart">
          <IconClose />
        </button>
      </div>
      <div className="cart-panel-content">
        {count === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty</p>
            <button type="button" className="cart-action" onClick={closeCart}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <ul className="cart-lines">
              {getLineItems().map(({ item, product, variant }) => (
                <li key={item.variantId} className="cart-line">
                  <Link
                    href={`/products/${product.handle}`}
                    onClick={closeCart}
                    className="relative h-[100px] w-[80px] shrink-0"
                  >
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${product.handle}`}
                      onClick={closeCart}
                      className="hover:underline"
                    >
                      {product.title}
                    </Link>
                    <p className="my-2 text-[12px] text-ylw-text-secondary">
                      {[variant.color, variant.size]
                        .filter(Boolean)
                        .join(" / ")}
                    </p>
                    <p className="text-[14px] font-semibold">
                      {formatPrice(variant.price)}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div
                        className="cart-quantity"
                        role="group"
                        aria-label={`Quantity for ${product.title}`}
                      >
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${product.title}`}
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                        >
                          <IconMinus className="h-3 w-3" />
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${product.title}`}
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                        >
                          <IconPlus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="p-1"
                        aria-label={`Remove ${product.title}`}
                        onClick={() => removeItem(item.variantId)}
                      >
                        <IconClose className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="cart-summary">
              <CartNote />
              <div className="mb-2 flex justify-between font-semibold">
                <span>Subtotal:</span>
                <span aria-live="polite">{formatPrice(subtotal)}</span>
              </div>
              <div className="mb-2 flex items-center justify-between font-semibold">
                <span>Total:</span>
                <span className="text-[16px]" aria-live="polite">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mb-4 text-ylw-text-secondary">
                Taxes to be included at checkout. Delivery is FREE nationwide.
              </p>
              <button
                type="button"
                onClick={() => setCheckoutRequested(true)}
                className="cart-action cart-action-dark"
              >
                Checkout
              </button>
              {checkoutRequested && (
                <p role="status" className="mt-3 text-ylw-text-secondary">
                  Checkout is not available on this preview. Your cart is saved.
                </p>
              )}
              <Link
                href="/cart"
                onClick={closeCart}
                className="cart-action mt-3"
              >
                View Cart
              </Link>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
