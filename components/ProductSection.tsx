import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

interface ProductSectionProps {
  title: string;
  products: Product[];
  showEmpty?: boolean;
}

export function ProductSection({
  title,
  products,
  showEmpty = false,
}: ProductSectionProps) {
  if (!showEmpty && products.length === 0) return null;

  return (
    <section className="mt-16">
      <h3 className="section-heading mb-8">{title}</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.handle} product={product} />
        ))}
      </div>
    </section>
  );
}
