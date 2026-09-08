"use client";

import { useId, useState, type FormEvent } from "react";
import { Modal } from "@/components/Modal";
import { errorMessage } from "@/lib/demo/client";
import { restockProduct } from "@/lib/demo/commands";
import type { AdminProduct } from "@/lib/admin/types";
import { AdminIcon, Alert, Button, Field } from "../ui";

export function RestockDialog({
  product,
  onClose,
  onRestocked,
}: {
  product: AdminProduct | null;
  onClose: () => void;
  onRestocked: () => void;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || busy) return;
    const quantity = Number(new FormData(event.currentTarget).get("quantity"));
    setBusy(true);
    setError("");
    try {
      restockProduct(product.id, quantity);
      onRestocked();
      onClose();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      id={id}
      label="Restock product"
      open={Boolean(product)}
      onClose={() => {
        if (!busy) {
          setError("");
          onClose();
        }
      }}
      className="admin-dialog"
      animateExit
    >
      <form className="admin-dialog-content admin-stack" onSubmit={submit}>
        <div>
          <span className="admin-product-restock-icon">
            <AdminIcon name="products" size={25} />
          </span>
          <h2>Restock product</h2>
          <p>{product?.title}</p>
        </div>
        {error && <Alert>{error}</Alert>}
        <div className="admin-stock-summary">
          <span>Current stock</span>
          <strong>{product?.stock ?? 0} units</strong>
        </div>
        <Field
          label="Quantity to add"
          hint="Stock is tracked for the whole product, across all sizes and colors."
        >
          <input
            key={product?.id}
            className="admin-input"
            name="quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={Math.max(1, 1_000_000 - (product?.stock ?? 0))}
            step={1}
            defaultValue={1}
            required
            disabled={busy}
            data-autofocus
          />
        </Field>
        <div className="admin-actions">
          <Button
            variant="secondary"
            onClick={() => {
              setError("");
              onClose();
            }}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={busy || (product?.stock ?? 0) >= 1_000_000}
          >
            {busy ? "Adding stock…" : "Add stock"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
