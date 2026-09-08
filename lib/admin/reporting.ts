import type { DashboardStats, Order, ReportPeriod } from "./types";

const offset = 6 * 60 * 60 * 1000;
export function reportWindow(period: ReportPeriod, now = new Date()) {
  const local = new Date(now.getTime() + offset);
  const year = local.getUTCFullYear(),
    month = local.getUTCMonth(),
    day = local.getUTCDate();
  let start: number,
    end: number,
    step: "hour" | "day" | "month" = "day";
  if (period === "day") {
    start = Date.UTC(year, month, day);
    end = Date.UTC(year, month, day + 1);
    step = "hour";
  } else if (period === "week") {
    const monday = day - ((local.getUTCDay() + 6) % 7);
    start = Date.UTC(year, month, monday);
    end = Date.UTC(year, month, monday + 7);
  } else if (period === "year") {
    start = Date.UTC(year, 0, 1);
    end = Date.UTC(year + 1, 0, 1);
    step = "month";
  } else {
    start = Date.UTC(year, month, 1);
    end = Date.UTC(year, month + 1, 1);
  }
  return {
    from: new Date(start - offset).toISOString(),
    to: new Date(end - offset).toISOString(),
    step,
  };
}
export function summarizeOrders(
  orders: Order[],
  period: ReportPeriod,
  now = new Date(),
): Pick<
  DashboardStats,
  | "period"
  | "from"
  | "to"
  | "revenue"
  | "profit"
  | "orderCount"
  | "pendingOrders"
  | "deliveredOrders"
  | "chart"
  | "recentOrders"
> {
  const { from, to, step } = reportWindow(period, now);
  const selected = orders.filter(
    (order) => order.createdAt >= from && order.createdAt < to,
  );
  const chart: DashboardStats["chart"] = [];
  const start = new Date(from).getTime();
  let cursor = new Date(start + offset);
  const end = new Date(to).getTime() + offset;
  while (cursor.getTime() < end) {
    const label =
      step === "hour"
        ? `${String(cursor.getUTCHours()).padStart(2, "0")}:00`
        : step === "month"
          ? cursor.toLocaleString("en", { month: "short", timeZone: "UTC" })
          : cursor.toLocaleString("en", {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            });
    chart.push({ label, revenue: 0, profit: 0, orders: 0 });
    if (step === "hour") cursor = new Date(cursor.getTime() + 3600000);
    else if (step === "day") cursor = new Date(cursor.getTime() + 86400000);
    else
      cursor = new Date(
        Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1),
      );
  }
  let revenue = 0,
    profit = 0,
    pendingOrders = 0,
    deliveredOrders = 0;
  for (const order of selected) {
    const timestamp = new Date(order.createdAt).getTime();
    // Bangladesh has a fixed UTC offset, so hour/day buckets are uniform.
    const index =
      step === "month"
        ? new Date(timestamp + offset).getUTCMonth()
        : Math.floor(
            (timestamp - start) / (step === "hour" ? 3600000 : 86400000),
          );
    if (order.stage === "pending") pendingOrders++;
    if (order.stage === "delivered") deliveredOrders++;
    chart[index].orders++;
    if (order.stage === "delivered" && order.paymentStatus !== "refunded") {
      revenue += order.total;
      profit += order.profit;
      chart[index].revenue += order.total;
      chart[index].profit += order.profit;
    }
  }
  return {
    period,
    from,
    to,
    revenue: Math.round(revenue * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    orderCount: selected.length,
    pendingOrders,
    deliveredOrders,
    chart: chart.map((bucket) => ({
      ...bucket,
      revenue: Math.round(bucket.revenue * 100) / 100,
      profit: Math.round(bucket.profit * 100) / 100,
    })),
    recentOrders: [...selected]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 6),
  };
}
