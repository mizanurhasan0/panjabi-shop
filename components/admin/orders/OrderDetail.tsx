"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { errorMessage, useDemoQuery } from "@/lib/demo/client";
import { deleteOrder, updateOrder } from "@/lib/demo/commands";
import { getOrder } from "@/lib/demo/queries";
import { downloadOrderPdf } from "@/lib/demo/downloads";
import {
  orderStageTransitions,
  type Order,
  type ShopSettings,
} from "@/lib/admin/types";
import { formatPrice } from "@/lib/utils/products";
import { adminStyles } from "../styles";
import { orderStyles } from "./styles";
import {
  AdminIcon,
  Alert,
  Button,
  ConfirmDialog,
  Field,
  PageHeading,
  StatusBadge,
} from "../ui";
import { orderDate, OrderLoading, OrderTotals } from "./shared";

export function OrderDetail({ id }: { id: string }) {
  const { data, error, loading, reload } = useDemoQuery((state) => ({
    order: getOrder(state, id),
    settings: state.settings,
  }));
  if (loading) return <OrderLoading />;
  if (error || !data?.order)
    return (
      <div className={adminStyles.stack}>
        <PageHeading title="Order details" />
        <Alert>
          {error || "This order is no longer in your demo workspace."}
        </Alert>
        <div className={adminStyles.actions}>
          <Button onClick={reload}>Try again</Button>
          <Link href="/admin/orders" className={adminStyles.buttonSecondary}>
            Back to orders
          </Link>
        </div>
      </div>
    );
  return <OrderDetailContent order={data.order} settings={data.settings} />;
}

