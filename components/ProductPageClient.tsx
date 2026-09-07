"use client";

import { useEffect } from "react";
import { notFound } from "next/navigation";
import { getProductByHandle, products } from "@/lib/data/products";
import { useRecentlyViewed } from "@/lib/store/recently-viewed";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetails } from "@/components/ProductDetails";
import { ProductGallery } from "@/components/ProductGallery";

interface ProductPageClientProps {
  handle: string;
}

export function ProductPageClient({ handle }: ProductPageClientProps) {
  const product = getProductByHandle(handle);
  const { handles: viewedHandles, addViewed } = useRecentlyViewed();

  useEffect(() => {
    if (product) addViewed(handle);
  }, [product, handle, addViewed]);

  if (!product) notFound();

  const related = products
    .filter(
      (p) =>
        p.handle !== handle && p.collectionHandle === product.collectionHandle,
    )
    .slice(0, 8);

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

      {related.length > 0 && (
        <section className="mt-16">
          <h3 className="section-heading mb-8">Related Products</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.handle} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-16">
        <h3 className="section-heading mb-8">Recently Viewed Products</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {recentlyViewed.map((p) => (
            <ProductCard key={p.handle} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
