import { createHash, randomUUID } from "node:crypto";
import type { SQLInputValue } from "node:sqlite";
import catalog from "../data/catalog.generated.json" with { type: "json" };
import { getDb, transaction } from "./db.ts";
import type { AdminProduct, ListResult, Notification, Order, OrderInput, OrderLine, OrderStage, ShopSettings } from "./types.ts";
import { orderStages } from "./types.ts";
import { booleanValue, emailValue, enumValue, imageUrl, money, numberValue, pagination, record, textList, textValue, ValidationError } from "./validation.ts";

export { getDb } from "./db.ts";

const defaultSettings: ShopSettings = {
  name: "Panjabi", tagline: "Tradition, thoughtfully crafted.",
  logo: "/images/panjabi-logo.svg", icon: "/favicon.ico",
  email: "", phone: "", address: "", currency: "BDT", timezone: "Asia/Dhaka", lowStockThreshold: 5,
};
const paymentMethods = ["cod", "bank", "mobile", "cash"] as const;
const paymentStatuses = ["unpaid", "paid", "refunded"] as const;
const orderSources = ["storefront", "admin", "custom"] as const;
const transitions: Record<OrderStage, readonly OrderStage[]> = {
  pending: ["confirmed", "cancelled"], confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"], shipped: ["delivered", "cancelled"],
  delivered: ["returned"], cancelled: [], returned: [],
};

function readData<T>(row: unknown): T | null {
  return row ? JSON.parse((row as { data: string }).data) as T : null;
}

function writeProduct(product: AdminProduct): void {
  getDb().prepare(`INSERT INTO products(id, handle, title, stock, active, updated_at, data)
    VALUES(?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET
    handle=excluded.handle, title=excluded.title, stock=excluded.stock,
    active=excluded.active, updated_at=excluded.updated_at, data=excluded.data`)
    .run(product.id, product.handle, product.title, product.stock, Number(product.active), product.updatedAt, JSON.stringify(product));
}

function writeOrder(order: Order, deleted = false, requestKey: string | null = null, requestHash: string | null = null): void {
  getDb().prepare(`INSERT INTO orders(id, number, customer_name, customer_phone, stage, created_at, deleted, request_key, request_hash, data)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET
    customer_name=excluded.customer_name, customer_phone=excluded.customer_phone,
    stage=excluded.stage, deleted=excluded.deleted, data=excluded.data`)
    .run(order.id, order.number, order.customerName, order.customerPhone, order.stage, order.createdAt, Number(deleted), requestKey, requestHash, JSON.stringify(order));
}

function ensureSeeded(): void {
  const database = getDb();
  if (database.prepare("SELECT value FROM shop_meta WHERE key = 'catalog_seeded'").get()) return;
  transaction(() => {
    if (database.prepare("SELECT value FROM shop_meta WHERE key = 'catalog_seeded'").get()) return;
    const now = new Date().toISOString();
    for (const product of catalog.products) {
      // Imported catalog availability is not an inventory count. Admins explicitly restock it.
      writeProduct({ ...product, stock: 0, costPrice: 0, lowStockThreshold: 5, available: false, active: true, updatedAt: now });
    }
    database.prepare("INSERT OR IGNORE INTO shop_settings(id, data) VALUES(1, ?)").run(JSON.stringify(defaultSettings));
    database.prepare("INSERT INTO shop_meta(key, value) VALUES('catalog_seeded', '1')").run();
  });
}

