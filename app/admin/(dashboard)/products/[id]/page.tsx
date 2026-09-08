import { Suspense } from "react";
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
      fallback={<div className="admin-skeleton admin-skeleton-table" />}
    >
      <ProductEditor key={id} id={id} />
    </Suspense>
  );
}
