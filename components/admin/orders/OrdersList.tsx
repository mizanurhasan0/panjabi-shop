"use client";

import { useAdminLanguage } from "@/lib/admin/i18n";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { errorMessage, useDemoQuery } from "@/lib/demo/client";
import { listOrders, type OrderFilters } from "@/lib/demo/queries";
import { getDemoSnapshot } from "@/lib/demo/store";
import { exportSpreadsheet } from "@/lib/demo/downloads";
import { orderStages, type OrderStage } from "@/lib/admin/types";
import { adminStyles } from "../styles";
import { AdminTableViewport } from "../AdminTableViewport";
import { AdminTableFilters } from "../AdminTableFilters";
import {
  AdminActionBar,
  AdminIcon,
  Alert,
  Button,
  EmptyState,
  Field,
  PageHeading,
  Pagination,
  StatusBadge,
} from "../ui";
import { OrderLoading } from "./shared";

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
  const { t, formatCurrency, formatNumber, formatDate } = useAdminLanguage();
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
  const [filterError, setFilterError] = useState("");
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
    if (from && to && to < from) {
      setFilterError("End date must be on or after the start date.");
      return;
    }
    setFilterError("");
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
    <div className={adminStyles.listPage}>
      <PageHeading
        title={t("Orders")}
        description={t(
          "Every order, from the first hello to a happy delivery.",
        )}
      />
      {exportError && <Alert>{t(exportError)}</Alert>}
      <section
        className={`${adminStyles.card} ${adminStyles.listCard} max-[641px]:p-3!`}
      >
        <form
          key={queryString}
          className="mb-4 grid min-w-0 gap-3"
          onSubmit={filter}
        >
          <AdminActionBar
            label={t("Order actions")}
            actions={
              <>
                <Button
                  variant="secondary"
                  onClick={download}
                  disabled={exporting || loading}
                >
                  <AdminIcon name="download" size={16} />
                  {exporting ? t("Preparing Excel…") : t("Export Excel")}
                </Button>
                <Link
                  className={adminStyles.buttonPrimary}
                  href="/admin/orders/new"
                >
                  <AdminIcon name="plus" size={16} />
                  {t("New order")}
                </Link>
              </>
            }
          >
            <div className="relative w-full min-w-0 max-w-[420px] max-[641px]:max-w-none">
              <AdminIcon
                name="search"
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-admin-muted"
              />
              <input
                className={`${adminStyles.input} pl-9!`}
                type="search"
                name="query"
                aria-label={t("Search orders")}
                defaultValue={params.get("query") ?? ""}
                placeholder={t("Order, customer or phone")}
                maxLength={200}
              />
            </div>
          </AdminActionBar>
          <AdminTableFilters
            activeCount={
              [filters.stage, filters.from, filters.to].filter(Boolean).length
            }
          >
            {(close) => (
              <div className="grid min-w-0 grid-cols-[minmax(140px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_auto] items-end gap-3 max-[1001px]:grid-cols-2 max-[481px]:grid-cols-1">
                <Field label={t("Order stage")}>
                  <select
                    className={adminStyles.select}
                    name="stage"
                    defaultValue={params.get("stage") ?? ""}
                  >
                    <option value="">{t("All stages")}</option>
                    {orderStages.map((stage) => (
                      <option key={stage} value={stage}>
                        {t(stage.charAt(0).toUpperCase() + stage.slice(1))}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("From date")}>
                  <input
                    className={adminStyles.input}
                    type="date"
                    name="from"
                    defaultValue={inputDate(params.get("from"))}
                  />
                </Field>
                <Field label={t("To date")}>
                  <input
                    className={adminStyles.input}
                    type="date"
                    name="to"
                    defaultValue={inputDate(params.get("to"), true)}
                  />
                </Field>
                <div
                  className={`${adminStyles.actions} min-h-11 max-[641px]:[&>button]:flex-1`}
                >
                  <Button type="submit" variant="secondary" onClick={close}>
                    <AdminIcon name="search" size={16} />
                    {t("Filter")}
                  </Button>
                  {queryString && (
                    <Link
                      href="/admin/orders"
                      className={adminStyles.textButton}
                    >
                      {t("Reset")}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </AdminTableFilters>
        </form>
        {filterError && <Alert>{t(filterError)}</Alert>}
        {error && (
          <Alert>
            {t(error)}{" "}
            <Button variant="secondary" onClick={reload}>
              {t("Try again")}
            </Button>
          </Alert>
        )}
        {loading && (
          <AdminTableViewport label={t("Loading orders")} fill>
            <OrderLoading />
          </AdminTableViewport>
        )}
        {data &&
          (data.items.length ? (
            <>
              <AdminTableViewport label={t("Orders table")} fill>
                <table className={adminStyles.table}>
                  <thead>
                    <tr>
                      <th>{t("Order")}</th>
                      <th>{t("Customer")}</th>
                      <th>{t("Date")}</th>
                      <th>{t("Stage")}</th>
                      <th>{t("Payment")}</th>
                      <th>{t("Total")}</th>
                      <th>
                        <span className="sr-only">{t("Actions")}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((order) => (
                      <tr key={order.id}>
                        <td data-label={t("Order")}>
                          <Link
                            className="text-[#7f5c27]!"
                            href={`/admin/orders/${order.id}`}
                          >
                            {order.number}
                          </Link>
                          <small>
                            {t("{count} items · {source}", {
                              count: formatNumber(
                                order.items.reduce(
                                  (sum, item) => sum + item.quantity,
                                  0,
                                ),
                              ),
                              source: t(order.source),
                            })}
                          </small>
                        </td>
                        <td data-label={t("Customer")}>
                          {order.customerName}
                          <small>{order.customerPhone}</small>
                        </td>
                        <td data-label={t("Date")}>
                          <time dateTime={order.createdAt}>
                            {formatDate(order.createdAt)}
                          </time>
                        </td>
                        <td data-label={t("Stage")}>
                          <StatusBadge stage={order.stage} />
                        </td>
                        <td data-label={t("Payment")}>
                          <StatusBadge stage={order.paymentStatus} />
                        </td>
                        <td data-label={t("Total")}>
                          <strong>{formatCurrency(order.total)}</strong>
                        </td>
                        <td>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className={adminStyles.buttonSecondary}
                            aria-label={t("View order {number}", {
                              number: order.number,
                            })}
                          >
                            {t("View order")}
                            <AdminIcon name="chevron" size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableViewport>
              <Pagination {...data} onChange={changePage} />
            </>
          ) : (
            <AdminTableViewport label={t("Orders results")} fill>
              <EmptyState
                title={
                  queryString
                    ? t("No matching orders")
                    : t("Ready for your first order")
                }
                description={
                  queryString
                    ? t("Try a different search or clear your filters.")
                    : t(
                        "Orders from your storefront and orders you create will appear here.",
                      )
                }
                action={
                  <Link
                    href={queryString ? "/admin/orders" : "/admin/orders/new"}
                    className={adminStyles.buttonPrimary}
                  >
                    {queryString ? t("Clear filters") : t("Create an order")}
                  </Link>
                }
              />
            </AdminTableViewport>
          ))}
      </section>
    </div>
  );
}
