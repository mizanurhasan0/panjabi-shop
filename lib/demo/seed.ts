import { products } from "../data/products.ts";
import type {
  AdminProduct,
  AdminUser,
  Order,
  OrderStage,
  ShopSettings,
} from "../admin/types.ts";
import type { DemoSnapshot } from "./types.ts";

export const demoOwner: AdminUser = {
  id: "demo-owner",
  name: "Demo owner",
  email: "owner@example.com",
};

export const defaultShopSettings: ShopSettings = {
  name: "Panjabi",
  tagline: "Tradition, thoughtfully crafted.",
  logo: "/images/panjabi-logo.svg",
  icon: "/favicon.ico",
  email: "hello@example.com",
  phone: "+880 1700 000000",
  address: "Dhanmondi, Dhaka, Bangladesh",
  currency: "BDT",
  timezone: "Asia/Dhaka",
  lowStockThreshold: 5,
};

// Stable catalog props keep the storefront useful before client hydration.
export const seededProducts: AdminProduct[] = products.map((product, index) => {
  const stock = index === 8 ? 0 : index % 7 === 5 ? 3 : 18 + (index % 9) * 4;
  return {
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      available: true,
    })),
    costPrice: Math.round(product.price * 0.58),
    stock,
    lowStockThreshold: 5,
    active: true,
    available: stock > 0,
    updatedAt: product.createdAt,
  };
});

const customers = [
  ["Rahim Uddin", "Dhanmondi, Dhaka"],
  ["Nusrat Jahan", "Agrabad, Chattogram"],
  ["Sajid Ahmed", "Uttara, Dhaka"],
  ["Farhana Islam", "Zindabazar, Sylhet"],
  ["Tanvir Hasan", "Sonadanga, Khulna"],
  ["Mehedi Rahman", "Mirpur, Dhaka"],
  ["Arif Hossain", "Boalia, Rajshahi"],
  ["Sadia Akter", "Kandirpar, Cumilla"],
];
const stages: OrderStage[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "delivered",
  "delivered",
  "cancelled",
  "returned",
];
const progress: OrderStage[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

/** Dates are relative to first browser use so each report opens with useful examples. */
export function createDemoSeed(now = new Date()): DemoSnapshot {
  const today = new Date(now.getTime() + 6 * 3600000);
  const midnight =
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) -
    6 * 3600000;
  const elapsedToday = Math.max(0, now.getTime() - midnight);
  const orders: Order[] = Array.from({ length: 64 }, (_, index) => {
    const product = seededProducts[index % seededProducts.length];
    const variant = product.variants[index % product.variants.length];
    const customer = customers[index % customers.length];
    const custom = index % 13 === 12;
    const quantity = index % 4 === 2 ? 2 : 1;
    const stage = stages[index % stages.length];
    const daysAgo =
      index < 9
        ? 0
        : index < 20
          ? 1 + ((index - 9) % 6)
          : index < 40
            ? 7 + (index - 20)
            : 30 + (index - 40) * 8;
    const createdAt = new Date(
      daysAgo === 0
        ? midnight + elapsedToday * (1 - index / 10)
        : midnight - daysAgo * 86400000 + (9 + (index % 10)) * 3600000,
    ).toISOString();
    const price = custom ? 4200 : (variant?.price ?? product.price);
    const costPrice = custom ? 2400 : product.costPrice;
    const subtotal = price * quantity;
    const discount = index % 5 === 0 ? 100 : 0;
    const shippingCharge = index % 3 === 0 ? 0 : 80;
    const deliveryCost = 70;
    const additionalCost = custom ? 150 : 20;
    const total = subtotal - discount + shippingCharge;
    const id = `demo-order-${index + 1}`;
    const orderStages =
      stage === "cancelled"
        ? (["pending", "cancelled"] as OrderStage[])
        : stage === "returned"
          ? ([...progress, "returned"] as OrderStage[])
          : progress.slice(0, progress.indexOf(stage) + 1);
    return {
      id,
      number: `PS-${1064 - index}`,
      customerName: customer[0],
      customerPhone: `017${String(10000000 + index * 17421)}`,
      customerEmail: index % 3 === 0 ? `customer${index + 1}@example.com` : "",
      address: `${12 + index} Lake Road, ${customer[1]}`,
      notes: custom
        ? "Custom fitting requested. Please confirm measurements before stitching."
        : index % 4 === 0
          ? "Please call before delivery."
          : "",
      source: custom ? "custom" : index % 4 === 0 ? "admin" : "storefront",
      stage,
      paymentStatus:
        stage === "returned"
          ? "refunded"
          : stage === "delivered"
            ? "paid"
            : "unpaid",
      paymentMethod: index % 4 === 0 ? "mobile" : "cod",
      items: [
        {
          id: `demo-line-${index + 1}`,
          productId: custom ? null : product.id,
          variantId: custom ? null : (variant?.id ?? null),
          title: custom ? "Bespoke embroidered Panjabi" : product.title,
          sku: custom ? "CUSTOM-EMB" : (variant?.sku ?? ""),
          variant: custom
            ? "Ivory / Custom fit"
            : [variant?.color, variant?.size].filter(Boolean).join(" / "),
          quantity,
          price,
          costPrice,
          customizations: custom
            ? "Chest 42 in, length 40 in, hand embroidery at collar."
            : "",
        },
      ],
      subtotal,
      discount,
      shippingCharge,
      deliveryCost,
      additionalCost,
      total,
      profit:
        Math.round(
          (total - costPrice * quantity - deliveryCost - additionalCost) * 100,
        ) / 100,
      stockDeducted: !custom && stage !== "cancelled" && stage !== "returned",
      history: orderStages.map((eventStage, eventIndex) => ({
        id: `${id}-event-${eventIndex}`,
        stage: eventStage,
        note: eventIndex === 0 ? "Sample order created" : `Order ${eventStage}`,
        createdAt,
      })),
      createdAt,
      updatedAt: createdAt,
    };
  });
  return {
    version: 1,
    products: structuredClone(seededProducts),
    orders,
    settings: { ...defaultShopSettings },
    notifications: orders.slice(0, 8).map((order, index) => ({
      id: `demo-notification-${index + 1}`,
      title: "New order received",
      message: `${order.number} · ${order.customerName} · Tk ${order.total.toLocaleString("en-BD")}`,
      orderId: order.id,
      read: index > 2,
      createdAt: order.createdAt,
    })),
  };
}