function round(value: number): number { return Math.round((value + Number.EPSILON) * 100) / 100; }
function requiredId(value: unknown, label = "ID"): string { return textValue(value, label, { required: true, max: 200 }); }
function slug(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\u0980-\u09ff]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeProduct(input: unknown, existing?: AdminProduct | null): AdminProduct {
  const value = record(input, "Product");
  const now = new Date().toISOString();
  const title = textValue(value.title ?? existing?.title, "Product title", { required: true, max: 200 });
  const id = existing?.id ?? randomUUID();
  const handle = slug(textValue(value.handle ?? existing?.handle ?? title, "Product handle", { required: true, max: 200 }));
  if (!handle) throw new ValidationError("Enter a product handle with letters or numbers.");
  const price = money(value.price, "Selling price", existing?.price ?? 0);
  const costPrice = money(value.costPrice, "Cost price", existing?.costPrice ?? 0);
  const stock = numberValue(value.stock, "Stock", { integer: true, max: 1_000_000, fallback: existing?.stock ?? 0 });
  const active = booleanValue(value.active, "Active", existing?.active ?? true);
  const colors = textList(value.colors, "Colors", existing?.colors ?? []);
  const sizes = textList(value.sizes, "Sizes", existing?.sizes ?? []);
  const images = value.images === undefined ? (existing?.images ?? []) : (() => {
    if (!Array.isArray(value.images) || value.images.length > 20) throw new ValidationError("Use up to 20 product images.");
    return value.images.map((url) => imageUrl(url, "Product image")).filter(Boolean);
  })();
  const compareAtPrice = value.compareAtPrice === null || value.compareAtPrice === "" ? null : value.compareAtPrice === undefined ? (existing?.compareAtPrice ?? null) : money(value.compareAtPrice, "Compare at price");
  if (compareAtPrice !== null && compareAtPrice < price) throw new ValidationError("Compare at price must be at least the selling price.");
  let variants = existing?.variants ?? [];
  if (value.variants !== undefined) {
    if (!Array.isArray(value.variants) || value.variants.length > 200) throw new ValidationError("Use up to 200 product variants.");
    const ids = new Set<string>();
    variants = value.variants.map((entry, index) => {
      const variant = record(entry, "Variant");
      const variantId = textValue(variant.id ?? `${id}-${index + 1}`, "Variant ID", { required: true, max: 200 });
      if (ids.has(variantId)) throw new ValidationError("Variant IDs must be unique.");
      ids.add(variantId);
      return {
        id: variantId, title: textValue(variant.title ?? title, "Variant title", { max: 200 }),
        sku: textValue(variant.sku, "SKU", { max: 100 }), price: money(variant.price, "Variant price", price),
        compareAtPrice: variant.compareAtPrice == null ? null : money(variant.compareAtPrice, "Variant compare at price"),
        color: textValue(variant.color, "Color", { max: 100 }), size: textValue(variant.size, "Size", { max: 100 }),
        available: booleanValue(variant.available, "Variant availability", true),
      };
    });
  } else if (existing && price !== existing.price) {
    variants = variants.map((variant) => ({ ...variant, price, compareAtPrice }));
  }
  if (!variants.length) {
    variants = (colors.length ? colors : [""]).flatMap((color) => (sizes.length ? sizes : [""]).map((size) => ({
      id: `${id}-${randomUUID().slice(0, 8)}`, title: [color, size].filter(Boolean).join(" / ") || "Default",
      sku: textValue(value.sku, "SKU", { max: 100 }), price, compareAtPrice, color, size, available: true,
    })));
  }
  const description = textValue(value.description ?? existing?.description, "Description", { max: 20_000 });
  return {
    id, handle, title, vendor: textValue(value.vendor ?? existing?.vendor ?? getSettings().name, "Vendor", { max: 200 }),
    productType: textValue(value.productType ?? existing?.productType ?? "Panjabi", "Product type", { max: 100 }),
    description, descriptionHtml: description.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>"),
    tags: textList(value.tags, "Tags", existing?.tags ?? []),
    collectionHandle: textValue(value.collectionHandle ?? existing?.collectionHandle ?? "men", "Collection", { max: 100 }),
    price, priceMax: Math.max(price, ...variants.map((variant) => variant.price)),
    priceFormatted: `Tk ${price.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    compareAtPrice, images, colors, sizes, variants, available: active && stock > 0,
    isNew: booleanValue(value.isNew, "New product", existing?.isNew ?? true),
    createdAt: existing?.createdAt ?? now, costPrice, stock, active,
    lowStockThreshold: numberValue(value.lowStockThreshold, "Low stock threshold", { integer: true, max: 1_000_000, fallback: existing?.lowStockThreshold ?? getSettings().lowStockThreshold }), updatedAt: now,
  };
}

export interface ProductFilters { query?: string; page?: number; pageSize?: number; stock?: "low" | "out"; includeInactive?: boolean }

export function listProducts(filters: ProductFilters = {}): ListResult<AdminProduct> {
  ensureSeeded();
  const { page, pageSize, offset } = pagination(filters.page, filters.pageSize);
  const conditions: string[] = filters.includeInactive ? [] : ["active = 1"];
  const parameters: SQLInputValue[] = [];
  if (filters.query?.trim()) {
    conditions.push("(title LIKE ? ESCAPE '\\' OR handle LIKE ? ESCAPE '\\')");
    const query = `%${textValue(filters.query, "Search", { max: 200 }).replace(/[\\%_]/g, "\\$&")}%`;
    parameters.push(query, query);
  }
  if (filters.stock === "out") conditions.push("stock = 0");
  if (filters.stock === "low") conditions.push("stock <= CAST(json_extract(data, '$.lowStockThreshold') AS INTEGER)");
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const total = Number((getDb().prepare(`SELECT COUNT(*) AS total FROM products ${where}`).get(...parameters) as { total: number }).total);
  const rows = getDb().prepare(`SELECT data FROM products ${where} ORDER BY updated_at DESC, id LIMIT ? OFFSET ?`).all(...parameters, pageSize, offset);
  return { items: rows.map((row) => readData<AdminProduct>(row)!), total, page, pageSize };
}

export function getProduct(id: string): AdminProduct | null {
  ensureSeeded();
  return readData<AdminProduct>(getDb().prepare("SELECT data FROM products WHERE id = ? OR handle = ? LIMIT 1").get(id, id));
}

export function saveProduct(input: unknown, id?: string): AdminProduct {
  ensureSeeded();
  return transaction(() => {
    const existing = id ? getProduct(id) : null;
    if (id && !existing) throw new ValidationError("Product not found.");
    const product = normalizeProduct(input, existing);
    const duplicate = getDb().prepare("SELECT id FROM products WHERE handle = ? AND id <> ?").get(product.handle, product.id);
    if (duplicate) throw new ValidationError("A product already uses this handle. Choose another handle.");
    writeProduct(product);
    return product;
  });
}

export function deleteProduct(id: string): void {
  saveProduct({ active: false }, id);
}

export function restockProduct(id: string, quantity: number): AdminProduct {
  ensureSeeded();
  const amount = numberValue(quantity, "Restock quantity", { integer: true, min: 1, max: 1_000_000 });
  return transaction(() => {
    const product = getProduct(id);
    if (!product) throw new ValidationError("Product not found.");
    if (product.stock + amount > 1_000_000) throw new ValidationError("Stock cannot exceed 1,000,000 units.");
    const updated = { ...product, stock: product.stock + amount, available: product.active, updatedAt: new Date().toISOString() };
    writeProduct(updated);
    return updated;
  });
}

export interface OrderFilters { query?: string; stage?: OrderStage; page?: number; pageSize?: number; from?: string; to?: string }

export function listOrders(filters: OrderFilters = {}): ListResult<Order> {
  ensureSeeded();
  const { page, pageSize, offset } = pagination(filters.page, filters.pageSize);
  const conditions = ["deleted = 0"];
  const parameters: SQLInputValue[] = [];
  if (filters.query?.trim()) {
    conditions.push("(number LIKE ? ESCAPE '\\' OR customer_name LIKE ? ESCAPE '\\' OR customer_phone LIKE ? ESCAPE '\\')");
    const query = `%${textValue(filters.query, "Search", { max: 200 }).replace(/[\\%_]/g, "\\$&")}%`;
    parameters.push(query, query, query);
  }
  if (filters.stage) { conditions.push("stage = ?"); parameters.push(enumValue(filters.stage, orderStages, "Order stage")); }
  for (const key of ["from", "to"] as const) {
    if (!filters[key]) continue;
    const date = new Date(filters[key]);
    if (!Number.isFinite(date.getTime())) throw new ValidationError("Enter a valid date filter.");
    conditions.push(`created_at ${key === "from" ? ">=" : "<="} ?`);
    parameters.push(date.toISOString());
  }
  const where = conditions.join(" AND ");
  const total = Number((getDb().prepare(`SELECT COUNT(*) AS total FROM orders WHERE ${where}`).get(...parameters) as { total: number }).total);
  const rows = getDb().prepare(`SELECT data FROM orders WHERE ${where} ORDER BY created_at DESC, id LIMIT ? OFFSET ?`).all(...parameters, pageSize, offset);
  return { items: rows.map((row) => readData<Order>(row)!), total, page, pageSize };
}

export function getOrder(id: string): Order | null {
  ensureSeeded();
  return readData<Order>(getDb().prepare("SELECT data FROM orders WHERE (id = ? OR number = ?) AND deleted = 0 LIMIT 1").get(id, id));
}

function orderLine(input: unknown, storefront: boolean): OrderLine {
  const line = record(input, "Order item");
  const quantity = numberValue(line.quantity, "Quantity", { min: 1, max: 10_000, integer: true });
  const productId = line.productId ? requiredId(line.productId, "Product ID") : null;
  const product = productId ? getProduct(productId) : null;
  if (productId && (!product || !product.active)) throw new ValidationError("An ordered product is no longer available.");
  if (storefront && !product) throw new ValidationError("Choose a catalog product.");
  const variantId = line.variantId ? requiredId(line.variantId, "Variant ID") : null;
  const selectedVariant = product?.variants.find((variant) => variant.id === variantId);
  if (product && variantId && !selectedVariant) throw new ValidationError(`Choose a valid variant for ${product.title}.`);
  if (storefront && product && product.variants.length > 1 && !selectedVariant) throw new ValidationError(`Choose a size or color for ${product.title}.`);
  if (selectedVariant && !selectedVariant.available) throw new ValidationError(`${product?.title}: this variant is unavailable.`);
  const price = product ? (selectedVariant?.price ?? product.price) : money(line.price, "Custom item price");
  const costPrice = product ? product.costPrice : money(line.costPrice, "Custom item cost", 0);
  return {
    id: randomUUID(), productId: product?.id ?? null, variantId: selectedVariant?.id ?? null,
    title: product?.title ?? textValue(line.title, "Custom item title", { required: true, max: 200 }),
    sku: selectedVariant?.sku ?? textValue(line.sku, "SKU", { max: 100 }),
    variant: selectedVariant ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(" / ") || selectedVariant.title : textValue(line.variant, "Variant", { max: 200 }),
    quantity, price, costPrice, customizations: textValue(line.customizations, "Customizations", { max: 2000 }),
  };
}

function updateInventory(items: OrderLine[], direction: -1 | 1): void {
  const quantities = new Map<string, number>();
  for (const item of items) if (item.productId) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  for (const [id, quantity] of quantities) {
    const product = getProduct(id);
    if (!product) throw new ValidationError("An ordered product no longer exists.");
    const stock = product.stock + direction * quantity;
    if (stock < 0) throw new ValidationError(`${product.title} has only ${product.stock} units in stock.`);
    writeProduct({ ...product, stock, available: product.active && stock > 0, updatedAt: new Date().toISOString() });
  }
}

function addNotification(order: Order): void {
  const notification: Notification = {
    id: randomUUID(), title: "New order received", message: `${order.number} · ${order.customerName} · Tk ${order.total.toFixed(2)}`,
    orderId: order.id, read: false, createdAt: order.createdAt,
  };
  getDb().prepare("INSERT INTO notifications(id, order_id, is_read, created_at, data) VALUES(?, ?, 0, ?, ?)")
    .run(notification.id, order.id, notification.createdAt, JSON.stringify(notification));
}

export function createOrder(input: OrderInput | unknown, options: boolean | { storefront?: boolean; idempotencyKey?: string } = false): Order {
  ensureSeeded();
  const storefront = typeof options === "boolean" ? options : options.storefront === true;
  const key = typeof options === "object" && options.idempotencyKey ? `${storefront ? "storefront" : "admin"}:${textValue(options.idempotencyKey, "Request key", { required: true, max: 200 })}` : null;
  const requestHash = key ? createHash("sha256").update(JSON.stringify(input)).digest("hex") : null;
  return transaction(() => {
    if (key) {
      const previous = getDb().prepare("SELECT data, deleted, request_hash FROM orders WHERE request_key = ?").get(key);
      if (previous) {
        if (previous.request_hash !== requestHash) throw new ValidationError("This checkout reference is already in use. Start a new order.");
        if (previous.deleted) throw new ValidationError("This request was already processed and its order was removed. Start a new order.");
        return readData<Order>(previous)!;
      }
    }
    const value = record(input, "Order");
    const customerName = textValue(value.customerName, "Customer name", { required: true, max: 200 });
    const customerPhone = textValue(value.customerPhone, "Customer phone", { required: true, max: 40 });
    if (!/^[+\d][\d\s()-]{5,39}$/.test(customerPhone)) throw new ValidationError("Enter a valid customer phone number.");
    const address = textValue(value.address, "Delivery address", { required: true, max: 2000 });
    if (!Array.isArray(value.items) || value.items.length < 1 || value.items.length > 100) throw new ValidationError("An order needs between 1 and 100 items.");
    const items = value.items.map((line) => orderLine(line, storefront));
    const subtotal = round(items.reduce((total, line) => total + line.price * line.quantity, 0));
    const discount = storefront ? 0 : money(value.discount, "Discount", 0);
    const shippingCharge = storefront ? 0 : money(value.shippingCharge, "Shipping charge", 0);
    const deliveryCost = storefront ? 0 : money(value.deliveryCost, "Delivery cost", 0);
    const additionalCost = storefront ? 0 : money(value.additionalCost, "Additional cost", 0);
    if (discount > subtotal) throw new ValidationError("Discount cannot exceed the order subtotal.");
    const now = new Date().toISOString();
    const sequence = Number((getDb().prepare("SELECT COALESCE(MAX(CAST(substr(number, 4) AS INTEGER)), 1000) + 1 AS next FROM orders").get() as { next: number }).next);
    const total = round(subtotal - discount + shippingCharge);
    const order: Order = {
      id: randomUUID(), number: `PS-${sequence}`, customerName, customerPhone,
      customerEmail: emailValue(value.customerEmail), address,
      notes: textValue(value.notes, "Notes", { max: 5000 }), source: storefront ? "storefront" : enumValue(value.source, orderSources, "Order source", items.some((line) => !line.productId) ? "custom" : "admin"),
      stage: "pending", paymentStatus: storefront ? "unpaid" : enumValue(value.paymentStatus, paymentStatuses, "Payment status", "unpaid"),
      paymentMethod: storefront ? "cod" : enumValue(value.paymentMethod, paymentMethods, "Payment method", "cod"),
      items, subtotal, discount, shippingCharge, deliveryCost, additionalCost, total,
      profit: round(total - items.reduce((sum, line) => sum + line.costPrice * line.quantity, 0) - deliveryCost - additionalCost),
      stockDeducted: items.some((line) => Boolean(line.productId)),
      history: [{ id: randomUUID(), stage: "pending", note: "Order created", createdAt: now }], createdAt: now, updatedAt: now,
    };
    updateInventory(items, -1);
    writeOrder(order, false, key, requestHash);
    addNotification(order);
    return order;
  });
}

export function updateOrder(id: string, input: { stage?: OrderStage; paymentStatus?: Order["paymentStatus"]; note?: string } | unknown): Order {
  ensureSeeded();
  return transaction(() => {
    const existing = getOrder(id);
    if (!existing) throw new ValidationError("Order not found.");
    const value = record(input, "Order update");
    const stage = enumValue(value.stage, orderStages, "Order stage", existing.stage);
    if (stage !== existing.stage && !transitions[existing.stage].includes(stage)) throw new ValidationError(`Cannot move an order from ${existing.stage} to ${stage}.`);
    const paymentStatus = enumValue(value.paymentStatus, paymentStatuses, "Payment status", existing.paymentStatus);
    if (paymentStatus === "refunded" && existing.paymentStatus !== "paid" && existing.paymentStatus !== "refunded") throw new ValidationError("Only a paid order can be marked refunded.");
    const now = new Date().toISOString();
    let stockDeducted = existing.stockDeducted;
    if (stage !== existing.stage && (stage === "cancelled" || stage === "returned") && stockDeducted) {
      updateInventory(existing.items, 1);
      stockDeducted = false;
    }
    const note = textValue(value.note, "Order note", { max: 2000 });
    const changes = [stage !== existing.stage ? `Order ${stage}` : "", paymentStatus !== existing.paymentStatus ? `Payment marked ${paymentStatus}` : "", note].filter(Boolean);
    if (!changes.length) return existing;
    const updated: Order = {
      ...existing, stage, paymentStatus, stockDeducted, updatedAt: now,
      history: [...existing.history, { id: randomUUID(), stage, note: changes.join(". "), createdAt: now }],
    };
    writeOrder(updated);
    return updated;
  });
}

export function deleteOrder(id: string): void {
  ensureSeeded();
  transaction(() => {
    const order = getOrder(id);
    if (!order) throw new ValidationError("Order not found.");
    if (order.stockDeducted && order.stage !== "delivered") {
      updateInventory(order.items, 1);
      order.stockDeducted = false;
    }
    const now = new Date().toISOString();
    order.updatedAt = now;
    order.history.push({ id: randomUUID(), stage: order.stage, note: "Order deleted", createdAt: now });
    writeOrder(order, true);
    getDb().prepare("DELETE FROM notifications WHERE order_id = ?").run(order.id);
  });
}

export function getSettings(): ShopSettings {
  ensureSeeded();
  return readData<ShopSettings>(getDb().prepare("SELECT data FROM shop_settings WHERE id = 1").get()) ?? { ...defaultSettings };
}

function normalizeSettings(input: unknown, previous = defaultSettings): ShopSettings {
  const value = record(input, "Shop settings");
  return {
    name: textValue(value.name ?? previous.name, "Shop name", { required: true, max: 100 }),
    tagline: textValue(value.tagline ?? previous.tagline, "Tagline", { max: 200 }),
    logo: imageUrl(value.logo ?? previous.logo, "Logo"), icon: imageUrl(value.icon ?? previous.icon, "Shop icon"),
    email: emailValue(value.email ?? previous.email), phone: textValue(value.phone ?? previous.phone, "Phone", { max: 40 }),
    address: textValue(value.address ?? previous.address, "Shop address", { max: 1000 }),
    currency: "BDT", timezone: "Asia/Dhaka",
    lowStockThreshold: numberValue(value.lowStockThreshold, "Low stock threshold", { fallback: previous.lowStockThreshold, integer: true, max: 1_000_000 }),
  };
}

export function saveSettings(input: unknown): ShopSettings {
  const settings = normalizeSettings(input, getSettings());
  getDb().prepare("INSERT INTO shop_settings(id, data) VALUES(1, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data").run(JSON.stringify(settings));
  return settings;
}

export function listNotifications(): Notification[] {
  ensureSeeded();
  return getDb().prepare("SELECT data, is_read FROM notifications ORDER BY is_read, created_at DESC LIMIT 100").all()
    .map((row) => ({ ...readData<Notification>(row)!, read: Boolean(row.is_read) }));
}

export function markNotificationsRead(): void {
  ensureSeeded();
  getDb().prepare("UPDATE notifications SET is_read = 1 WHERE is_read = 0").run();
}

export interface AdminDataSnapshot {
  version: 1; exportedAt: string; products: AdminProduct[];
  orders: Array<Order & { deleted?: boolean; requestKey?: string | null; requestHash?: string | null }>;
  settings: ShopSettings; notifications: Notification[];
}

export function exportRecords(): AdminDataSnapshot {
  ensureSeeded();
  return transaction(() => ({
    version: 1, exportedAt: new Date().toISOString(),
    products: getDb().prepare("SELECT data FROM products ORDER BY id").all().map((row) => readData<AdminProduct>(row)!),
    orders: getDb().prepare("SELECT data, deleted, request_key, request_hash FROM orders ORDER BY created_at").all().map((row) => ({
      ...readData<Order>(row)!, deleted: Boolean(row.deleted), requestKey: row.request_key as string | null, requestHash: row.request_hash as string | null,
    })),
    settings: getSettings(),
    notifications: getDb().prepare("SELECT data, is_read FROM notifications ORDER BY created_at").all().map((row) => ({ ...readData<Notification>(row)!, read: Boolean(row.is_read) })),
  }));
}

function timestamp(value: unknown, label: string): string {
  const result = textValue(value, label, { required: true, max: 40 });
  if (!Number.isFinite(new Date(result).getTime())) throw new ValidationError(`${label} must be a valid date.`);
  return new Date(result).toISOString();
}

/** Validate the whole snapshot before replacing data; auth and sessions are deliberately retained. */
export function restoreRecords(input: unknown): void {
  ensureSeeded();
  const value = record(input, "Backup");
  if (value.version !== 1) throw new ValidationError("This backup version is not supported.");
  for (const key of ["products", "orders", "notifications"] as const) {
    if (!Array.isArray(value[key]) || value[key].length > 100_000) throw new ValidationError(`Invalid backup ${key}.`);
  }
  const productIds = new Set<string>();
  const handles = new Set<string>();
  const products = (value.products as unknown[]).map((entry) => {
    const raw = record(entry, "Backup product");
    const id = requiredId(raw.id, "Product ID");
    const product = normalizeProduct(raw);
    if (productIds.has(id) || handles.has(product.handle)) throw new ValidationError("Backup contains duplicate products.");
    productIds.add(id); handles.add(product.handle);
    return { ...product, id, createdAt: timestamp(raw.createdAt, "Product creation date"), updatedAt: timestamp(raw.updatedAt, "Product update date") };
  });
  const orderIds = new Set<string>();
  const orderNumbers = new Set<string>();
  const requestKeys = new Set<string>();
  const orders = (value.orders as unknown[]).map((entry) => {
    const raw = record(entry, "Backup order");
    const id = requiredId(raw.id, "Order ID");
    const number = requiredId(raw.number, "Order number");
    if (!/^PS-\d+$/.test(number) || orderIds.has(id) || orderNumbers.has(number)) throw new ValidationError("Backup contains invalid or duplicate order numbers.");
    orderIds.add(id); orderNumbers.add(number);
    if (!Array.isArray(raw.items) || !raw.items.length || raw.items.length > 100) throw new ValidationError("Backup order items are invalid.");
    const items: OrderLine[] = raw.items.map((entry) => {
      const line = record(entry, "Backup order item");
      const productId = line.productId === null ? null : requiredId(line.productId, "Product ID");
      if (productId && !productIds.has(productId)) throw new ValidationError("Backup order refers to an unknown product.");
      return {
        id: requiredId(line.id), productId, variantId: line.variantId == null ? null : requiredId(line.variantId),
        title: textValue(line.title, "Item title", { required: true, max: 200 }), sku: textValue(line.sku, "SKU", { max: 100 }),
        variant: textValue(line.variant, "Variant", { max: 200 }), quantity: numberValue(line.quantity, "Quantity", { min: 1, max: 10_000, integer: true }),
        price: money(line.price, "Item price"), costPrice: money(line.costPrice, "Item cost"), customizations: textValue(line.customizations, "Customizations", { max: 2000 }),
      };
    });
    const subtotal = round(items.reduce((sum, line) => sum + line.quantity * line.price, 0));
    const discount = money(raw.discount, "Discount");
    const shippingCharge = money(raw.shippingCharge, "Shipping charge");
    const deliveryCost = money(raw.deliveryCost, "Delivery cost");
    const additionalCost = money(raw.additionalCost, "Additional cost");
    const total = round(subtotal - discount + shippingCharge);
    const profit = round(total - items.reduce((sum, line) => sum + line.quantity * line.costPrice, 0) - deliveryCost - additionalCost);
    if (discount > subtotal || raw.subtotal !== subtotal || raw.total !== total || raw.profit !== profit) throw new ValidationError("Backup order totals do not match its items.");
    const stage = enumValue(raw.stage, orderStages, "Order stage");
    const deleted = booleanValue(raw.deleted, "Deleted order", false);
    const stockDeducted = booleanValue(raw.stockDeducted, "Stock reservation", false);
    if ((stage === "cancelled" || stage === "returned" || (deleted && stage !== "delivered")) && stockDeducted) throw new ValidationError("Backup contains an invalid stock reservation.");
    if (!deleted && !["cancelled", "returned"].includes(stage) && items.some((line) => line.productId) && !stockDeducted) throw new ValidationError("Backup is missing an order stock reservation.");
    if (!Array.isArray(raw.history) || !raw.history.length || raw.history.length > 10_000) throw new ValidationError("Backup order history is invalid.");
    const history = raw.history.map((entry) => {
      const event = record(entry, "Order event");
      return { id: requiredId(event.id), stage: enumValue(event.stage, orderStages, "Event stage"), note: textValue(event.note, "Event note", { max: 2500 }), createdAt: timestamp(event.createdAt, "Event date") };
    });
    const requestKey = raw.requestKey == null ? null : textValue(raw.requestKey, "Request key", { required: true, max: 220 });
    if (requestKey && requestKeys.has(requestKey)) throw new ValidationError("Backup contains duplicate request keys.");
    if (requestKey) requestKeys.add(requestKey);
    const requestHash = raw.requestHash == null ? null : textValue(raw.requestHash, "Request fingerprint", { required: true, max: 64 });
    if (requestKey && (!requestHash || !/^[a-f0-9]{64}$/.test(requestHash))) throw new ValidationError("Backup checkout references are invalid.");
    const order: Order & { deleted: boolean; requestKey: string | null; requestHash: string | null } = {
      id, number, customerName: textValue(raw.customerName, "Customer name", { required: true, max: 200 }),
      customerPhone: textValue(raw.customerPhone, "Customer phone", { required: true, max: 40 }), customerEmail: emailValue(raw.customerEmail),
      address: textValue(raw.address, "Address", { required: true, max: 2000 }), notes: textValue(raw.notes, "Notes", { max: 5000 }),
      source: enumValue(raw.source, orderSources, "Order source"), stage,
      paymentStatus: enumValue(raw.paymentStatus, paymentStatuses, "Payment status"), paymentMethod: enumValue(raw.paymentMethod, paymentMethods, "Payment method"),
      items, subtotal, discount, shippingCharge, deliveryCost, additionalCost, total, profit, stockDeducted, history,
      createdAt: timestamp(raw.createdAt, "Order creation date"), updatedAt: timestamp(raw.updatedAt, "Order update date"), deleted, requestKey, requestHash,
    };
    return order;
  });
  const settings = normalizeSettings(value.settings);
  const notificationIds = new Set<string>();
  const notifications: Notification[] = (value.notifications as unknown[]).map((entry) => {
    const raw = record(entry, "Notification");
    const id = requiredId(raw.id);
    const orderId = raw.orderId == null ? null : requiredId(raw.orderId);
    if (notificationIds.has(id) || (orderId && !orderIds.has(orderId))) throw new ValidationError("Backup notifications are invalid.");
    notificationIds.add(id);
    return { id, orderId, title: textValue(raw.title, "Notification title", { required: true, max: 200 }), message: textValue(raw.message, "Notification message", { max: 1000 }), read: booleanValue(raw.read, "Read", false), createdAt: timestamp(raw.createdAt, "Notification date") };
  });
  transaction(() => {
    getDb().exec("DELETE FROM notifications; DELETE FROM orders; DELETE FROM products;");
    products.forEach(writeProduct);
    orders.forEach(({ deleted, requestKey, requestHash, ...order }) => writeOrder(order, deleted, requestKey, requestHash));
    getDb().prepare("INSERT INTO shop_settings(id, data) VALUES(1, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data").run(JSON.stringify(settings));
    const statement = getDb().prepare("INSERT INTO notifications(id, order_id, is_read, created_at, data) VALUES(?, ?, ?, ?, ?)");
    notifications.forEach((notification) => statement.run(notification.id, notification.orderId, Number(notification.read), notification.createdAt, JSON.stringify(notification)));
  });
}
