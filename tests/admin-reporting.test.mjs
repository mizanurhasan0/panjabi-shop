import test from "node:test";
import assert from "node:assert/strict";
import { reportWindow, summarizeOrders } from "../lib/admin/reporting.ts";

test("report ranges use Bangladesh midnight including leap month and Monday weeks", () => {
  assert.deepEqual(reportWindow("day", new Date("2026-09-08T00:00:00Z")), {
    from: "2026-09-07T18:00:00.000Z",
    to: "2026-09-08T18:00:00.000Z",
    step: "hour",
  });
  const month = reportWindow("month", new Date("2024-02-15T00:00:00Z"));
  assert.equal((new Date(month.to) - new Date(month.from)) / 86400000, 29);
  assert.equal(
    reportWindow("week", new Date("2026-09-08T00:00:00Z")).from,
    "2026-09-06T18:00:00.000Z",
  );
});
test("profit counts delivered orders only, preserves negative profit, excludes outside period", () => {
  const create = (
    stage,
    total,
    profit,
    createdAt = "2026-09-08T01:00:00.000Z",
  ) => ({ stage, total, profit, createdAt });
  const data = summarizeOrders(
    [
      create("delivered", 100, -10),
      create("pending", 200, 60),
      create("cancelled", 300, 100),
      create("returned", 100, 20),
      create("delivered", 100, 50, "2026-09-08T18:00:00.000Z"),
    ],
    "day",
    new Date("2026-09-08T08:00:00Z"),
  );
  assert.equal(data.revenue, 100);
  assert.equal(data.profit, -10);
  assert.equal(data.orderCount, 4);
  assert.equal(data.pendingOrders, 1);
  assert.equal(data.chart.length, 24);
  assert.equal(
    data.chart.reduce((sum, item) => sum + item.revenue, 0),
    100,
  );
});

test("refunded deliveries do not inflate recorded sales or profit", () => {
  const data = summarizeOrders(
    [
      {
        stage: "delivered",
        paymentStatus: "refunded",
        total: 100,
        profit: 30,
        createdAt: "2026-09-08T01:00:00.000Z",
      },
    ],
    "day",
    new Date("2026-09-08T08:00:00Z"),
  );
  assert.equal(data.revenue, 0);
  assert.equal(data.profit, 0);
  assert.equal(data.deliveredOrders, 1);
});

test("reports place boundary orders into the correct Bangladesh hour, day, and month", () => {
  const cases = [
    ["day", "2026-09-07T18:00:00.000Z", "2026-09-08T17:59:59.999Z", 24],
    ["week", "2026-09-06T18:00:00.000Z", "2026-09-13T17:59:59.999Z", 7],
    ["month", "2026-08-31T18:00:00.000Z", "2026-09-30T17:59:59.999Z", 30],
    ["year", "2025-12-31T18:00:00.000Z", "2026-12-31T17:59:59.999Z", 12],
  ];
  for (const [period, first, last, buckets] of cases) {
    const orders = [first, last].map((createdAt) => ({
      createdAt,
      stage: "delivered",
      paymentStatus: "paid",
      total: 0.1,
      profit: 0.1,
    }));
    orders.push({ ...orders[0], total: 0.2, profit: 0.2 });
    const result = summarizeOrders(
      orders,
      period,
      new Date("2026-09-08T00:00:00Z"),
    );
    assert.equal(result.chart.length, buckets, period);
    assert.equal(result.chart[0].orders, 2, period);
    assert.equal(result.chart[0].revenue, 0.3, period);
    assert.equal(result.chart[0].profit, 0.3, period);
    assert.equal(result.chart.at(-1).orders, 1, period);
    assert.equal(result.deliveredOrders, 3, period);
    assert.equal(result.revenue, 0.4, period);
  }
});
