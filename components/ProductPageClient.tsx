"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCatalog } from "@/lib/store/catalog";
import { useRecentlyViewed } from "@/lib/store/recently-viewed";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductSection } from "./ProductSection";
import { ProductDetails } from "@/components/ProductDetails";
import { ProductGallery } from "@/components/ProductGallery";

interface ProductPageClientProps {
  handle: string;
}

export function ProductPageClient({ handle }: ProductPageClientProps) {
  const { products, settings, getProductByHandle } = useCatalog();
  const product = getProductByHandle(handle);
  const { handles: viewedHandles, addViewed } = useRecentlyViewed();

  useEffect(() => {
    if (product) addViewed(handle);
  }, [handle, product, addViewed]);
  useEffect(() => {
    document.title = `${product?.title ?? "Product"} | ${settings.name}`;
  }, [product?.title, settings.name]);

  const recentlyViewedHandles = viewedHandles.filter((h) => h !== handle);
  const recentlyViewed = recentlyViewedHandles
    .map((h) => getProductByHandle(h))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 8);

  if (!product)
    return (
      <div className="container-ylw py-16 text-center">
        <h1 className="mb-4 text-2xl">Product unavailable</h1>
        <p className="mb-6">
          This product is not in your current demo collection.
        </p>
        <Link href="/collections/men-s-panjabi" className="btn-outline">
          Explore products
        </Link>
      </div>
    );
  const related = products
    .filter(
      (candidate) =>
        candidate.handle !== handle &&
        candidate.collectionHandle === product.collectionHandle,
    )
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
