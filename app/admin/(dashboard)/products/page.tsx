import { Suspense } from "react";
import { adminStyles } from "@/components/admin/styles";
import { ProductList } from "@/components/admin/products/ProductList";

export const metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <Suspense
      fallback={<div className={`${adminStyles.skeleton} h-[380px]`} />}
    >
      <ProductList />
    </Suspense>
  );
}
