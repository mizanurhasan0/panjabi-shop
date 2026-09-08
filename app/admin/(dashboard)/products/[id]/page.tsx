import { Suspense } from "react";
import { adminStyles } from "@/components/admin/styles";
import { ProductEditor } from "@/components/admin/products/ProductEditor";

export const metadata = { title: "Edit product" };

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={<div className={`${adminStyles.skeleton} h-[380px]`} />}
    >
      <ProductEditor key={id} id={id} />
    </Suspense>
  );
}
