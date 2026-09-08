import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";

interface CartProductImageProps {
  product: Product;
  layout: "drawer" | "page";
  onNavigate?: () => void;
}

export function CartProductImage({
  product,
  layout,
  onNavigate,
}: CartProductImageProps) {
  return (
    <Link
      href={`/products/${product.handle}`}
      onClick={onNavigate}
      className={
        layout === "drawer"
          ? "relative h-[100px] w-[80px] shrink-0"
          : "relative h-28 w-20 shrink-0 overflow-hidden bg-[#f6f6f6]"
      }
    >
      <Image
        src={product.images[0]}
        alt={product.title}
        fill
        sizes="80px"
        className="object-cover"
      />
    </Link>
  );
}
