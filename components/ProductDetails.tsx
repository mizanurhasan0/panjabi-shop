"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { deliveryPolicy } from "@/lib/data/home";
import { formatPrice } from "@/lib/utils/products";
import { AccordionItem } from "./Accordion";
import { IconHeart, IconShare } from "./icons";

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");
  const [selectedSize, setSelectedSize] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const colorVariants = useMemo(
    () => product.variants.filter((v) => v.color === selectedColor),
    [product.variants, selectedColor],
  );

  const selectedVariant = useMemo(() => {
    if (selectedSize) {
      return colorVariants.find((v) => v.size === selectedSize);
    }
    return colorVariants.find((v) => v.available) || colorVariants[0];
  }, [colorVariants, selectedSize]);

  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    for (const v of product.variants.filter((v) => v.color === selectedColor)) {
      if (v.size) sizes.add(v.size);
    }
    return [...sizes];
  }, [product.variants, selectedColor]);

  const isSizeAvailable = (size: string) =>
    product.variants.some(
      (v) => v.color === selectedColor && v.size === size && v.available,
    );

  const handleAddToCart = () => {
    if (selectedVariant?.available) {
      addItem(product, selectedVariant);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.title,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-4">
        <h1 className="m-0 text-[22px] font-normal leading-tight text-ylw-text md:text-[28px]">
          {product.title}
        </h1>
        <button
          type="button"
          onClick={handleShare}
          className="flex shrink-0 items-center gap-1 text-[12px] text-ylw-text-secondary"
        >
          <IconShare />
          Share
        </button>
      </div>

      <p className="mb-1 text-[11px] text-ylw-text-secondary">
        SKU: {selectedVariant?.sku || product.variants[0]?.sku}
      </p>
      <p className="mb-4 text-[11px] text-ylw-text-secondary">
        Product Type: {product.productType}
      </p>

      <p className="mb-6 text-[16px] font-semibold text-ylw-text">
        {formatPrice(selectedVariant?.price ?? product.price)}
      </p>

      {product.colors.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-[12px]">
            Color – <span className="font-medium">{selectedColor}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => {
              const variant = product.variants.find((v) => v.color === color);
              const img = variant ? product.images[0] : product.images[0];
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setSelectedColor(color);
                    setSelectedSize("");
                  }}
                  className={`swatch ${selectedColor === color ? "active" : ""}`}
                  title={color}
                >
                  <Image
                    src={img}
                    alt={color}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {availableSizes.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-[12px] font-medium">Size</p>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => {
              const available = isSizeAvailable(size);
              return (
                <button
                  key={size}
                  type="button"
                  disabled={!available}
                  onClick={() => setSelectedSize(size)}
                  className={`size-option ${
                    selectedSize === size ? "active" : ""
                  } ${!available ? "sold-out" : ""}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
          <Link href="#" className="mt-2 inline-block text-[12px] underline">
            Size Guide
          </Link>
        </div>
      )}

      <AccordionItem title="Description">
        <div
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          className="prose prose-sm max-w-none"
        />
      </AccordionItem>

      <div className="mt-6 space-y-3">
        {selectedVariant?.available ? (
          <button
            type="button"
            onClick={handleAddToCart}
            className="btn-primary w-full"
          >
            Add to cart
          </button>
        ) : (
          <button type="button" disabled className="btn-primary w-full">
            Sold out
          </button>
        )}

        <button
          type="button"
          onClick={() => toggle(product.handle)}
          className="flex w-full items-center justify-center gap-2 border border-ylw-border py-3 text-[12px] uppercase tracking-[0.05em]"
        >
          <IconHeart filled={isWishlisted(product.handle)} />
          {isWishlisted(product.handle)
            ? "Added to wishlist"
            : "Add to wishlist"}
        </button>

        {selectedVariant?.available && (
          <button
            type="button"
            onClick={handleAddToCart}
            className="btn-primary w-full bg-ylw-sale"
          >
            Buy it now
          </button>
        )}
      </div>

      {!product.available && (
        <div className="mt-6 border border-ylw-border p-4">
          <p className="mb-2 text-[12px]">
            Leave your email and we will notify as soon as the product / variant
            is back in stock
          </p>
          {subscribed ? (
            <p className="text-[12px] text-green-700">
              Thanks for subscribing!
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email) setSubscribed(true);
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Insert your email"
                className="flex-1 border border-ylw-border px-3 py-2 text-[12px]"
              />
              <button type="submit" className="btn-primary shrink-0">
                Subscribe
              </button>
            </form>
          )}
        </div>
      )}

      <div className="mt-8 border-t border-ylw-border pt-6">
        <h2 className="mb-1 text-[16px] font-semibold">
          {deliveryPolicy.title}
        </h2>
        <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.05em]">
          {deliveryPolicy.subtitle}
        </p>
        {deliveryPolicy.en.map((p, i) => (
          <p
            key={`en-${i}`}
            className="mb-2 text-[12px] leading-relaxed text-ylw-text-secondary"
          >
            {p}
          </p>
        ))}
        {deliveryPolicy.bn.map((p, i) => (
          <p
            key={`bn-${i}`}
            className="mb-2 text-[12px] leading-relaxed text-ylw-text-secondary"
          >
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
