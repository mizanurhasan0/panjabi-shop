"use client";

import { useSearchParams } from "next/navigation";
import { useDemoQuery } from "@/lib/demo/client";
import { getProduct } from "@/lib/demo/queries";
import { Alert, Button, EmptyState } from "../ui";
import { ProductForm } from "./ProductForm";

export function ProductEditor({ id }: { id: string }) {
  const { data, error, loading, reload } = useDemoQuery((state) =>
    getProduct(state, id),
  );
  const params = useSearchParams();
  if (loading)
    return (
      <div className="admin-stack" role="status" aria-label="Loading product">
        <div className="admin-skeleton admin-skeleton-heading" />
        <div className="admin-skeleton admin-skeleton-table" />
      </div>
    );
  if (error || !data)
    return (
      <div className="admin-card">
        <EmptyState
          title="Couldn't load this product"
          description={error || "This product may no longer exist."}
          action={<Button onClick={reload}>Try again</Button>}
        />
      </div>
    );
  return (
    <div className="admin-stack">
      {params.get("created") === "1" && (
        <Alert tone="success">Your new product has been created.</Alert>
      )}
      <ProductForm product={data} onSaved={reload} />
    </div>
  );
}
