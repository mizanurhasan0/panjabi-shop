import { ProductPageClient } from "@/components/ProductPageClient";
import { getPublicShop } from "@/lib/admin/public-shop";

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">) {
  const { handle } = await params;
  const { products, settings } = getPublicShop();
  const product = products.find((product) => product.handle === handle);
  return {
    title: `${product?.title ?? "Product"} | ${settings.name}`,
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[handle]">) {
  const { handle } = await params;
  return <ProductPageClient key={handle} handle={handle} />;
}
