import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils/products";

interface ProductCardPriceProps {
  product: Pick<Product, "priceFormatted" | "compareAtPrice">;
  className: string;
  compareAtClassName?: string;
}

export function ProductCardPrice({
  product,
  className,
  compareAtClassName,
}: ProductCardPriceProps) {
  return (
    <p className={className}>
      {product.priceFormatted}
      {!!product.compareAtPrice && (
        <del className={compareAtClassName}>
          {formatPrice(product.compareAtPrice)}
        </del>
      )}
    </p>
  );
}
