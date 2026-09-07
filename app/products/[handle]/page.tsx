import { ProductPageClient } from "@/components/ProductPageClient";
import { getProductByHandle } from "@/lib/data/products";

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">) {
  const { handle } = await params;
  const product = getProductByHandle(handle);
  return {
    title: product ? `${product.title} | YELLOW` : "Product | YELLOW",
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[handle]">) {
  const { handle } = await params;
  return <ProductPageClient handle={handle} />;
}