function OrderDetailContent({
  order,
  settings,
}: {
  order: Order;
  settings: ShopSettings;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  async function download() {
    setExporting(true);
    setError("");
    try {
      await downloadOrderPdf(order, settings);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setExporting(false);
    }
  }
  function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      updateOrder(order.id, {
        stage: data.get("stage"),
        paymentStatus: data.get("paymentStatus"),
        note: data.get("note"),
        deliveryCost: Number(data.get("deliveryCost")),
        additionalCost: Number(data.get("additionalCost")),
      });
      setSuccess("Order updated successfully.");
      form.reset();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  function remove() {
    setBusy(true);
    setError("");
    try {
      deleteOrder(order.id);
      router.push("/admin/orders");
    } catch (error) {
      setError(errorMessage(error));
      setConfirm(false);
      setBusy(false);
    }
  }
  const stageOptions = [order.stage, ...orderStageTransitions[order.stage]];
  return (
    <div className={adminStyles.stack}>
      <Link className={orderStyles.backLink} href="/admin/orders">
        ← Back to orders
      </Link>
      <PageHeading
        title={`Order ${order.number}`}
        description={`Placed ${orderDate(order.createdAt, true)} · ${order.source} order`}
        actions={
          <>
            <Button variant="secondary" onClick={download} disabled={exporting}>
              <AdminIcon name="download" size={16} />
              {exporting ? "Preparing PDF…" : "Download PDF"}
            </Button>
            <Button variant="danger" onClick={() => setConfirm(true)}>
              <AdminIcon name="trash" size={16} />
              Delete order
            </Button>
          </>
        }
      />
      <div className={adminStyles.actions}>
        <StatusBadge stage={order.stage} />
        <StatusBadge stage={order.paymentStatus} />
        <span className={adminStyles.muted}>
          {order.paymentMethod.toUpperCase()} payment
        </span>
      </div>
      {error && <Alert>{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}
      <div className={orderStyles.detailGrid}>
        <div className={adminStyles.stack}>
          <section className={adminStyles.card}>
            <div className={adminStyles.cardHeader}>
              <h2>Order items</h2>
              <span className={adminStyles.muted}>
                {order.items.length} line items
              </span>
            </div>
            <div className={adminStyles.tableWrap}>
              <table className={adminStyles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit price</th>
                    <th>Unit cost</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Product">
                        <strong>{item.title}</strong>
                        <small>
                          {item.variant || "Custom item"}
                          {item.sku ? ` · ${item.sku}` : ""}
                        </small>
                        {item.customizations && (
                          <p className="mt-2 rounded-[5px] bg-[#fffaef] px-[9px] py-[7px] text-[10px] whitespace-pre-wrap text-[#92713a]">
                            {item.customizations}
                          </p>
                        )}
                      </td>
                      <td data-label="Quantity">{item.quantity}</td>
                      <td data-label="Unit price">{formatPrice(item.price)}</td>
                      <td data-label="Unit cost">
                        {formatPrice(item.costPrice)}
                      </td>
                      <td data-label="Total">
                        <strong>
                          {formatPrice(item.quantity * item.price)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={orderStyles.footnote}>
              Product prices and unit costs are saved when the order is created.
            </p>
          </section>
          <section className={adminStyles.card}>
            <div className={adminStyles.cardHeader}>
              <h2>Update order</h2>
            </div>
            <form
              className={adminStyles.stack}
              onSubmit={update}
              key={order.updatedAt}
            >
              <div className={adminStyles.formGrid}>
                <Field
                  label="Order stage"
                  hint={
                    orderStageTransitions[order.stage].length
                      ? "Only the next valid stages are available."
                      : "This order has reached its final stage."
                  }
                >
                  <select
                    className={adminStyles.select}
                    name="stage"
                    defaultValue={order.stage}
                    disabled={busy}
                  >
                    {stageOptions.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Payment status">
                  <select
                    className={adminStyles.select}
                    name="paymentStatus"
                    defaultValue={order.paymentStatus}
                    disabled={busy}
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    {order.paymentStatus !== "unpaid" && (
                      <option value="refunded">Refunded</option>
                    )}
                  </select>
                </Field>
                <Field
                  label="Delivery expense (Tk)"
                  hint="Actual courier cost, deducted from your profit."
                >
                  <input
                    className={adminStyles.input}
                    type="number"
                    name="deliveryCost"
                    min="0"
                    max="10000000"
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={order.deliveryCost}
                    required
                    disabled={busy}
                  />
                </Field>
                <Field
                  label="Other expenses (Tk)"
                  hint="Packaging, tailoring or other costs for this order."
                >
                  <input
                    className={adminStyles.input}
                    type="number"
                    name="additionalCost"
                    min="0"
                    max="10000000"
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={order.additionalCost}
                    required
                    disabled={busy}
                  />
                </Field>
              </div>
              <Field
                label="Add a note"
                hint="Notes are saved to the order timeline."
              >
                <textarea
                  className={adminStyles.textarea}
                  name="note"
                  placeholder="Delivery update, customer request or payment reference…"
                  maxLength={2000}
                  disabled={busy}
                />
              </Field>
              <p className={orderStyles.footnote}>
                Cancelling or returning an order restores its reserved stock
                once.
              </p>
              <div className={adminStyles.actions}>
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                  <AdminIcon name="check" size={16} />
                </Button>
              </div>
            </form>
          </section>
          <section className={adminStyles.card}>
            <div className={adminStyles.cardHeader}>
              <h2>Order timeline</h2>
            </div>
            <ol className="m-0 list-none p-0">
              {order.history.toReversed().map((event) => (
                <li
                  key={event.id}
                  className="relative flex gap-[17px] pb-[25px] last:pb-0 not-last:before:absolute not-last:before:top-2.5 not-last:before:bottom-0 not-last:before:left-[5px] not-last:before:w-px not-last:before:bg-[#e7e9ee] not-last:before:content-['']"
                >
                  <span className="relative z-1 mt-[7px] size-[11px] shrink-0 rounded-full border-[3px] border-[#faf1df] bg-[#c0984c]" />
                  <div className="min-w-0">
                    <StatusBadge stage={event.stage} />
                    <p className="mt-1.5 text-[11px] whitespace-pre-wrap [overflow-wrap:anywhere] max-[641px]:text-xs">
                      {event.note}
                    </p>
                    <time
                      className="mt-1 block text-[9px] text-[#969aa3]"
                      dateTime={event.createdAt}
                    >
                      {orderDate(event.createdAt, true)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className={`${adminStyles.stack} min-w-0`}>
          <section className={adminStyles.card}>
            <div className={adminStyles.cardHeader}>
              <h2>Customer</h2>
              <AdminIcon name="orders" size={18} />
            </div>
            <div className="grid gap-2 [overflow-wrap:anywhere] [&>div]:mt-2 [&>div]:border-t [&>div]:border-admin-line [&>div]:pt-[15px] [&_h3]:mb-1.5 [&_h3]:text-[10px]! [&_h3]:font-medium! [&_h3]:text-[#9599a2] [&_p]:text-[11px] [&_p]:whitespace-pre-wrap">
              <strong className="text-sm font-medium">
                {order.customerName}
              </strong>
              <a
                className="text-[11px] text-admin-muted hover:underline"
                href={`tel:${order.customerPhone}`}
              >
                {order.customerPhone}
              </a>
              {order.customerEmail && (
                <a
                  className="text-[11px] text-admin-muted hover:underline"
                  href={`mailto:${order.customerEmail}`}
                >
                  {order.customerEmail}
                </a>
              )}
              <div>
                <h3>Delivery address</h3>
                <p>{order.address}</p>
              </div>
              {order.notes && (
                <div>
                  <h3>Order notes</h3>
                  <p>{order.notes}</p>
                </div>
              )}
            </div>
          </section>
          <section className={adminStyles.card}>
            <div className={adminStyles.cardHeader}>
              <h2>Order summary</h2>
            </div>
            <OrderTotals order={order} />
            <p className={orderStyles.footnote}>
              Profit becomes a dashboard sale when the order is delivered.
            </p>
          </section>
        </aside>
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        busy={busy}
        title={`Delete ${order.number}?`}
        description={
          order.stage === "delivered"
            ? "This order will leave your order list and reports. Delivered stock will stay deducted. A backup created before deletion can restore it."
            : "This order will leave your order list and reports. Any reserved stock will be restored. A backup created before deletion can restore it."
        }
      />
    </div>
  );
}
