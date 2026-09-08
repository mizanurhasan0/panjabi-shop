"use client";

import { useSearchParams } from "next/navigation";
import { useDemoQuery } from "@/lib/demo/client";
import { getProduct } from "@/lib/demo/queries";
import { Alert, Button, EmptyState } from "../ui";
import { adminStyles } from "../styles";
import { ProductForm } from "./ProductForm";

export function ProductEditor({ id }: { id: string }) {
  const { data, error, loading, reload } = useDemoQuery((state) =>
    getProduct(state, id),
  );
  const params = useSearchParams();
  if (loading)
    return (
      <div
        className={adminStyles.stack}
        role="status"
        aria-label="Loading product"
      >
        <div
          className={`${adminStyles.skeleton} mb-2 h-[42px] max-w-[300px]`}
        />
        <div className={`${adminStyles.skeleton} h-[380px]`} />
      </div>
    );
  if (error || !data)
    return (
      <div className={adminStyles.card}>
        <EmptyState
          title="Couldn't load this product"
          description={error || "This product may no longer exist."}
          action={<Button onClick={reload}>Try again</Button>}
        />
      </div>
    );
  return (
    <div className={adminStyles.stack}>
      {params.get("created") === "1" && (
        <Alert tone="success">Your new product has been created.</Alert>
      )}
      <ProductForm product={data} onSaved={reload} />
    </div>
  );
}
