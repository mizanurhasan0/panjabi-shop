"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState, type FormEvent } from "react";
import { errorMessage, useDemoQuery } from "@/lib/demo/client";
import { createOrder } from "@/lib/demo/commands";
import { listProducts } from "@/lib/demo/queries";
import type { Order, OrderInput } from "@/lib/admin/types";
import { AdminIcon, Alert, Button, Field, PageHeading } from "../ui";
import { OrderTotals } from "./shared";
import {
  blankOrderLine,
  draftAmounts,
  OrderLineEditor,
  type DraftOrderLine,
} from "./OrderLineEditor";
import "./orders.css";

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
  const subtotal =
    Math.round(
      lines.reduce((sum, line) => {
        const item = draftAmounts(line);
        return sum + item.price * item.quantity;
      }, 0) * 100,
    ) / 100;
  const itemCosts = lines.reduce((sum, line) => {
    const item = draftAmounts(line);
    return sum + item.costPrice * item.quantity;
  }, 0);
  const total =
    Math.round(
      (subtotal + Number(costs.shippingCharge) - Number(costs.discount)) * 100,
    ) / 100;
  const summary = {
    subtotal,
    ...(Object.fromEntries(
      Object.entries(costs).map(([key, value]) => [key, Number(value) || 0]),
    ) as {
      shippingCharge: number;
      discount: number;
      deliveryCost: number;
      additionalCost: number;
    }),
    total,
    profit:
      Math.round(
        (total -
          itemCosts -
          Number(costs.deliveryCost) -
          Number(costs.additionalCost)) *
          100,
      ) / 100,
  };
  const stockTotals = new Map<string, number>();
  for (const line of lines)
    if (line.product)
      stockTotals.set(
        line.product.id,
        (stockTotals.get(line.product.id) ?? 0) + Number(line.quantity),
      );
  const stockProblem = lines.find(
    (line) =>
      line.product &&
      (stockTotals.get(line.product.id) ?? 0) > line.product.stock,
  )?.product;

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
        `${stockProblem.title} has only ${stockProblem.stock} units available. Reduce the combined quantity.`,
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
    <div className="admin-stack">
      <Link className="order-back-link" href="/admin/orders">
        ← Back to orders
      </Link>
      <PageHeading
        title="Create an order"
        description="Add catalog products, made-to-order pieces, or a little of both."
      />
      <form onSubmit={submit} className="order-detail-grid">
        <fieldset className="order-form-fieldset admin-stack" disabled={busy}>
          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2>Customer details</h2>
                <p>Who are we preparing this order for?</p>
              </div>
              <AdminIcon name="orders" />
            </div>
            <div className="admin-form-grid">
              <Field label="Customer name">
                <input
                  className="admin-input"
                  name="customerName"
                  autoComplete="name"
                  required
                  maxLength={200}
                  placeholder="Full name"
                />
              </Field>
              <Field label="Phone number">
                <input
                  className="admin-input"
                  name="customerPhone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={40}
                  placeholder="017XXXXXXXX"
                />
              </Field>
              <div className="admin-form-full">
                <Field label="Email address (optional)">
                  <input
                    className="admin-input"
                    name="customerEmail"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    placeholder="customer@example.com"
                  />
                </Field>
              </div>
              <div className="admin-form-full">
                <Field label="Delivery address">
                  <textarea
                    className="admin-textarea"
                    name="address"
                    autoComplete="street-address"
                    required
                    maxLength={2000}
                    placeholder="House, road, area, district…"
                  />
                </Field>
              </div>
            </div>
          </section>
          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2>Order items</h2>
                <p>
                  Catalog products reserve stock as soon as you create the
                  order.
                </p>
              </div>
              <span className="admin-badge">
                {lines.length} {lines.length === 1 ? "item" : "items"}
              </span>
            </div>
            {lines.some((line) => line.kind === "catalog") && (
              <div className="order-product-search">
                <Field
                  label="Find a catalog product"
                  hint={
                    data && data.total > 100
                      ? "Showing the first 100 matches. Search to find another product."
                      : "Out-of-stock products can be restocked from Products."
                  }
                >
                  <input
                    className="admin-input"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    maxLength={200}
                    placeholder="Search by product name…"
                  />
                </Field>
                {productError && (
                  <Alert>
                    {productError}{" "}
                    <Button variant="secondary" onClick={reload}>
                      Retry
                    </Button>
                  </Alert>
                )}
              </div>
            )}
            <div className="admin-stack">
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
            <div className="admin-actions order-add-actions">
              <Button
                variant="secondary"
                onClick={() => addLine("catalog")}
                disabled={lines.length >= 100}
              >
                <AdminIcon name="plus" size={16} />
                Add product
              </Button>
              <Button
                variant="secondary"
                onClick={() => addLine("custom")}
                disabled={lines.length >= 100}
              >
                <AdminIcon name="edit" size={16} />
                Add custom item
              </Button>
            </div>
            {stockProblem && (
              <Alert>
                {stockProblem.title} has only {stockProblem.stock} units
                available across all matching lines.
              </Alert>
            )}
          </section>
          <section className="admin-card">
            <div className="admin-card-header">
              <h2>Payment &amp; delivery</h2>
            </div>
            <div className="admin-form-grid">
              <Field label="Payment method">
                <select
                  className="admin-select"
                  name="paymentMethod"
                  defaultValue="cod"
                >
                  <option value="cod">Cash on delivery</option>
                  <option value="cash">Cash</option>
                  <option value="mobile">Mobile banking</option>
                  <option value="bank">Bank transfer</option>
                </select>
              </Field>
              <Field label="Payment status">
                <select
                  className="admin-select"
                  name="paymentStatus"
                  defaultValue="unpaid"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </Field>
              {costFields.map((field) => (
                <Field key={field.name} label={field.label} hint={field.hint}>
                  <input
                    className="admin-input"
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
              <div className="admin-form-full">
                <Field label="Order notes (optional)">
                  <textarea
                    className="admin-textarea"
                    name="notes"
                    maxLength={5000}
                    placeholder="Delivery instructions or anything else to remember…"
                  />
                </Field>
              </div>
            </div>
          </section>
        </fieldset>
        <aside className="order-sidebar">
          <section className="admin-card order-sticky-summary">
            <div className="admin-card-header">
              <h2>Order summary</h2>
              <AdminIcon name="orders" size={18} />
            </div>
            <OrderTotals order={summary} />
            <p className="order-footnote">
              The order starts as pending. You can update its stage after
              creation.
            </p>
            {error && <Alert>{error}</Alert>}
            <Button
              className="order-create-button"
              type="submit"
              disabled={busy || Boolean(stockProblem)}
            >
              {busy ? "Creating order…" : "Create order"}
              <AdminIcon name="arrow" size={16} />
            </Button>
            <Link className="order-cancel-link" href="/admin/orders">
              Cancel
            </Link>
          </section>
        </aside>
      </form>
    </div>
  );
}
