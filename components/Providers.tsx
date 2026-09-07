"use client";

import { CartDrawer } from "./CartDrawer";
import { CartProvider } from "@/lib/store/cart";
import { WishlistProvider } from "@/lib/store/wishlist";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        {children}
        <CartDrawer />
      </WishlistProvider>
    </CartProvider>
  );
}
