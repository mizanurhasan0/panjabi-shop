import { ProductPageClient } from "@/components/ProductPageClient";
import { notFound } from "next/navigation";
import { getProductByHandle, products } from "@/lib/data/products";

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
  const product = getProductByHandle(handle);
  if (!product) notFound();

  const related = products
    .filter(
      (candidate) =>
        candidate.handle !== handle &&
        candidate.collectionHandle === product.collectionHandle,
    )
    .slice(0, 8);

  return <ProductPageClient key={handle} product={product} related={related} />;
}
