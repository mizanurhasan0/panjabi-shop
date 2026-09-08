import { Suspense } from "react";
import { ProductList } from "@/components/admin/products/ProductList";

export const metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <Suspense
      fallback={<div className="admin-skeleton admin-skeleton-table" />}
    >
      <ProductList />
    </Suspense>
  );
}
