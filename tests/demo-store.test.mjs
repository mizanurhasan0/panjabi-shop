import test from "node:test";
import assert from "node:assert/strict";
import { createDemoSeed, seededProducts } from "../lib/demo/seed.ts";
import { validateDemoSnapshot } from "../lib/demo/validation.ts";
import {
  getDashboardStats,
  listOrders,
  listProducts,
} from "../lib/demo/queries.ts";
import {
  getDemoSnapshot,
  getDemoServerSnapshot,
  replaceDemoSnapshot,
  subscribeDemo,
} from "../lib/demo/store.ts";
import {
  createOrder,
  deleteOrder,
  deleteProduct,
  restockProduct,
  saveProduct,
  saveSettings,
  updateOrder,
} from "../lib/demo/commands.ts";

let failPersistence = false;
const saved = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => {
      if (failPersistence) throw new Error("Quota exceeded");
      saved.set(key, value);
    },
  },
  addEventListener() {},
  removeEventListener() {},
};
function fresh() {
  const seed = createDemoSeed();
  seed.orders = [];
  seed.notifications = [];
  seed.products[0].stock = 10;
  replaceDemoSnapshot(seed);
  return getDemoSnapshot().products[0];
}
function input(
  product,
  items = [
    { productId: product.id, variantId: product.variants[0].id, quantity: 2 },
  ],
) {
  return {
    customerName: "Demo Customer",
    customerPhone: "01712345678",
    address: "Dhanmondi, Dhaka",
    items,
  };
}

test("sample data validates, is populated in all report periods and preserves SSR catalog", () => {
  const now = new Date("2026-09-08T08:00:00Z");
  const state = validateDemoSnapshot(createDemoSeed(now));
  assert.equal(state.orders.length, 64);
  assert.equal(state.products.length, seededProducts.length);
  assert.ok(state.products.some((product) => product.stock === 0));
  assert.ok(
    state.products.some((product) => product.stock > 0 && product.stock <= 5),
  );
  for (const period of ["day", "week", "month", "year"]) {
    const stats = getDashboardStats(state, period, now);
    assert.ok(stats.revenue > 0);
    assert.ok(stats.profit > 0);
    assert.ok(stats.pendingOrders > 0);
    const filtered = listOrders(state, {
      from: stats.from,
      to: stats.to,
      pageSize: 100,
    });
    assert.equal(filtered.total, stats.orderCount);
  }
  state.products[0].stock = 0;
  assert.notEqual(seededProducts[0].stock, 0);
  assert.equal(getDemoServerSnapshot(), null);
});

test("product edits retain stock and variant IDs; archived products remain restorable", () => {
  const product = fresh();
  const updated = saveProduct(
    { title: "A revised title", price: 2500, compareAtPrice: 3000 },
    product.id,
  );
  assert.equal(updated.stock, 10);
  assert.equal(updated.variants[0].id, product.variants[0].id);
  assert.equal(updated.variants[0].price, 2500);
  deleteProduct(product.id);
  assert.equal(
    listProducts(getDemoSnapshot(), { query: "A revised title" }).total,
    0,
  );
  assert.equal(
    listProducts(getDemoSnapshot(), {
      query: "A revised title",
      includeInactive: true,
    }).total,
    1,
  );
  saveProduct({ active: true }, product.id);
  assert.equal(restockProduct(product.id, 3).stock, 13);
  assert.throws(() => restockProduct(product.id, -1));
});

test("checkout uses catalog prices and atomically reserves combined duplicate quantities", () => {
  const product = fresh();
  const lines = [
    {
      productId: product.id,
      variantId: product.variants[0].id,
      quantity: 3,
      price: 1,
      costPrice: 0,
    },
    { productId: product.id, variantId: product.variants[0].id, quantity: 2 },
  ];
  const order = createOrder(
    {
      ...input(product, lines),
      discount: 99999,
      paymentStatus: "paid",
      deliveryCost: 900,
    },
    { storefront: true },
  );
  assert.equal(order.total, product.variants[0].price * 5);
  assert.equal(order.paymentStatus, "unpaid");
  assert.equal(order.discount, 0);
  assert.equal(order.items[0].costPrice, product.costPrice);
  assert.equal(getDemoSnapshot().products[0].stock, 5);
  assert.equal(getDemoSnapshot().notifications[0].orderId, order.id);
  const before = getDemoSnapshot();
  assert.throws(
    () =>
      createOrder(
        input(product, [
          { ...lines[0], quantity: 4 },
          { ...lines[0], quantity: 4 },
        ]),
      ),
    /only 5 units/,
  );
  assert.equal(getDemoSnapshot(), before);
});

