"use client";

import { CatalogProvider, type PublicShop } from "@/lib/store/catalog";
import { CartDrawer } from "./CartDrawer";
import { CartProvider } from "@/lib/store/cart";
import { WishlistProvider } from "@/lib/store/wishlist";

export function Providers({ children, shop }: { children: React.ReactNode; shop: PublicShop }) {
  return (
    <CatalogProvider initial={shop}><CartProvider>
      <WishlistProvider>
        {children}
        <CartDrawer />
      </WishlistProvider>
    </CartProvider></CatalogProvider>
  );
}
