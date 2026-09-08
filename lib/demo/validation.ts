import type {
  AdminProduct,
  Notification,
  Order,
  OrderLine,
  ShopSettings,
} from "../admin/types.ts";
import {
  orderStages,
  orderSources,
  paymentMethods,
  paymentStatuses,
} from "../admin/types.ts";
import {
  booleanValue,
  emailValue,
  enumValue,
  money,
  numberValue,
  record,
  textList,
  textValue,
  ValidationError,
} from "../admin/validation.ts";
import { defaultShopSettings } from "./seed.ts";
import type { DemoSnapshot } from "./types.ts";
export const createId = () => crypto.randomUUID();
export const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
export function imageUrl(value: unknown, label: string): string {
  const url = textValue(value, label, { max: 2_000_000 });
  if (!url || url === "/favicon.ico") return url;
  if (/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(url))
    return url;
  if (
    url.startsWith("/images/") &&
    !/[\\%?#\u0000-\u001f]/.test(url) &&
    !url.split("/").some((part) => part === "." || part === "..") &&
    /\.(?:jpe?g|png|webp|avif|gif|svg|ico)$/i.test(url)
  )
    return url;
  throw new ValidationError(
    `${label} must be a local /images/ path or an image selected from your device.`,
  );
}
function requiredId(value: unknown, label = "ID"): string {
  return textValue(value, label, { required: true, max: 200 });
}
function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\u0980-\u09ff]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeProduct(
  input: unknown,
  existing?: AdminProduct | null,
  settings = defaultShopSettings,
): AdminProduct {
  const value = record(input, "Product");
  const now = new Date().toISOString();
  const title = textValue(value.title ?? existing?.title, "Product title", {
    required: true,
    max: 200,
  });
  const id = existing?.id ?? createId();
  const handle = slug(
    textValue(value.handle ?? existing?.handle ?? title, "Product handle", {
      required: true,
      max: 200,
    }),
  );
  if (!handle)
    throw new ValidationError(
      "Enter a product handle with letters or numbers.",
    );
  const price = money(value.price, "Selling price", existing?.price ?? 0);
  const costPrice = money(
    value.costPrice,
    "Cost price",
    existing?.costPrice ?? 0,
  );
  const stock = numberValue(value.stock, "Stock", {
    integer: true,
    max: 1_000_000,
    fallback: existing?.stock ?? 0,
  });
  const active = booleanValue(value.active, "Active", existing?.active ?? true);
  const colors = textList(value.colors, "Colors", existing?.colors ?? []);
  const sizes = textList(value.sizes, "Sizes", existing?.sizes ?? []);
  const images =
    value.images === undefined
      ? (existing?.images ?? [])
      : (() => {
          if (!Array.isArray(value.images) || value.images.length > 20)
            throw new ValidationError("Use up to 20 product images.");
          return value.images
            .map((url) => imageUrl(url, "Product image"))
            .filter(Boolean);
        })();
  if (active && !images.length)
    throw new ValidationError(
      "Add at least one image before making a product active.",
    );
  const compareAtPrice =
    value.compareAtPrice === null || value.compareAtPrice === ""
      ? null
      : value.compareAtPrice === undefined
        ? (existing?.compareAtPrice ?? null)
        : money(value.compareAtPrice, "Compare at price");
  if (compareAtPrice !== null && compareAtPrice < price)
    throw new ValidationError(
      "Compare at price must be at least the selling price.",
    );
  let variants = existing?.variants ?? [];
  if (value.variants !== undefined) {
    if (!Array.isArray(value.variants) || value.variants.length > 200)
      throw new ValidationError("Use up to 200 product variants.");
    const ids = new Set<string>();
    variants = value.variants.map((entry, index) => {
      const variant = record(entry, "Variant");
      const variantId = textValue(
        variant.id ?? `${id}-${index + 1}`,
        "Variant ID",
        { required: true, max: 200 },
      );
      if (ids.has(variantId))
        throw new ValidationError("Variant IDs must be unique.");
      ids.add(variantId);
      return {
        id: variantId,
        title: textValue(variant.title ?? title, "Variant title", { max: 200 }),
        sku: textValue(variant.sku, "SKU", { max: 100 }),
        price: money(variant.price, "Variant price", price),
        compareAtPrice:
          variant.compareAtPrice == null
            ? null
            : money(variant.compareAtPrice, "Variant compare at price"),
        color: textValue(variant.color, "Color", { max: 100 }),
        size: textValue(variant.size, "Size", { max: 100 }),
        available: booleanValue(
          variant.available,
          "Variant availability",
          true,
        ),
      };
    });
  } else if (
    existing &&
    (price !== existing.price || compareAtPrice !== existing.compareAtPrice)
  ) {
    variants = variants.map((variant) => ({
      ...variant,
      price: price !== existing.price ? price : variant.price,
      compareAtPrice,
    }));
  }
  const optionsChanged =
    existing &&
    value.variants === undefined &&
    ((value.colors !== undefined &&
      JSON.stringify(colors) !== JSON.stringify(existing.colors)) ||
      (value.sizes !== undefined &&
        JSON.stringify(sizes) !== JSON.stringify(existing.sizes)));
  if (!variants.length || optionsChanged) {
    if (Math.max(colors.length, 1) * Math.max(sizes.length, 1) > 200)
      throw new ValidationError("Use up to 200 color and size combinations.");
    const previousVariants = variants;
    variants = (colors.length ? colors : [""]).flatMap((color) =>
      (sizes.length ? sizes : [""]).map((size) => ({
        id: `${id}-${createId().slice(0, 8)}`,
        title: [color, size].filter(Boolean).join(" / ") || "Default",
        sku: textValue(value.sku, "SKU", { max: 100 }),
        price,
        compareAtPrice,
        color,
        size,
        available: true,
        ...previousVariants.find(
          (variant) => variant.color === color && variant.size === size,
        ),
      })),
    );
  }
  const description = textValue(
    value.description ?? existing?.description,
    "Description",
    { max: 20_000 },
  );
  return {
    id,
    handle,
    title,
    vendor: textValue(
      value.vendor ?? existing?.vendor ?? settings.name,
      "Vendor",
      { max: 200 },
    ),
    productType: textValue(
      value.productType ?? existing?.productType ?? "Panjabi",
      "Product type",
      { max: 100 },
    ),
    description,
    descriptionHtml: description
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>"),
    tags: textList(value.tags, "Tags", existing?.tags ?? []),
    collectionHandle: textValue(
      value.collectionHandle ?? existing?.collectionHandle ?? "men",
      "Collection",
      { max: 100 },
    ),
    price,
    priceMax: Math.max(price, ...variants.map((variant) => variant.price)),
    priceFormatted: `Tk ${price.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    compareAtPrice,
    images,
    colors: [
      ...new Set(variants.map((variant) => variant.color).filter(Boolean)),
    ],
    sizes: [
      ...new Set(variants.map((variant) => variant.size).filter(Boolean)),
    ],
    variants,
    available:
      active && stock > 0 && variants.some((variant) => variant.available),
    isNew: booleanValue(value.isNew, "New product", existing?.isNew ?? true),
    createdAt: existing?.createdAt ?? now,
    costPrice,
    stock,
    active,
    lowStockThreshold: numberValue(
      value.lowStockThreshold,
      "Low stock threshold",
      {
        integer: true,
        max: 1_000_000,
        fallback: existing?.lowStockThreshold ?? settings.lowStockThreshold,
      },
    ),
    updatedAt: now,
  };
}

export function normalizeSettings(
  input: unknown,
  previous = defaultShopSettings,
): ShopSettings {
  const value = record(input, "Shop settings");
  const logo = imageUrl(value.logo ?? previous.logo, "Logo");
  if (!logo) throw new ValidationError("Add a shop logo before saving.");
  return {
    name: textValue(value.name ?? previous.name, "Shop name", {
      required: true,
      max: 100,
    }),
    tagline: textValue(value.tagline ?? previous.tagline, "Tagline", {
      max: 200,
    }),
    logo,
    icon: imageUrl(value.icon ?? previous.icon, "Shop icon"),
    email: emailValue(value.email ?? previous.email),
    phone: textValue(value.phone ?? previous.phone, "Phone", { max: 40 }),
    address: textValue(value.address ?? previous.address, "Shop address", {
      max: 1000,
    }),
    currency: "BDT",
    timezone: "Asia/Dhaka",
    lowStockThreshold: numberValue(
      value.lowStockThreshold,
      "Low stock threshold",
      { fallback: previous.lowStockThreshold, integer: true, max: 1_000_000 },
    ),
  };
}

function timestamp(value: unknown, label: string): string {
  const result = textValue(value, label, { required: true, max: 40 });
  if (!Number.isFinite(new Date(result).getTime()))
    throw new ValidationError(`${label} must be a valid date.`);
  return new Date(result).toISOString();
}

export function validateDemoSnapshot(input: unknown): DemoSnapshot {
  const value = record(input, "Backup");
  if (value.version !== 1)
    throw new ValidationError("This backup version is not supported.");
  for (const key of ["products", "orders", "notifications"] as const) {
    if (!Array.isArray(value[key]) || value[key].length > 100_000)
      throw new ValidationError(`Invalid backup ${key}.`);
  }
  const settings = normalizeSettings(value.settings);
  const productIds = new Set<string>();
  const handles = new Set<string>();
  const products = (value.products as unknown[]).map((entry) => {
    const raw = record(entry, "Backup product");
    const id = requiredId(raw.id, "Product ID");
    const product = normalizeProduct(raw, undefined, settings);
    if (productIds.has(id) || handles.has(product.handle))
      throw new ValidationError("Backup contains duplicate products.");
    productIds.add(id);
    handles.add(product.handle);
    return {
      ...product,
      id,
      createdAt: timestamp(raw.createdAt, "Product creation date"),
      updatedAt: timestamp(raw.updatedAt, "Product update date"),
    };
  });
  const orderIds = new Set<string>();
  const orderNumbers = new Set<string>();
  const orders = (value.orders as unknown[]).map((entry) => {
    const raw = record(entry, "Backup order");
    const id = requiredId(raw.id, "Order ID");
    const number = requiredId(raw.number, "Order number");
    if (
      !/^PS-\d+$/.test(number) ||
      !Number.isSafeInteger(Number(number.slice(3))) ||
      orderIds.has(id) ||
      orderNumbers.has(number)
    )
      throw new ValidationError(
        "Backup contains invalid or duplicate order numbers.",
      );
    orderIds.add(id);
    orderNumbers.add(number);
    if (
      !Array.isArray(raw.items) ||
      !raw.items.length ||
      raw.items.length > 100
    )
      throw new ValidationError("Backup order items are invalid.");
    const items: OrderLine[] = raw.items.map((entry) => {
      const line = record(entry, "Backup order item");
      const productId =
        line.productId === null
          ? null
          : requiredId(line.productId, "Product ID");
      if (productId && !productIds.has(productId))
        throw new ValidationError("Backup order refers to an unknown product.");
      return {
        id: requiredId(line.id),
        productId,
        variantId: line.variantId == null ? null : requiredId(line.variantId),
        title: textValue(line.title, "Item title", {
          required: true,
          max: 200,
        }),
        sku: textValue(line.sku, "SKU", { max: 100 }),
        variant: textValue(line.variant, "Variant", { max: 200 }),
        quantity: numberValue(line.quantity, "Quantity", {
          min: 1,
          max: 10_000,
          integer: true,
        }),
        price: money(line.price, "Item price"),
        costPrice: money(line.costPrice, "Item cost"),
        customizations: textValue(line.customizations, "Customizations", {
          max: 2000,
        }),
      };
    });
    const subtotal = round(
      items.reduce((sum, line) => sum + line.quantity * line.price, 0),
    );
    const discount = money(raw.discount, "Discount");
    const shippingCharge = money(raw.shippingCharge, "Shipping charge");
    const deliveryCost = money(raw.deliveryCost, "Delivery cost");
    const additionalCost = money(raw.additionalCost, "Additional cost");
    const total = round(subtotal - discount + shippingCharge);
    const profit = round(
      total -
        items.reduce((sum, line) => sum + line.quantity * line.costPrice, 0) -
        deliveryCost -
        additionalCost,
    );
    if (
      discount > subtotal ||
      raw.subtotal !== subtotal ||
      raw.total !== total ||
      raw.profit !== profit
    )
      throw new ValidationError("Backup order totals do not match its items.");
    const stage = enumValue(raw.stage, orderStages, "Order stage");
    const stockDeducted = booleanValue(
      raw.stockDeducted,
      "Stock reservation",
      false,
    );
    if ((stage === "cancelled" || stage === "returned") && stockDeducted)
      throw new ValidationError(
        "Backup contains an invalid stock reservation.",
      );
    if (
      !["cancelled", "returned"].includes(stage) &&
      items.some((line) => line.productId) &&
      !stockDeducted
    )
      throw new ValidationError(
        "Backup is missing an order stock reservation.",
      );
    if (
      !Array.isArray(raw.history) ||
      !raw.history.length ||
      raw.history.length > 10_000
    )
      throw new ValidationError("Backup order history is invalid.");
    const history = raw.history.map((entry) => {
      const event = record(entry, "Order event");
      return {
        id: requiredId(event.id),
        stage: enumValue(event.stage, orderStages, "Event stage"),
        note: textValue(event.note, "Event note", { max: 2500 }),
        createdAt: timestamp(event.createdAt, "Event date"),
      };
    });
    if (history.at(-1)?.stage !== stage)
      throw new ValidationError(
        "Backup order history does not match its current stage.",
      );
    const order: Order = {
      id,
      number,
      customerName: textValue(raw.customerName, "Customer name", {
        required: true,
        max: 200,
      }),
      customerPhone: textValue(raw.customerPhone, "Customer phone", {
        required: true,
        max: 40,
      }),
      customerEmail: emailValue(raw.customerEmail),
      address: textValue(raw.address, "Address", { required: true, max: 2000 }),
      notes: textValue(raw.notes, "Notes", { max: 5000 }),
      source: enumValue(raw.source, orderSources, "Order source"),
      stage,
      paymentStatus: enumValue(
        raw.paymentStatus,
        paymentStatuses,
        "Payment status",
      ),
      paymentMethod: enumValue(
        raw.paymentMethod,
        paymentMethods,
        "Payment method",
      ),
      items,
      subtotal,
      discount,
      shippingCharge,
      deliveryCost,
      additionalCost,
      total,
      profit,
      stockDeducted,
      history,
      createdAt: timestamp(raw.createdAt, "Order creation date"),
      updatedAt: timestamp(raw.updatedAt, "Order update date"),
    };
    return order;
  });
  const notificationIds = new Set<string>();
  const notifications: Notification[] = (value.notifications as unknown[]).map(
    (entry) => {
      const raw = record(entry, "Notification");
      const id = requiredId(raw.id);
      const orderId = raw.orderId == null ? null : requiredId(raw.orderId);
      if (notificationIds.has(id) || (orderId && !orderIds.has(orderId)))
        throw new ValidationError("Backup notifications are invalid.");
      notificationIds.add(id);
      return {
        id,
        orderId,
        title: textValue(raw.title, "Notification title", {
          required: true,
          max: 200,
        }),
        message: textValue(raw.message, "Notification message", { max: 1000 }),
        read: booleanValue(raw.read, "Read", false),
        createdAt: timestamp(raw.createdAt, "Notification date"),
      };
    },
  );
  return { version: 1, products, orders, settings, notifications };
}
