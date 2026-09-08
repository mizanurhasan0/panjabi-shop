"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AdminTableViewport } from "./AdminTableViewport";
import { adminStyles } from "./styles";
import { useDemoQuery, errorMessage } from "@/lib/demo/client";
import { getDashboardStats } from "@/lib/demo/queries";
import { getDemoSnapshot } from "@/lib/demo/store";
import type { ReportPeriod } from "@/lib/admin/types";
import { useAdminLanguage } from "@/lib/admin/i18n";
import {
  AdminActionBar,
  PageHeading,
  Alert,
  EmptyState,
  StatusBadge,
} from "./ui";

const shortcutClassName = `${adminStyles.card} flex flex-col items-start gap-3 [&_strong]:text-[17px] [&_strong]:font-medium`;

const periods: { value: ReportPeriod; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
];

export function Dashboard() {
  const { t, formatCurrency, formatNumber, formatDate } = useAdminLanguage();
  const gradientId = useId();
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const { data, error, loading, reload } = useDemoQuery((state) =>
    getDashboardStats(state, period),
  );
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const dateQuery = data
    ? `from=${encodeURIComponent(data.from)}&to=${encodeURIComponent(data.to)}`
    : "";
  const maximum = Math.max(
    1,
    ...(data?.chart.map((point) => point.revenue) ?? []),
  );
  const chart =
    data?.chart.map((point, index) => {
      const date = new Date(data.from);
      if (period === "year") {
        // Reporting buckets start at midnight in Bangladesh (UTC+6).
        date.setTime(date.getTime() + 6 * 60 * 60 * 1000);
        date.setUTCMonth(date.getUTCMonth() + index);
        date.setTime(date.getTime() - 6 * 60 * 60 * 1000);
      } else {
        date.setTime(
          date.getTime() + index * (period === "day" ? 3600000 : 86400000),
        );
      }
      return {
        ...point,
        barHeight: Math.max(
          point.revenue > 0 ? 6 : 0,
          (point.revenue / maximum) * 200,
        ),
        label: formatDate(
          date,
          period === "year"
            ? { month: "short" }
            : period === "day"
              ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
              : { month: "short", day: "numeric" },
        ),
      };
    }) ?? [];
  return (
    <div className={adminStyles.stack}>
      <PageHeading
        title={t("A clear view of your shop")}
        description={t("Orders, inventory and the numbers that matter.")}
      />
      <AdminActionBar
        label={t("Dashboard actions")}
        actions={
          <>
            <button className={adminStyles.buttonSecondary} onClick={reload}>
              {t("Refresh")}
            </button>
            <Link
              className={adminStyles.buttonPrimary}
              href="/admin/orders/new"
            >
              {t("+ Create order")}
            </Link>
          </>
        }
      >
        <div
          className="grid w-full grid-cols-4 gap-1 rounded-xl border border-[#e8e5de] bg-white p-1 min-[641px]:flex min-[641px]:w-auto min-[641px]:flex-wrap"
          role="group"
          aria-label={t("Report period")}
        >
          {periods.map((item) => (
            <button
              key={item.value}
              className={`min-h-11 rounded-lg border-0 px-1 py-2 text-xs transition-colors duration-180 min-[641px]:min-h-0 min-[641px]:px-[15px] min-[641px]:py-[9px] ${period === item.value ? "bg-[#25231f] text-white" : "bg-transparent text-[#67625b]"}`}
              aria-pressed={period === item.value}
              onClick={() => setPeriod(item.value)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
      </AdminActionBar>
      {(error || exportError) && (
        <Alert tone="error">{t(error || exportError)}</Alert>
      )}
      {loading && (
        <div className={adminStyles.grid4} aria-label={t("Loading dashboard")}>
          {[1, 2, 3, 4].map((value) => (
            <div
              key={value}
              className={`${adminStyles.card} ${adminStyles.skeleton} h-[140px]`}
            />
          ))}
        </div>
      )}
      {data && (
        <>
          <div className={adminStyles.grid4}>
            {[
              {
                label: "Delivered sales",
                value: formatCurrency(data.revenue),
                href: `/admin/orders?stage=delivered&${dateQuery}`,
                hint: "Revenue from delivered orders",
              },
              {
                label: "Gross profit",
                value: formatCurrency(data.profit),
                href: `/admin/orders?stage=delivered&${dateQuery}`,
                hint: "After product and order costs",
              },
              {
                label: "Orders placed",
                value: formatNumber(data.orderCount),
                href: `/admin/orders?${dateQuery}`,
                hint: "All stages in selected period",
              },
              {
                label: "Active products",
                value: formatNumber(data.totalProducts),
                href: "/admin/products",
                hint: t("{count} need restocking", {
                  count: formatNumber(data.lowStockProducts),
                }),
              },
            ].map((metric) => (
              <Link
                key={metric.label}
                href={metric.href}
                className={`${adminStyles.card} flex flex-col gap-[18px] transition-[translate,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_#25231f0a] max-[601px]:gap-3 motion-reduce:hover:translate-y-0`}
              >
                <span className={adminStyles.muted}>{t(metric.label)}</span>
                <strong className="text-[clamp(21px,2.1vw,31px)] leading-[1.2] tracking-[-1px]">
                  {metric.value}
                </strong>
                <span className={adminStyles.muted}>
                  {t(metric.hint)} <span aria-hidden="true">↗</span>
                </span>
              </Link>
            ))}
          </div>
          <div className={adminStyles.grid3}>
            <Link
              href={`/admin/orders?stage=pending&${dateQuery}`}
              className={shortcutClassName}
            >
              <span className={adminStyles.badge}>{t("Awaiting action")}</span>
              <strong>
                {t("{count} pending orders", {
                  count: formatNumber(data.pendingOrders),
                })}
              </strong>
              <span className={adminStyles.muted}>
                {t("Review and confirm →")}
              </span>
            </Link>
            <Link
              href={`/admin/orders?stage=delivered&${dateQuery}`}
              className={shortcutClassName}
            >
              <span className={adminStyles.badge}>{t("Completed")}</span>
              <strong>
                {t("{count} delivered orders", {
                  count: formatNumber(data.deliveredOrders),
                })}
              </strong>
              <span className={adminStyles.muted}>
                {t("View delivery history →")}
              </span>
            </Link>
            <Link
              href="/admin/products?stock=low"
              className={shortcutClassName}
            >
              <span className={adminStyles.badge}>{t("Inventory")}</span>
              <strong>
                {t("{count} low-stock products", {
                  count: formatNumber(data.lowStockProducts),
                })}
              </strong>
              <span className={adminStyles.muted}>
                {t("Update your inventory →")}
              </span>
            </Link>
          </div>
          <section className={adminStyles.card}>
            <div className={adminStyles.cardHeader}>
              <div>
                <h2>{t("Sales overview")}</h2>
                <p className={adminStyles.muted}>
                  {t(
                    "Delivered orders, grouped by order date · Bangladesh time",
                  )}
                </p>
              </div>
              <button
                className={adminStyles.buttonSecondary}
                disabled={exporting}
                onClick={async () => {
                  setExporting(true);
                  setExportError("");
                  try {
                    const state = getDemoSnapshot();
                    const { exportSpreadsheet } =
                      await import("@/lib/demo/downloads");
                    await exportSpreadsheet(
                      "orders",
                      state.orders.filter(
                        (order) =>
                          order.createdAt >= data.from &&
                          order.createdAt < data.to,
                      ),
                      state.settings,
                    );
                  } catch (failure) {
                    setExportError(errorMessage(failure));
                  } finally {
                    setExporting(false);
                  }
                }}
              >
                {t(exporting ? "Preparing…" : "Download Excel")}
              </button>
            </div>
            {data.orderCount === 0 ? (
              <EmptyState
                title={t("Your story starts with the first order")}
                description={t(
                  "New orders and completed sales will appear here.",
                )}
                action={
                  <Link
                    href="/admin/orders/new"
                    className={adminStyles.buttonPrimary}
                  >
                    {t("Create first order")}
                  </Link>
                }
              />
            ) : (
              <div
                className="flex w-full gap-2 overflow-x-auto pt-5 pb-2"
                role="img"
                aria-label={t("Sales for {period}: {amount}", {
                  period: t(
                    periods.find((item) => item.value === period)?.label ??
                      period,
                  ),
                  amount: formatCurrency(data.revenue),
                })}
              >
                {chart.map((point, index) => (
                  <div
                    key={index}
                    className="min-w-[27px] flex-1 text-center text-[9px] text-[#827c71]"
                  >
                    <div className="flex h-[200px] items-end justify-center bg-[linear-gradient(to_bottom,transparent_calc(100%_-_1px),#eee_0)] bg-size-[100%_50px] max-[601px]:h-40">
                      <svg
                        className="h-full w-[70%] max-w-[50px] overflow-visible"
                        viewBox="0 0 50 200"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <title>
                          {t("{period}: {amount}, {count} orders", {
                            period: point.label,
                            amount: formatCurrency(point.revenue),
                            count: formatNumber(point.orders),
                          })}
                        </title>
                        <defs>
                          <linearGradient
                            id={`${gradientId}-${index}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              className="[stop-color:#c9a663]"
                            />
                            <stop
                              offset="100%"
                              className="[stop-color:#ac8748]"
                            />
                          </linearGradient>
                        </defs>
                        <rect
                          x="0"
                          y={200 - point.barHeight}
                          width="50"
                          height={point.barHeight}
                          rx="5"
                          fill={`url(#${gradientId}-${index})`}
                        />
                      </svg>
                    </div>
                    <span className="mt-3 block whitespace-nowrap">
                      {point.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-[#766744]">
                {t("View chart data")}
              </summary>
              <AdminTableViewport label={t("Sales report table")}>
                <table className={adminStyles.table}>
                  <thead>
                    <tr>
                      <th>{t("Period")}</th>
                      <th>{t("Orders")}</th>
                      <th>{t("Sales")}</th>
                      <th>{t("Profit")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.map((point) => (
                      <tr key={point.label}>
                        <td data-label={t("Period")}>{point.label}</td>
                        <td data-label={t("Orders")}>
                          {formatNumber(point.orders)}
                        </td>
                        <td data-label={t("Sales")}>
                          {formatCurrency(point.revenue)}
                        </td>
                        <td data-label={t("Profit")}>
                          {formatCurrency(point.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableViewport>
            </details>
          </section>
          <section className={adminStyles.card}>
            <div className={adminStyles.cardHeader}>
              <h2>{t("Recent orders")}</h2>
              <Link href="/admin/orders" className="hover:underline">
                {t("View all orders →")}
              </Link>
            </div>
            {data.recentOrders.length ? (
              <AdminTableViewport label={t("Recent orders table")}>
                <table className={adminStyles.table}>
                  <thead>
                    <tr>
                      <th>{t("Order")}</th>
                      <th>{t("Customer")}</th>
                      <th>{t("Status")}</th>
                      <th>{t("Total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td data-label={t("Order")}>
                          <Link
                            className="hover:underline"
                            href={`/admin/orders/${order.id}`}
                          >
                            {order.number}
                          </Link>
                        </td>
                        <td data-label={t("Customer")}>{order.customerName}</td>
                        <td data-label={t("Status")}>
                          <StatusBadge stage={order.stage} />
                        </td>
                        <td data-label={t("Total")}>
                          {formatCurrency(order.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableViewport>
            ) : (
              <EmptyState
                title={t("No orders yet")}
                description={t(
                  "Storefront and manual orders will appear here.",
                )}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}
