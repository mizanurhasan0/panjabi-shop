"use client";

import { useEffect } from "react";
import { useCatalog } from "@/lib/store/catalog";
import { useRecentlyViewed } from "@/lib/store/recently-viewed";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Product } from "@/lib/types";
import { ProductSection } from "./ProductSection";
import { ProductDetails } from "@/components/ProductDetails";
import { ProductGallery } from "@/components/ProductGallery";

interface ProductPageClientProps {
  product: Product;
  related: Product[];
}

export function ProductPageClient({ product, related }: ProductPageClientProps) {
  const { getProductByHandle } = useCatalog();
  const { handle } = product;
  const { handles: viewedHandles, addViewed } = useRecentlyViewed();

  useEffect(() => {
    addViewed(handle);
  }, [handle, addViewed]);

  const recentlyViewedHandles = viewedHandles.filter((h) => h !== handle);
  const recentlyViewed = recentlyViewedHandles
    .map((h) => getProductByHandle(h))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 8);

  return (
    <div className="container-ylw pb-16">
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: product.title }]}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery product={product} />
        <ProductDetails product={product} />
      </div>

      <ProductSection title="Related Products" products={related} />
      <ProductSection
        title="Recently Viewed Products"
        products={recentlyViewed}
        showEmpty
      />
    </div>
  );
}
