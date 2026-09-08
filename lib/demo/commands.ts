import type {
  AdminProduct,
  Order,
  OrderLine,
  ShopSettings,
} from "../admin/types.ts";
import {
  orderStages,
  orderStageTransitions,
  orderSources,
  paymentMethods,
  paymentStatuses,
} from "../admin/types.ts";
import {
  emailValue,
  enumValue,
  money,
  numberValue,
  record,
  textValue,
  ValidationError,
} from "../admin/validation.ts";
import {
  createId,
  normalizeProduct,
  normalizeSettings,
  round,
} from "./validation.ts";
import { getOrder, getProduct } from "./queries.ts";
import { updateDemoSnapshot } from "./store.ts";
import type { DemoSnapshot } from "./types.ts";
const requiredId = (value: unknown, label: string) =>
  textValue(value, label, { required: true, max: 200 });

export function saveProduct(input: unknown, id?: string): AdminProduct {
  return updateDemoSnapshot((state) => {
    const existing = id ? getProduct(state, id) : null;
    if (id && !existing) throw new ValidationError("Product not found.");
    const product = normalizeProduct(input, existing, state.settings);
    if (
      state.products.some(
        (item) => item.handle === product.handle && item.id !== product.id,
      )
    )
      throw new ValidationError(
        "A product already uses this handle. Choose another handle.",
      );
    const index = state.products.findIndex((item) => item.id === product.id);
    if (index < 0) state.products.unshift(product);
    else state.products[index] = product;
    return product;
  });
}
export function deleteProduct(id: string): void {
  saveProduct({ active: false }, id);
}
export function restockProduct(id: string, quantity: number): AdminProduct {
  const amount = numberValue(quantity, "Restock quantity", {
    integer: true,
    min: 1,
    max: 1_000_000,
  });
  return updateDemoSnapshot((state) => {
    const product = getProduct(state, id);
    if (!product) throw new ValidationError("Product not found.");
    if (product.stock + amount > 1_000_000)
      throw new ValidationError("Stock cannot exceed 1,000,000 units.");
    product.stock += amount;
    product.available =
      product.active && product.variants.some((variant) => variant.available);
    product.updatedAt = new Date().toISOString();
    return product;
  });
}
function orderLine(
  state: DemoSnapshot,
  input: unknown,
  storefront: boolean,
): OrderLine {
  const line = record(input, "Order item");
  const quantity = numberValue(line.quantity, "Quantity", {
    min: 1,
    max: 10_000,
    integer: true,
  });
  const productId = line.productId
    ? requiredId(line.productId, "Product ID")
    : null;
  const product = productId ? getProduct(state, productId) : null;
  if (productId && (!product || !product.active))
    throw new ValidationError("An ordered product is no longer available.");
  if (storefront && !product)
    throw new ValidationError("Choose a catalog product.");
  const variantId = line.variantId
    ? requiredId(line.variantId, "Variant ID")
    : null;
  const selectedVariant = product?.variants.find(
    (variant) => variant.id === variantId,
  );
  if (product && variantId && !selectedVariant)
    throw new ValidationError(`Choose a valid variant for ${product.title}.`);
  if (storefront && product && product.variants.length > 1 && !selectedVariant)
    throw new ValidationError(`Choose a size or color for ${product.title}.`);
  if (selectedVariant && !selectedVariant.available)
    throw new ValidationError(
      `${product?.title}: this variant is unavailable.`,
    );
  const price = product
    ? (selectedVariant?.price ?? product.price)
    : money(line.price, "Custom item price");
  const costPrice = product
    ? product.costPrice
    : money(line.costPrice, "Custom item cost", 0);
  return {
    id: createId(),
    productId: product?.id ?? null,
    variantId: selectedVariant?.id ?? null,
    title:
      product?.title ??
      textValue(line.title, "Custom item title", { required: true, max: 200 }),
    sku: selectedVariant?.sku ?? textValue(line.sku, "SKU", { max: 100 }),
    variant: selectedVariant
      ? [selectedVariant.color, selectedVariant.size]
          .filter(Boolean)
          .join(" / ") || selectedVariant.title
      : textValue(line.variant, "Variant", { max: 200 }),
    quantity,
    price,
    costPrice,
    customizations: textValue(line.customizations, "Customizations", {
      max: 2000,
    }),
  };
}

