"use client";

import { useAdminLanguage } from "@/lib/admin/i18n";

import { useId, useState, type FormEvent } from "react";
import { Modal } from "@/components/Modal";
import { errorMessage } from "@/lib/demo/client";
import { restockProduct } from "@/lib/demo/commands";
import type { AdminProduct } from "@/lib/admin/types";
import { AdminIcon, Alert, Button, Field } from "../ui";
import { adminStyles } from "../styles";

export function RestockDialog({
  product,
  onClose,
  onRestocked,
}: {
  product: AdminProduct | null;
  onClose: () => void;
  onRestocked: () => void;
}) {
  const { t, formatNumber } = useAdminLanguage();
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
      unstyled
      id={id}
      label={t("Restock product")}
      open={Boolean(product)}
      onClose={() => {
        if (!busy) {
          setError("");
          onClose();
        }
      }}
      className={adminStyles.dialog}
      animateExit
    >
      <form
        className={`${adminStyles.dialogContent} ${adminStyles.stack}`}
        onSubmit={submit}
      >
        <div>
          <span className="mb-[17px] flex size-[45px] items-center justify-center rounded-xl bg-[#fff6e6] text-[#a98446]">
            <AdminIcon name="products" size={25} />
          </span>
          <h2>{t("Restock product")}</h2>
          <p>{product?.title}</p>
        </div>
        {error && <Alert>{t(error)}</Alert>}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#eff0f3] bg-[#f7f8fa] px-3.5 py-3 [&>span]:text-[10px] [&>span]:text-[#969aa4] [&_strong]:text-xs [&_strong]:font-medium">
          <span>{t("Current stock")}</span>
          <strong>
            {t("{count} units", { count: formatNumber(product?.stock ?? 0) })}
          </strong>
        </div>
        <Field
          label={t("Quantity to add")}
          hint={t(
            "Stock is tracked for the whole product, across all sizes and colors.",
          )}
        >
          <input
            key={product?.id}
            className={adminStyles.input}
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
        <div className={`${adminStyles.actions} mt-[26px] justify-end`}>
          <Button
            variant="secondary"
            onClick={() => {
              setError("");
              onClose();
            }}
            disabled={busy}
          >
            {t("Cancel")}
          </Button>
          <Button
            type="submit"
            disabled={busy || (product?.stock ?? 0) >= 1_000_000}
          >
            {busy ? t("Adding stock…") : t("Add stock")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
