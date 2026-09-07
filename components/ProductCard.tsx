"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/store/cart";
import { getDefaultVariant } from "@/lib/utils/products";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addItem } = useCart();
  const secondaryImage = product.images[1];
  const defaultVariant = getDefaultVariant(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (defaultVariant && defaultVariant.available) {
      addItem(product, defaultVariant);
    }
  };

  return (
    <article className="product-card group pb-[15px]">
      <Link href={`/products/${product.handle}`} className="block">
        <div className="product-card-image-wrap relative">
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="product-card-image-main object-contain"
            sizes="(max-width:768px) 50vw, 25vw"
          />
          {secondaryImage && (
            <Image
              src={secondaryImage}
              alt={product.title}
              fill
              className="product-card-image-secondary object-contain opacity-0"
              sizes="(max-width:768px) 50vw, 25vw"
            />
          )}

          <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
            {product.isNew && <span className="badge-new">New</span>}
            {!product.available && (
              <span className="badge-sold-out">Sold Out</span>
            )}
          </div>

          {!compact && defaultVariant?.available && (
            <button
              type="button"
              className="product-card-add-btn z-10"
              onClick={handleAddToCart}
            >
              Add to cart
            </button>
          )}
        </div>

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
          <p className="mt-1 text-[12px] font-normal text-ylw-text">
            {product.priceFormatted}
            {product.compareAtPrice && (
              <span className="ml-2 text-ylw-sale line-through">
                Tk{" "}
                {product.compareAtPrice.toLocaleString("en-BD", {
                  minimumFractionDigits: 2,
                })}
              </span>
            )}
          </p>
        </div>
      </Link>
    </article>
  );
}
