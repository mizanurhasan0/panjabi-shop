"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { errorMessage, useDemoQuery } from "@/lib/demo/client";
import { listOrders, type OrderFilters } from "@/lib/demo/queries";
import { getDemoSnapshot } from "@/lib/demo/store";
import { exportSpreadsheet } from "@/lib/demo/downloads";
import { orderStages, type OrderStage } from "@/lib/admin/types";
import { formatPrice } from "@/lib/utils/products";
import { adminStyles } from "../styles";
import {
  AdminIcon,
  Alert,
  Button,
  EmptyState,
  Field,
  PageHeading,
  Pagination,
  StatusBadge,
} from "../ui";
import { orderDate, OrderLoading } from "./shared";

function inputDate(value: string | null, exclusiveEnd = false): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.parse(value) - (exclusiveEnd ? 1 : 0)));
}

export function OrdersList({ queryString }: { queryString: string }) {
  const router = useRouter();
  const params = new URLSearchParams(queryString);
  const filters: OrderFilters = {
    query: params.get("query") ?? "",
    stage: (params.get("stage") || undefined) as OrderStage | undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    page: Number(params.get("page")) || 1,
  };
  const { data, error, loading, reload } = useDemoQuery((state) =>
    listOrders(state, filters),
  );
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  async function download() {
    setExporting(true);
    setExportError("");
    try {
      const state = getDemoSnapshot();
      const first = listOrders(state, { ...filters, page: 1, pageSize: 100 });
      const orders = [...first.items];
      for (let page = 2; orders.length < first.total; page++)
        orders.push(
          ...listOrders(state, { ...filters, page, pageSize: 100 }).items,
        );
      await exportSpreadsheet("orders", orders, state.settings);
    } catch (failure) {
      setExportError(errorMessage(failure));
    } finally {
      setExporting(false);
    }
  }
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const field of ["query", "stage"]) {
      const value = String(form.get(field) ?? "").trim();
      if (value) next.set(field, value);
    }
    const from = String(form.get("from") ?? "");
    const to = String(form.get("to") ?? "");
    if (from)
      next.set("from", new Date(`${from}T00:00:00+06:00`).toISOString());
    if (to)
      next.set(
        "to",
        new Date(Date.parse(`${to}T00:00:00+06:00`) + 86_400_000).toISOString(),
      );
    router.push(`/admin/orders?${next}`);
  }
  function changePage(page: number) {
    const next = new URLSearchParams(queryString);
    next.set("page", String(page));
    router.push(`/admin/orders?${next}`);
  }
  return (
    <div className={adminStyles.stack}>
      <PageHeading
        title="Orders"
        description="Every order, from the first hello to a happy delivery."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={download}
              disabled={exporting || loading}
            >
              <AdminIcon name="download" size={16} />
              {exporting ? "Preparing Excel…" : "Export Excel"}
            </Button>
            <Link
              className={adminStyles.buttonPrimary}
              href="/admin/orders/new"
            >
              <AdminIcon name="plus" size={16} />
              New order
            </Link>
          </>
        }
      />
      {exportError && <Alert>{exportError}</Alert>}
      <section className={adminStyles.card}>
        <form
          key={queryString}
          className="mb-6 grid grid-cols-[minmax(180px,1.5fr)_minmax(130px,1fr)_repeat(2,minmax(120px,1fr))_auto] items-end gap-3 max-[1201px]:grid-cols-2 max-[1201px]:[&>:first-child]:col-span-full max-[641px]:grid-cols-1 max-[641px]:gap-[15px] max-[641px]:[&_input[type=date]]:min-h-[46px]"
          onSubmit={filter}
        >
          <Field label="Search orders">
            <input
              className={adminStyles.input}
              name="query"
              defaultValue={params.get("query") ?? ""}
              placeholder="Order, customer or phone"
              maxLength={200}
            />
          </Field>
          <Field label="Order stage">
            <select
              className={adminStyles.select}
              name="stage"
              defaultValue={params.get("stage") ?? ""}
            >
              <option value="">All stages</option>
              {orderStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="From date">
            <input
              className={adminStyles.input}
              type="date"
              name="from"
              defaultValue={inputDate(params.get("from"))}
            />
          </Field>
          <Field label="To date">
            <input
              className={adminStyles.input}
              type="date"
              name="to"
              defaultValue={inputDate(params.get("to"), true)}
            />
          </Field>
          <div
            className={`${adminStyles.actions} min-h-11 max-[1201px]:col-span-full max-[641px]:[&>button]:flex-1`}
          >
            <Button type="submit" variant="secondary">
              <AdminIcon name="search" size={16} />
              Filter
            </Button>
            {queryString && (
              <Link href="/admin/orders" className={adminStyles.textButton}>
                Reset
              </Link>
            )}
          </div>
        </form>
        {error && (
          <Alert>
            {error}{" "}
            <Button variant="secondary" onClick={reload}>
              Try again
            </Button>
          </Alert>
        )}
        {loading && <OrderLoading />}
        {data &&
          (data.items.length ? (
            <>
              <div className={adminStyles.tableWrap}>
                <table className={adminStyles.table}>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Stage</th>
                      <th>Payment</th>
                      <th>Total</th>
                      <th>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((order) => (
                      <tr key={order.id}>
                        <td data-label="Order">
                          <Link
                            className="text-[#7f5c27]!"
                            href={`/admin/orders/${order.id}`}
                          >
                            {order.number}
                          </Link>
                          <small>
                            {order.items.reduce(
                              (sum, item) => sum + item.quantity,
                              0,
                            )}{" "}
                            items · {order.source}
                          </small>
                        </td>
                        <td data-label="Customer">
                          {order.customerName}
                          <small>{order.customerPhone}</small>
                        </td>
                        <td data-label="Date">
                          <time dateTime={order.createdAt}>
                            {orderDate(order.createdAt)}
                          </time>
                        </td>
                        <td data-label="Stage">
                          <StatusBadge stage={order.stage} />
                        </td>
                        <td data-label="Payment">
                          <StatusBadge stage={order.paymentStatus} />
                        </td>
                        <td data-label="Total">
                          <strong>{formatPrice(order.total)}</strong>
                        </td>
                        <td>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className={adminStyles.buttonSecondary}
                            aria-label={`View order ${order.number}`}
                          >
                            View order
                            <AdminIcon name="chevron" size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination {...data} onChange={changePage} />
            </>
          ) : (
            <EmptyState
              title={
                queryString
                  ? "No matching orders"
                  : "Ready for your first order"
              }
              description={
                queryString
                  ? "Try a different search or clear your filters."
                  : "Orders from your storefront and orders you create will appear here."
              }
              action={
                <Link
                  href={queryString ? "/admin/orders" : "/admin/orders/new"}
                  className={adminStyles.buttonPrimary}
                >
                  {queryString ? "Clear filters" : "Create an order"}
                </Link>
              }
            />
          ))}
      </section>
    </div>
  );
}
