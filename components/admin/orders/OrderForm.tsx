"use client";

import { useAdminLanguage } from "@/lib/admin/i18n";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState, type FormEvent } from "react";
import { errorMessage, useDemoQuery } from "@/lib/demo/client";
import { createOrder } from "@/lib/demo/commands";
import { listProducts } from "@/lib/demo/queries";
import type { Order, OrderInput } from "@/lib/admin/types";
import { adminStyles } from "../styles";
import { orderStyles } from "./styles";
import {
  AdminActionBar,
  AdminIcon,
  Alert,
  Button,
  Field,
  PageHeading,
} from "../ui";
import { OrderTotals, paymentMethodLabels } from "./shared";
import {
  blankOrderLine,
  summarizeDraftOrder,
  type DraftOrderLine,
} from "./draft";
import { OrderLineEditor } from "./OrderLineEditor";

const costFields = [
  {
    name: "shippingCharge",
    label: "Delivery charge (Tk)",
    hint: "Amount charged to the customer",
  },
  {
    name: "discount",
    label: "Discount (Tk)",
    hint: "Deducted from the subtotal",
  },
  {
    name: "deliveryCost",
    label: "Delivery expense (Tk)",
    hint: "What you pay the courier",
  },
  {
    name: "additionalCost",
    label: "Other expenses (Tk)",
    hint: "Packaging, tailoring or other costs",
  },
] as const;

