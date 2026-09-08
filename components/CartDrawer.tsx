"use client";

import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/products";
import { IconClose } from "./icons";
import { Modal } from "./Modal";
import { CartNote } from "./cart/CartNote";
import { CartProductImage } from "./cart/CartProductImage";
import { CheckoutPreview } from "./cart/CheckoutPreview";
import { QuantityControl } from "./cart/QuantityControl";

export function CartDrawer() {
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
                  <CartProductImage
                    product={product}
                    layout="drawer"
                    onNavigate={closeCart}
                  />
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
                      <QuantityControl
                        quantity={item.quantity}
                        label={product.title}
                        layout="drawer"
                        onChange={(quantity) =>
                          updateQuantity(item.variantId, quantity)
                        }
                      />
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
              <CheckoutPreview layout="drawer" onRequest={closeCart} />
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
