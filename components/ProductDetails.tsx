"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { formatPrice } from "@/lib/utils/products";
import { AccordionItem } from "./Accordion";
import { BackInStockNotice } from "./product-details/BackInStockNotice";
import { DeliveryPolicy } from "./product-details/DeliveryPolicy";
import { ProductActions } from "./product-details/ProductActions";
import { ProductOptions } from "./product-details/ProductOptions";
import { ShareProductButton } from "./product-details/ShareProductButton";

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");
  const [selectedSize, setSelectedSize] = useState("");

  const { colorVariants, sizes, availableSizes } = useMemo(() => {
    const variants = product.variants.filter(
      (variant) => variant.color === selectedColor,
    );
    return {
      colorVariants: variants,
      sizes: [...new Set(variants.map((variant) => variant.size).filter(Boolean))],
      availableSizes: new Set(
        variants
          .filter((variant) => variant.available)
          .map((variant) => variant.size),
      ),
    };
  }, [product.variants, selectedColor]);
  const selectedVariant = selectedSize
    ? colorVariants.find((variant) => variant.size === selectedSize)
    : colorVariants.find((variant) => variant.available) || colorVariants[0];

  const handleAddToCart = () => {
    if (selectedVariant?.available) addItem(product, selectedVariant);
  };

  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-4">
        <h1 className="m-0 text-[22px] font-normal leading-tight text-ylw-text md:text-[28px]">
          {product.title}
        </h1>
        <ShareProductButton title={product.title} />
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

      <ProductOptions
        colors={product.colors}
        image={product.images[0]}
        selectedColor={selectedColor}
        onColorChange={(color) => {
          setSelectedColor(color);
          setSelectedSize("");
        }}
        sizes={sizes}
        availableSizes={availableSizes}
        selectedSize={selectedSize}
        onSizeChange={setSelectedSize}
      />

      <AccordionItem title="Description">
        <div
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          className="prose prose-sm max-w-none"
        />
      </AccordionItem>

      <ProductActions
        available={Boolean(selectedVariant?.available)}
        wishlisted={isWishlisted(product.handle)}
        onAddToCart={handleAddToCart}
        onToggleWishlist={() => toggle(product.handle)}
      />
      {!product.available && <BackInStockNotice />}
      <DeliveryPolicy />
    </div>
  );
}