export function OrderForm() {
  const { t, formatNumber } = useAdminLanguage();
  const router = useRouter();
  const [lines, setLines] = useState<DraftOrderLine[]>(() => [
    blankOrderLine("catalog"),
  ]);
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search);
  const {
    data,
    error: productError,
    loading,
    reload,
  } = useDemoQuery((state) => listProducts(state, { pageSize: 100, query }));
  const [costs, setCosts] = useState({
    shippingCharge: "0",
    discount: "0",
    deliveryCost: "0",
    additionalCost: "0",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { summary, stockProblem } = useMemo(
    () => summarizeDraftOrder(lines, costs),
    [lines, costs],
  );
  const { subtotal } = summary;

  function updateLine(id: string, update: Partial<DraftOrderLine>) {
    setLines((previous) =>
      previous.map((line) => (line.id === id ? { ...line, ...update } : line)),
    );
  }
  function addLine(kind: DraftOrderLine["kind"]) {
    setLines((previous) =>
      kind === "custom" &&
      previous.length === 1 &&
      previous[0].kind === "catalog" &&
      !previous[0].product
        ? [blankOrderLine(kind)]
        : [...previous, blankOrderLine(kind)],
    );
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    if (Number(costs.discount) > subtotal) {
      setError("Discount cannot exceed the order subtotal.");
      return;
    }
    if (stockProblem) {
      setError(
        t(
          "{product} has only {count} units available. Reduce the combined quantity.",
          {
            product: stockProblem.title,
            count: formatNumber(stockProblem.stock),
          },
        ),
      );
      return;
    }
    const payload: OrderInput = {
      customerName: String(form.get("customerName") ?? ""),
      customerPhone: String(form.get("customerPhone") ?? ""),
      customerEmail: String(form.get("customerEmail") ?? ""),
      address: String(form.get("address") ?? ""),
      notes: String(form.get("notes") ?? ""),
      paymentMethod: form.get("paymentMethod") as Order["paymentMethod"],
      paymentStatus: form.get("paymentStatus") as Order["paymentStatus"],
      shippingCharge: summary.shippingCharge,
      discount: summary.discount,
      deliveryCost: summary.deliveryCost,
      additionalCost: summary.additionalCost,
      items: lines.map((line) => ({
        productId: line.product?.id ?? null,
        variantId: line.product ? line.variantId : null,
        title: line.title,
        sku: line.sku,
        variant: line.variant,
        quantity: Number(line.quantity),
        price: Number(line.price),
        costPrice: Number(line.costPrice),
        customizations: line.customizations,
      })),
    };
    setBusy(true);
    setError("");
    try {
      const order = createOrder(payload);
      router.push(`/admin/orders/${order.id}`);
    } catch (error) {
      setError(errorMessage(error));
      setBusy(false);
    }
  }

  return (
    <div className={adminStyles.stack}>
      <PageHeading
        title={t("Create an order")}
        description={t(
          "Add catalog products, made-to-order pieces, or a little of both.",
        )}
      />
      <div className={adminStyles.card}>
        <AdminActionBar
          label={t("New order actions")}
          actions={
            <>
              <Link
                className={adminStyles.buttonSecondary}
                href="/admin/orders"
              >
                {t("Cancel")}
              </Link>
              <Button
                type="submit"
                form="create-order"
                disabled={busy || Boolean(stockProblem)}
              >
                <AdminIcon name="plus" size={16} />
                {busy ? t("Creating order…") : t("Create order")}
              </Button>
            </>
          }
        >
          <Link className={orderStyles.backLink} href="/admin/orders">
            {t("← Back to orders")}
          </Link>
        </AdminActionBar>
      </div>
      <form
        id="create-order"
        onSubmit={submit}
        className={orderStyles.detailGrid}
      >
        <fieldset
          className={`${adminStyles.stack} m-0 min-w-0 border-0 p-0`}
          disabled={busy}
        >
          <section className={adminStyles.card}>
            <div className={adminStyles.cardHeader}>
              <div>
                <h2>{t("Customer details")}</h2>
                <p>{t("Who are we preparing this order for?")}</p>
              </div>
              <AdminIcon name="orders" />
            </div>
            <div className={adminStyles.formGrid}>
              <Field label={t("Customer name")}>
                <input
                  className={adminStyles.input}
                  name="customerName"
                  autoComplete="name"
                  required
                  maxLength={200}
                  placeholder={t("Full name")}
                />
              </Field>
              <Field label={t("Phone number")}>
                <input
                  className={adminStyles.input}
                  name="customerPhone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={40}
                  placeholder="017XXXXXXXX"
                />
              </Field>
              <div className={adminStyles.formFull}>
                <Field label={t("Email address (optional)")}>
                  <input
                    className={adminStyles.input}
                    name="customerEmail"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    placeholder="customer@example.com"
                  />
                </Field>
              </div>
              <div className={adminStyles.formFull}>
                <Field label={t("Delivery address")}>
                  <textarea
                    className={adminStyles.textarea}
                    name="address"
                    autoComplete="street-address"
                    required
                    maxLength={2000}
                    placeholder={t("House, road, area, district…")}
                  />
                </Field>
              </div>
            </div>
          </section>
          <section className={adminStyles.card}>
            <div className={adminStyles.cardHeader}>
              <div>
                <h2>{t("Order items")}</h2>
                <p>
                  {t(
                    "Catalog products reserve stock as soon as you create the order.",
                  )}
                </p>
              </div>
              <span className={adminStyles.badge}>
                {t(lines.length === 1 ? "{count} item" : "{count} items", {
                  count: formatNumber(lines.length),
                })}
              </span>
            </div>
            {lines.some((line) => line.kind === "catalog") && (
              <div className="mb-[22px]">
                <Field
                  label={t("Find a catalog product")}
                  hint={
                    data && data.total > 100
                      ? t(
                          "Showing the first 100 matches. Search to find another product.",
                        )
                      : t(
                          "Out-of-stock products can be restocked from Products.",
                        )
                  }
                >
                  <input
                    className={adminStyles.input}
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    maxLength={200}
                    placeholder={t("Search by product name…")}
                  />
                </Field>
                {productError && (
                  <div className="mt-3">
                    <Alert>
                      {t(productError)}{" "}
                      <Button variant="secondary" onClick={reload}>
                        {t("Retry")}
                      </Button>
                    </Alert>
                  </div>
                )}
              </div>
            )}
            <div className={adminStyles.stack}>
              {lines.map((line, index) => (
                <OrderLineEditor
                  key={line.id}
                  line={line}
                  index={index}
                  products={data?.items ?? []}
                  loading={loading}
                  onChange={(update) => updateLine(line.id, update)}
                  canRemove={lines.length > 1}
                  onRemove={() =>
                    setLines((previous) =>
                      previous.filter((entry) => entry.id !== line.id),
                    )
                  }
                />
              ))}
            </div>
            <div
              className={`${adminStyles.actions} mt-5 max-[641px]:[&>button]:flex-1`}
            >
              <Button
                variant="secondary"
                onClick={() => addLine("catalog")}
                disabled={lines.length >= 100}
              >
                <AdminIcon name="plus" size={16} />
                {t("Add product")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => addLine("custom")}
                disabled={lines.length >= 100}
              >
                <AdminIcon name="edit" size={16} />
                {t("Add custom item")}
              </Button>
            </div>
            {stockProblem && (
              <div className="mt-[18px]">
                <Alert>
                  {t(
                    "{product} has only {count} units available across all matching lines.",
                    {
                      product: stockProblem.title,
                      count: formatNumber(stockProblem.stock),
                    },
                  )}
                </Alert>
              </div>
            )}
          </section>
          <section className={adminStyles.card}>
            <div className={adminStyles.cardHeader}>
              <h2>{t("Payment & delivery")}</h2>
            </div>
            <div className={adminStyles.formGrid}>
              <Field label={t("Payment method")}>
                <select
                  className={adminStyles.select}
                  name="paymentMethod"
                  defaultValue="cod"
                >
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {t(label)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("Payment status")}>
                <select
                  className={adminStyles.select}
                  name="paymentStatus"
                  defaultValue="unpaid"
                >
                  <option value="unpaid">{t("Unpaid")}</option>
                  <option value="paid">{t("Paid")}</option>
                </select>
              </Field>
              {costFields.map((field) => (
                <Field
                  key={field.name}
                  label={t(field.label)}
                  hint={t(field.hint)}
                >
                  <input
                    className={adminStyles.input}
                    type="number"
                    min="0"
                    max={field.name === "discount" ? subtotal : 10000000}
                    step="0.01"
                    inputMode="decimal"
                    value={costs[field.name]}
                    onChange={(event) =>
                      setCosts((previous) => ({
                        ...previous,
                        [field.name]: event.target.value,
                      }))
                    }
                    required
                  />
                </Field>
              ))}
              <div className={adminStyles.formFull}>
                <Field label={t("Order notes (optional)")}>
                  <textarea
                    className={adminStyles.textarea}
                    name="notes"
                    maxLength={5000}
                    placeholder={t(
                      "Delivery instructions or anything else to remember…",
                    )}
                  />
                </Field>
              </div>
            </div>
          </section>
        </fieldset>
        <aside className="min-w-0">
          <section
            className={`${adminStyles.card} sticky top-[22px] max-[1001px]:static`}
          >
            <div className={adminStyles.cardHeader}>
              <h2>{t("Order summary")}</h2>
              <AdminIcon name="orders" size={18} />
            </div>
            <OrderTotals order={summary} />
            <p className={orderStyles.footnote}>
              {t(
                "The order starts as pending. You can update its stage after creation.",
              )}
            </p>
            {error && (
              <div className="mt-[18px]">
                <Alert>{t(error)}</Alert>
              </div>
            )}
            <AdminActionBar
              label={t("Order summary actions")}
              className="mt-4"
              actions={
                <Button
                  className="w-full"
                  type="submit"
                  disabled={busy || Boolean(stockProblem)}
                >
                  {busy ? t("Creating order…") : t("Create order")}
                  <AdminIcon name="arrow" size={16} />
                </Button>
              }
            />
          </section>
        </aside>
      </form>
    </div>
  );
}
