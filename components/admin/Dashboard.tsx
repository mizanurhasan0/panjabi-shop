"use client";

import { useState } from "react";
import Link from "next/link";
import "./dashboard.css";
import { useDemoQuery, errorMessage } from "@/lib/demo/client";
import { getDashboardStats } from "@/lib/demo/queries";
import { getDemoSnapshot } from "@/lib/demo/store";
import type { ReportPeriod } from "@/lib/admin/types";
import { formatPrice } from "@/lib/utils/products";
import { PageHeading, Alert, EmptyState, StatusBadge } from "./ui";

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
    <div className="admin-stack">
      <PageHeading
        title="A clear view of your shop"
        description="Orders, inventory and the numbers that matter."
        actions={
          <Link
            className="admin-button admin-button-primary"
            href="/admin/orders/new"
          >
            + Create order
          </Link>
        }
      />
      <div className="admin-toolbar">
        <div className="admin-periods" role="group" aria-label="Report period">
          {periods.map((item) => (
            <button
              key={item.value}
              className={period === item.value ? "active" : ""}
              aria-pressed={period === item.value}
              onClick={() => setPeriod(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          className="admin-button admin-button-secondary"
          onClick={reload}
        >
          Refresh
        </button>
      </div>
      {(error || exportError) && (
        <Alert tone="error">{error || exportError}</Alert>
      )}
      {loading && (
        <div className="admin-grid admin-grid-4" aria-label="Loading dashboard">
          {[1, 2, 3, 4].map((value) => (
            <div
              key={value}
              className="admin-card admin-skeleton"
              style={{ height: 140 }}
            />
          ))}
        </div>
      )}
      {data && (
        <>
          <div className="admin-grid admin-grid-4">
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
                className="admin-card admin-metric"
              >
                <span className="admin-muted">{metric.label}</span>
                <strong>{metric.value}</strong>
                <span className="admin-muted">
                  {metric.hint} <span aria-hidden="true">↗</span>
                </span>
              </Link>
            ))}
          </div>
          <div className="admin-grid admin-grid-3">
            <Link
              href={`/admin/orders?stage=pending&${dateQuery}`}
              className="admin-card admin-shortcut"
            >
              <span className="admin-badge">Awaiting action</span>
              <strong>{data.pendingOrders} pending orders</strong>
              <span className="admin-muted">Review and confirm →</span>
            </Link>
            <Link
              href={`/admin/orders?stage=delivered&${dateQuery}`}
              className="admin-card admin-shortcut"
            >
              <span className="admin-badge">Completed</span>
              <strong>{data.deliveredOrders} delivered orders</strong>
              <span className="admin-muted">View delivery history →</span>
            </Link>
            <Link
              href="/admin/products?stock=low"
              className="admin-card admin-shortcut"
            >
              <span className="admin-badge">Inventory</span>
              <strong>{data.lowStockProducts} low-stock products</strong>
              <span className="admin-muted">Update your inventory →</span>
            </Link>
          </div>
          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2>Sales overview</h2>
                <p className="admin-muted">
                  Delivered orders, grouped by order date · Bangladesh time
                </p>
              </div>
              <button
                className="admin-button admin-button-secondary"
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
                    className="admin-button admin-button-primary"
                  >
                    Create first order
                  </Link>
                }
              />
            ) : (
              <div
                className="admin-chart"
                role="img"
                aria-label={`Sales for ${periods.find((p) => p.value === period)?.label}: ${formatPrice(data.revenue)}`}
              >
                {data.chart.map((point, index) => (
                  <div key={index} className="admin-chart-column">
                    <div className="admin-chart-bar-area">
                      <div
                        className="admin-chart-bar"
                        style={{
                          height: `${Math.max(point.revenue > 0 ? 3 : 0, (point.revenue / maximum) * 100)}%`,
                        }}
                        title={`${point.label}: ${formatPrice(point.revenue)}, ${point.orders} orders`}
                      />
                    </div>
                    <span>{point.label}</span>
                  </div>
                ))}
              </div>
            )}
            <details className="admin-chart-data">
              <summary>View chart data</summary>
              <div className="admin-table-wrap">
                <table className="admin-table">
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
          <section className="admin-card">
            <div className="admin-card-header">
              <h2>Recent orders</h2>
              <Link href="/admin/orders" className="admin-text-link">
                View all orders →
              </Link>
            </div>
            {data.recentOrders.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
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
                            className="admin-text-link"
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