function updateInventory(
  state: DemoSnapshot,
  items: OrderLine[],
  direction: -1 | 1,
): void {
  const quantities = new Map<string, number>();
  for (const item of items)
    if (item.productId)
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.quantity,
      );
  for (const [id, quantity] of quantities) {
    const product = getProduct(state, id);
    if (!product)
      throw new ValidationError("An ordered product no longer exists.");
    const stock = product.stock + direction * quantity;
    if (stock < 0)
      throw new ValidationError(
        `${product.title} has only ${product.stock} units in stock.`,
      );
    if (stock > 1_000_000)
      throw new ValidationError(
        `${product.title}: restoring stock would exceed 1,000,000 units.`,
      );
    Object.assign(product, {
      stock,
      available:
        product.active &&
        stock > 0 &&
        product.variants.some((variant) => variant.available),
      updatedAt: new Date().toISOString(),
    });
  }
}

export function createOrder(
  input: unknown,
  options: { storefront?: boolean } = {},
): Order {
  const storefront = options.storefront === true;
  return updateDemoSnapshot((state) => {
    const value = record(input, "Order");
    const customerName = textValue(value.customerName, "Customer name", {
      required: true,
      max: 200,
    });
    const customerPhone = textValue(value.customerPhone, "Customer phone", {
      required: true,
      max: 40,
    });
    if (!/^[+\d][\d\s()-]{5,39}$/.test(customerPhone))
      throw new ValidationError("Enter a valid customer phone number.");
    const address = textValue(value.address, "Delivery address", {
      required: true,
      max: 2000,
    });
    if (
      !Array.isArray(value.items) ||
      value.items.length < 1 ||
      value.items.length > 100
    )
      throw new ValidationError("An order needs between 1 and 100 items.");
    const items = value.items.map((line) => orderLine(state, line, storefront));
    const subtotal = round(
      items.reduce((total, line) => total + line.price * line.quantity, 0),
    );
    const discount = storefront ? 0 : money(value.discount, "Discount", 0);
    const shippingCharge = storefront
      ? 0
      : money(value.shippingCharge, "Shipping charge", 0);
    const deliveryCost = storefront
      ? 0
      : money(value.deliveryCost, "Delivery cost", 0);
    const additionalCost = storefront
      ? 0
      : money(value.additionalCost, "Additional cost", 0);
    if (discount > subtotal)
      throw new ValidationError("Discount cannot exceed the order subtotal.");
    const now = new Date().toISOString();
    const sequence =
      state.orders.reduce(
        (highest, order) => Math.max(highest, Number(order.number.slice(3))),
        1000,
      ) + 1;
    if (!Number.isSafeInteger(sequence))
      throw new ValidationError("The order number limit has been reached.");
    const total = round(subtotal - discount + shippingCharge);
    const paymentStatus = storefront
      ? "unpaid"
      : enumValue(
          value.paymentStatus,
          paymentStatuses,
          "Payment status",
          "unpaid",
        );
    if (paymentStatus === "refunded")
      throw new ValidationError(
        "A new order must be unpaid or paid. Record a refund after receiving payment.",
      );
    const order: Order = {
      id: createId(),
      number: `PS-${sequence}`,
      customerName,
      customerPhone,
      customerEmail: emailValue(value.customerEmail),
      address,
      notes: textValue(value.notes, "Notes", { max: 5000 }),
      source: storefront
        ? "storefront"
        : enumValue(
            value.source,
            orderSources,
            "Order source",
            items.some((line) => !line.productId) ? "custom" : "admin",
          ),
      stage: "pending",
      paymentStatus,
      paymentMethod: storefront
        ? "cod"
        : enumValue(
            value.paymentMethod,
            paymentMethods,
            "Payment method",
            "cod",
          ),
      items,
      subtotal,
      discount,
      shippingCharge,
      deliveryCost,
      additionalCost,
      total,
      profit: round(
        total -
          items.reduce((sum, line) => sum + line.costPrice * line.quantity, 0) -
          deliveryCost -
          additionalCost,
      ),
      stockDeducted: items.some((line) => Boolean(line.productId)),
      history: [
        {
          id: createId(),
          stage: "pending",
          note: "Order created",
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    updateInventory(state, items, -1);
    state.orders.unshift(order);
    state.notifications.unshift({
      id: createId(),
      title: "New order received",
      message: `${order.number} · ${order.customerName} · Tk ${order.total.toFixed(2)}`,
      orderId: order.id,
      read: false,
      createdAt: now,
    });
    return order;
  });
}

export function updateOrder(id: string, input: unknown): Order {
  return updateDemoSnapshot((state) => {
    const existing = getOrder(state, id);
    if (!existing) throw new ValidationError("Order not found.");
    const value = record(input, "Order update");
    const stage = enumValue(
      value.stage,
      orderStages,
      "Order stage",
      existing.stage,
    );
    if (
      stage !== existing.stage &&
      !orderStageTransitions[existing.stage].includes(stage)
    )
      throw new ValidationError(
        `Cannot move an order from ${existing.stage} to ${stage}.`,
      );
    const paymentStatus = enumValue(
      value.paymentStatus,
      paymentStatuses,
      "Payment status",
      existing.paymentStatus,
    );
    if (
      paymentStatus === "refunded" &&
      existing.paymentStatus !== "paid" &&
      existing.paymentStatus !== "refunded"
    )
      throw new ValidationError("Only a paid order can be marked refunded.");
    const deliveryCost = money(
      value.deliveryCost,
      "Delivery cost",
      existing.deliveryCost,
    );
    const additionalCost = money(
      value.additionalCost,
      "Additional cost",
      existing.additionalCost,
    );
    const now = new Date().toISOString();
    let stockDeducted = existing.stockDeducted;
    if (
      stage !== existing.stage &&
      (stage === "cancelled" || stage === "returned") &&
      stockDeducted
    ) {
      updateInventory(state, existing.items, 1);
      stockDeducted = false;
    }
    const note = textValue(value.note, "Order note", { max: 2000 });
    const changes = [
      stage !== existing.stage ? `Order ${stage}` : "",
      paymentStatus !== existing.paymentStatus
        ? `Payment marked ${paymentStatus}`
        : "",
      deliveryCost !== existing.deliveryCost
        ? `Delivery expense changed from Tk ${existing.deliveryCost.toFixed(2)} to Tk ${deliveryCost.toFixed(2)}`
        : "",
      additionalCost !== existing.additionalCost
        ? `Other expenses changed from Tk ${existing.additionalCost.toFixed(2)} to Tk ${additionalCost.toFixed(2)}`
        : "",
      note,
    ].filter(Boolean);
    if (!changes.length) return existing;
    const updated: Order = {
      ...existing,
      stage,
      paymentStatus,
      deliveryCost,
      additionalCost,
      profit: round(
        existing.total -
          existing.items.reduce(
            (sum, item) => sum + item.costPrice * item.quantity,
            0,
          ) -
          deliveryCost -
          additionalCost,
      ),
      stockDeducted,
      updatedAt: now,
      history: [
        ...existing.history,
        { id: createId(), stage, note: changes.join(". "), createdAt: now },
      ],
    };
    state.orders[state.orders.findIndex((order) => order.id === updated.id)] =
      updated;
    return updated;
  });
}

export function deleteOrder(id: string): void {
  updateDemoSnapshot((state) => {
    const order = getOrder(state, id);
    if (!order) throw new ValidationError("Order not found.");
    if (order.stockDeducted && order.stage !== "delivered")
      updateInventory(state, order.items, 1);
    state.orders = state.orders.filter((item) => item.id !== order.id);
    state.notifications = state.notifications.filter(
      (item) => item.orderId !== order.id,
    );
  });
}
export function saveSettings(input: unknown): ShopSettings {
  return updateDemoSnapshot((state) => {
    state.settings = normalizeSettings(input, state.settings);
    return state.settings;
  });
}
export function markNotificationsRead(): void {
  updateDemoSnapshot((state) => {
    state.notifications.forEach((notification) => {
      notification.read = true;
    });
  });
}