test("cancellation and deletion restore inventory only once", () => {
  const product = fresh();
  const order = createOrder(input(product));
  assert.equal(getDemoSnapshot().products[0].stock, 8);
  updateOrder(order.id, { stage: "cancelled" });
  assert.equal(getDemoSnapshot().products[0].stock, 10);
  updateOrder(order.id, { stage: "cancelled", note: "Customer informed" });
  deleteOrder(order.id);
  assert.equal(getDemoSnapshot().products[0].stock, 10);
  assert.equal(getDemoSnapshot().notifications.length, 0);
});

test("delivery, refund and return retain cost snapshots and correct report totals", () => {
  const product = fresh();
  const order = createOrder(input(product));
  assert.throws(
    () => updateOrder(order.id, { stage: "delivered" }),
    /Cannot move/,
  );
  assert.throws(
    () => updateOrder(order.id, { paymentStatus: "refunded" }),
    /Only a paid/,
  );
  saveProduct({ costPrice: product.costPrice + 200 }, product.id);
  for (const stage of ["confirmed", "processing", "shipped", "delivered"])
    updateOrder(order.id, { stage });
  updateOrder(order.id, { paymentStatus: "paid", deliveryCost: 80 });
  const stats = getDashboardStats(getDemoSnapshot(), "day");
  assert.equal(stats.revenue, order.total);
  assert.equal(stats.profit, order.total - product.costPrice * 2 - 80);
  updateOrder(order.id, { paymentStatus: "refunded" });
  assert.equal(getDashboardStats(getDemoSnapshot(), "day").revenue, 0);
  updateOrder(order.id, { stage: "returned" });
  assert.equal(getDemoSnapshot().products[0].stock, 10);
  assert.equal(
    getDemoSnapshot().orders[0].items[0].costPrice,
    product.costPrice,
  );
});

test("deleting delivered order keeps sold inventory deducted; custom order uses no stock", () => {
  const product = fresh();
  const order = createOrder(input(product));
  for (const stage of ["confirmed", "processing", "shipped", "delivered"])
    updateOrder(order.id, { stage });
  deleteOrder(order.id);
  assert.equal(getDemoSnapshot().products[0].stock, 8);
  const custom = createOrder(
    input(product, [
      {
        title: "Custom wedding Panjabi",
        quantity: 1,
        price: 5000,
        costPrice: 3000,
        customizations: "Hand embroidery",
      },
    ]),
  );
  assert.equal(custom.source, "custom");
  assert.equal(custom.profit, 2000);
  assert.equal(custom.stockDeducted, false);
  assert.equal(getDemoSnapshot().products[0].stock, 8);
});

test("restoring tampered totals or broken product links is rejected without changing current state", () => {
  const product = fresh();
  createOrder(input(product));
  const before = getDemoSnapshot();
  const invalid = structuredClone(before);
  invalid.orders[0].total += 1;
  assert.throws(() => replaceDemoSnapshot(invalid), /totals/);
  assert.equal(getDemoSnapshot(), before);
  invalid.orders[0].total -= 1;
  invalid.orders[0].items[0].productId = "missing";
  assert.throws(() => replaceDemoSnapshot(invalid), /unknown product/);
  assert.equal(getDemoSnapshot(), before);
  assert.throws(() => saveSettings({ logo: "javascript:alert(1)" }));
});

test("quota failures leave snapshot, inventory and subscribers unchanged", () => {
  const product = fresh();
  const before = getDemoSnapshot();
  let updates = 0;
  const unsubscribe = subscribeDemo(() => updates++);
  failPersistence = true;
  try {
    assert.throws(() => createOrder(input(product)), /not saved/);
  } finally {
    failPersistence = false;
  }
  assert.equal(getDemoSnapshot(), before);
  assert.equal(updates, 0);
  restockProduct(product.id, 1);
  assert.equal(updates, 1);
  assert.equal(getDemoSnapshot().products[0].stock, 11);
  unsubscribe();
});

test("filters are paginated, case insensitive and end dates are exclusive", () => {
  const state = createDemoSeed(new Date("2026-09-08T08:00:00Z"));
  const first = listOrders(state, { pageSize: 3 });
  const second = listOrders(state, { pageSize: 3, page: 2 });
  assert.equal(first.items.length, 3);
  assert.ok(
    first.items.every(
      (order) => !second.items.some((item) => item.id === order.id),
    ),
  );
  assert.equal(
    listOrders(state, {
      to: state.orders[0].createdAt,
      query: state.orders[0].number,
    }).total,
    0,
  );
  assert.ok(listOrders(state, { query: "RAHIM" }).total > 0);
  assert.throws(() => listOrders(state, { from: "invalid" }));
});
