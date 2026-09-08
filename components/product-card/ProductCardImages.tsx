import Image from "next/image";
import type { Product } from "@/lib/types";

interface ProductCardImagesProps {
  product: Pick<Product, "images" | "title">;
  sizes: string;
  primaryClassName?: string;
  secondaryClassName: string;
}

export function ProductCardImages({
  product,
  sizes,
  primaryClassName,
  secondaryClassName,
}: ProductCardImagesProps) {
  const [primaryImage, secondaryImage] = product.images;

  return (
    <>
      {primaryImage && (
        <Image
          src={primaryImage}
          alt={product.title}
          fill
          sizes={sizes}
          className={primaryClassName}
        />
      )}
      {secondaryImage && (
        <Image
          src={secondaryImage}
          alt=""
          fill
          sizes={sizes}
          className={secondaryClassName}
        />
      )}
    </>
  );
}
