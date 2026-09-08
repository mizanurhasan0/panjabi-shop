"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/store/cart";
import { getDefaultVariant } from "@/lib/utils/products";
import { ProductCardImages } from "@/components/product-card/ProductCardImages";
import { ProductCardPrice } from "@/components/product-card/ProductCardPrice";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addItem } = useCart();
  const defaultVariant = getDefaultVariant(product);
  const href = `/products/${product.handle}`;

  const handleAddToCart = () => {
    if (defaultVariant?.available) {
      addItem(product, defaultVariant);
    }
  };

  return (
    <article className="product-card pb-[15px]">
      <div className="product-card-image-wrap relative">
        <Link
          href={href}
          className="absolute inset-0 block"
          aria-label={product.title}
        >
          <ProductCardImages
            product={product}
            primaryClassName="product-card-image-main object-contain"
            secondaryClassName="product-card-image-secondary object-contain opacity-0"
            sizes="(max-width:768px) 50vw, 25vw"
          />

          <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
            {product.isNew && <span className="badge-new">New</span>}
            {!product.available && (
              <span className="badge-sold-out">Sold Out</span>
            )}
          </div>
        </Link>

        {!compact && defaultVariant?.available && (
          <button
            type="button"
            className="product-card-add-btn z-10"
            onClick={handleAddToCart}
            aria-label={`Add ${product.title} to cart`}
          >
            Add to cart
          </button>
        )}
      </div>

      <Link href={href} className="block">
        <div className="mt-3 text-center">
          <h3
            className={`m-0 font-normal text-ylw-text ${
              compact
                ? "text-[12px] leading-4"
                : "text-[15px] tracking-[0.75px]"
            }`}
          >
            {product.title}
          </h3>
          <ProductCardPrice
            product={product}
            className="mt-1 text-[12px] font-normal text-ylw-text"
            compareAtClassName="ml-2 text-ylw-sale line-through"
          />
        </div>
      </Link>
    </article>
  );
}
