import { ProductPageClient } from "@/components/ProductPageClient";
import { notFound } from "next/navigation";
import { getPublicShop } from "@/lib/admin/public-shop";

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">) {
  const { handle } = await params;
  const { products } = getPublicShop();
  const product = products.find(product => product.handle === handle);
  return {
    title: product ? `${product.title} | YELLOW` : "Product | YELLOW",
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[handle]">) {
  const { handle } = await params;
  const { products } = getPublicShop();
  const product = products.find(product => product.handle === handle);
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
