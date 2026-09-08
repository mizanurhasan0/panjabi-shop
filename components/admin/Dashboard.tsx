"use client";

import { useState } from "react";
import Link from "next/link";
import { adminStyles } from "./styles";
import { useDemoQuery, errorMessage } from "@/lib/demo/client";
import { getDashboardStats } from "@/lib/demo/queries";
import { getDemoSnapshot } from "@/lib/demo/store";
import type { ReportPeriod } from "@/lib/admin/types";
import { formatPrice } from "@/lib/utils/products";
import { PageHeading, Alert, EmptyState, StatusBadge } from "./ui";

const shortcutClassName = `${adminStyles.card} flex flex-col items-start gap-3 [&_strong]:text-[17px] [&_strong]:font-medium`;

const periods: { value: ReportPeriod; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
];

export function Dashboard() {
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
  return (
    <div className={adminStyles.stack}>
      <PageHeading
        title="A clear view of your shop"
        description="Orders, inventory and the numbers that matter."
      />
      <div className="flex flex-wrap items-center gap-3 min-[641px]:gap-[14px]">
        <div
          className="grid w-full grid-cols-4 gap-1 rounded-xl border border-[#e8e5de] bg-white p-1 min-[641px]:flex min-[641px]:w-auto min-[641px]:flex-wrap"
          role="group"
          aria-label="Report period"
        >
          {periods.map((item) => (
            <button
              key={item.value}
              className={`min-h-11 rounded-lg border-0 px-1 py-2 text-xs transition-colors duration-180 min-[641px]:min-h-0 min-[641px]:px-[15px] min-[641px]:py-[9px] ${period === item.value ? "bg-[#25231f] text-white" : "bg-transparent text-[#67625b]"}`}
              aria-pressed={period === item.value}
              onClick={() => setPeriod(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div
          className={`${adminStyles.actions} ml-auto w-full [&>*]:flex-1 min-[641px]:w-auto min-[641px]:[&>*]:flex-none`}
        >
          <button className={adminStyles.buttonSecondary} onClick={reload}>
            Refresh
          </button>
          <Link className={adminStyles.buttonPrimary} href="/admin/orders/new">
            + Create order
          </Link>
        </div>
      </div>
      {(error || exportError) && (
        <Alert tone="error">{error || exportError}</Alert>
      )}
      {loading && (
        <div className={adminStyles.grid4} aria-label="Loading dashboard">
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
                value: formatPrice(data.revenue),
                href: `/admin/orders?stage=delivered&${dateQuery}`,
                hint: "Revenue from delivered orders",
              },
              {
                label: "Gross profit",
                value: formatPrice(data.profit),
                href: `/admin/orders?stage=delivered&${dateQuery}`,
                hint: "After product and order costs",
              },
              {
                label: "Orders placed",
                value: data.orderCount.toLocaleString(),
                href: `/admin/orders?${dateQuery}`,
                hint: "All stages in selected period",
              },
              {
                label: "Active products",
                value: data.totalProducts.toLocaleString(),
                href: "/admin/products",
                hint: `${data.lowStockProducts} need restocking`,
              },
            ].map((metric) => (
              <Link
                key={metric.label}
                href={metric.href}
                className={`${adminStyles.card} flex flex-col gap-[18px] transition-[translate,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_#25231f0a] max-[601px]:gap-3 motion-reduce:hover:translate-y-0`}
              >
                <span className={adminStyles.muted}>{metric.label}</span>
                <strong className="text-[clamp(21px,2.1vw,31px)] leading-[1.2] tracking-[-1px]">
                  {metric.value}
                </strong>
                <span className={adminStyles.muted}>
                  {metric.hint} <span aria-hidden="true">↗</span>
                </span>
              </Link>
            ))}
          </div>
          <div className={adminStyles.grid3}>
            <Link
              href={`/admin/orders?stage=pending&${dateQuery}`}
              className={shortcutClassName}
            >
              <span className={adminStyles.badge}>Awaiting action</span>
              <strong>{data.pendingOrders} pending orders</strong>
              <span className={adminStyles.muted}>Review and confirm →</span>
            </Link>
            <Link
              href={`/admin/orders?stage=delivered&${dateQuery}`}
              className={shortcutClassName}
            >
              <span className={adminStyles.badge}>Completed</span>
              <strong>{data.deliveredOrders} delivered orders</strong>
              <span className={adminStyles.muted}>View delivery history →</span>
            </Link>
            <Link
              href="/admin/products?stock=low"
              className={shortcutClassName}
            >
              <span className={adminStyles.badge}>Inventory</span>
              <strong>{data.lowStockProducts} low-stock products</strong>
              <span className={adminStyles.muted}>Update your inventory →</span>
            </Link>
          </div>
          <section className={adminStyles.card}>
            <div className={adminStyles.cardHeader}>
              <div>
                <h2>Sales overview</h2>
                <p className={adminStyles.muted}>
                  Delivered orders, grouped by order date · Bangladesh time
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
                {exporting ? "Preparing…" : "Download Excel"}
              </button>
            </div>
            {data.orderCount === 0 ? (
              <EmptyState
                title="Your story starts with the first order"
                description="New orders and completed sales will appear here."
                action={
                  <Link
                    href="/admin/orders/new"
                    className={adminStyles.buttonPrimary}
                  >
                    Create first order
                  </Link>
                }
              />
            ) : (
              <div
                className="flex w-full gap-2 overflow-x-auto pt-5 pb-2"
                role="img"
                aria-label={`Sales for ${periods.find((p) => p.value === period)?.label}: ${formatPrice(data.revenue)}`}
              >
                {data.chart.map((point, index) => (
                  <div
                    key={index}
                    className="min-w-[27px] flex-1 text-center text-[9px] text-[#827c71]"
                  >
                    <div className="flex h-[200px] items-end justify-center bg-[linear-gradient(to_bottom,transparent_calc(100%_-_1px),#eee_0)] bg-size-[100%_50px] max-[601px]:h-40">
                      <div
                        className="w-[70%] max-w-[50px] rounded-t-[5px] bg-linear-to-b from-[#c9a663] to-[#ac8748] transition-[height] duration-300 ease-[ease]"
                        style={{
                          height: `${Math.max(point.revenue > 0 ? 3 : 0, (point.revenue / maximum) * 100)}%`,
                        }}
                        title={`${point.label}: ${formatPrice(point.revenue)}, ${point.orders} orders`}
                      />
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
                View chart data
              </summary>
              <div className={adminStyles.tableWrap}>
                <table className={adminStyles.table}>
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Orders</th>
                      <th>Sales</th>
                      <th>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.chart.map((point) => (
                      <tr key={point.label}>
                        <td data-label="Period">{point.label}</td>
                        <td data-label="Orders">{point.orders}</td>
                        <td data-label="Sales">{formatPrice(point.revenue)}</td>
                        <td data-label="Profit">{formatPrice(point.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
          <section className={adminStyles.card}>
            <div className={adminStyles.cardHeader}>
              <h2>Recent orders</h2>
              <Link href="/admin/orders" className="hover:underline">
                View all orders →
              </Link>
            </div>
            {data.recentOrders.length ? (
              <div className={adminStyles.tableWrap}>
                <table className={adminStyles.table}>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td data-label="Order">
                          <Link
                            className="hover:underline"
                            href={`/admin/orders/${order.id}`}
                          >
                            {order.number}
                          </Link>
                        </td>
                        <td data-label="Customer">{order.customerName}</td>
                        <td data-label="Status">
                          <StatusBadge stage={order.stage} />
                        </td>
                        <td data-label="Total">{formatPrice(order.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No orders yet"
                description="Storefront and manual orders will appear here."
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}
