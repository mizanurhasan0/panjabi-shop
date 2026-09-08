import { createHash } from "node:crypto";

const categoryNames = {
  "premium-panjabi": "Premium Panjabi",
  "signature-panjabi": "Signature Panjabi",
  "printed-panjabi": "Printed Panjabi",
  "luxury-panjabi": "Luxury Panjabi",
  "sequence-panjabi": "Sequence Panjabi",
  waistcoat: "Waistcoat",
  "premium-trousers": "Trousers",
  watches: "Watch",
};
const formatPrice = (price) =>
  `Tk ${price.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const escapeHtml = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const isPrice = (value) => Number.isFinite(value) && value >= 0;
const hasIdentity = (value) =>
  (typeof value === "string" && value.trim() !== "") ||
  (typeof value === "number" && Number.isFinite(value));

function validateProduct(raw) {
  if (
    !raw ||
    typeof raw.handle !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(raw.handle) ||
    !hasIdentity(raw.id) ||
    !hasIdentity(raw.code) ||
    typeof raw.title !== "string" ||
    !raw.title.trim() ||
    (raw.color != null && typeof raw.color !== "string") ||
    !Array.isArray(raw.categoryHandles) ||
    !raw.categoryHandles.every((category) => typeof category === "string") ||
    !Array.isArray(raw.images) ||
    !raw.images.length ||
    !raw.images.every((url) => typeof url === "string" && /^https?:\/\//.test(url)) ||
    !isPrice(raw.price) ||
    (raw.compareAtPrice != null && !isPrice(raw.compareAtPrice)) ||
    !Array.isArray(raw.variants) ||
    !raw.variants.length
  ) {
    throw new Error(`Incomplete or invalid product ${raw?.handle ?? "(missing handle)"}`);
  }
  for (const variant of raw.variants) {
    if (
      !variant ||
      !hasIdentity(variant.id) ||
      !isPrice(variant.price) ||
      typeof variant.available !== "boolean" ||
      (variant.size != null && typeof variant.size !== "string")
    ) {
      throw new Error(`Invalid variant in product ${raw.handle}`);
    }
  }
}

/** Transform the recorded source without downloading or writing any files. */
export function buildCatalog(snapshot, previous) {
  if (!Array.isArray(snapshot?.products)) {
    throw new Error("Catalog snapshot must contain a products array");
  }
  const existingImages = new Map(
    previous.products
      .flatMap((product) => product.images)
      .map((image) => [image.url, image]),
  );
  const seenHandles = new Set();
  const seenProductIds = new Set();
  const seenVariants = new Set();
  const manifest = {
    source: snapshot.source,
    banners: previous.banners,
    categories: previous.categories ?? [],
    products: [],
  };
  const collectionProductMap = Object.fromEntries(
    ["fall-2026", "men", "men-s-panjabi", ...Object.keys(categoryNames)].map(
      (handle) => [handle, []],
    ),
  );

  const products = snapshot.products.map((raw) => {
    validateProduct(raw);
    const handle = `ps-${raw.handle}`;
    if (seenHandles.has(handle)) throw new Error(`Duplicate product ${handle}`);
    seenHandles.add(handle);
    const productId = `ps-${raw.id}`;
    if (seenProductIds.has(productId)) throw new Error(`Duplicate product ID ${productId}`);
    seenProductIds.add(productId);
    const categories = [...new Set(raw.categoryHandles)].filter((category) =>
      Object.hasOwn(categoryNames, category),
    );
    if (!categories.length)
      throw new Error(`Incomplete product ${handle}`);
    const images = [...new Set(raw.images)].map(
      (url) =>
        existingImages.get(url) ?? {
          file: `/images/panjabishop/products/${raw.handle}-${createHash("sha256").update(url).digest("hex").slice(0, 10)}.webp`,
          url,
        },
    );
    manifest.products.push({ handle, sourcePage: raw.sourceUrl, images });
    const color = raw.color?.trim() || "";
    const title = [raw.title.trim(), color].filter(Boolean).join(" — ");
    const variants = raw.variants.map((variant) => {
      const id = `ps-${variant.id}`;
      if (seenVariants.has(id)) throw new Error(`Duplicate variant ${id}`);
      seenVariants.add(id);
      return {
        id,
        title: [color, variant.size].filter(Boolean).join(" / "),
        sku: `${raw.code}${variant.size ? `-${variant.size}` : ""}`,
        price: variant.price,
        compareAtPrice: raw.compareAtPrice ?? null,
        color,
        size: variant.size ?? "",
        available: variant.available,
      };
    });
    const description = `${title}. Product code: ${raw.code}.`;
    for (const category of [
      "fall-2026",
      "men",
      ...categories,
      ...(categories.some((category) => category.endsWith("panjabi"))
        ? ["men-s-panjabi"]
        : []),
    ])
      collectionProductMap[category].push(handle);
    return {
      id: productId,
      handle,
      title,
      vendor: "Panjabi Shop",
      productType: categoryNames[categories[0]],
      description,
      descriptionHtml: `<p>${escapeHtml(description)}</p>`,
      tags: [
        ...categories.map((category) => categoryNames[category]),
        color,
      ].filter(Boolean),
      collectionHandle: categories[0],
      price: raw.price,
      priceMax: Math.max(raw.price, ...variants.map((variant) => variant.price)),
      priceFormatted: formatPrice(raw.price),
      compareAtPrice: raw.compareAtPrice ?? null,
      images: images.map((image) => image.file),
      colors: color ? [color] : [],
      sizes: [
        ...new Set(variants.map((variant) => variant.size).filter(Boolean)),
      ],
      variants,
      available: variants.some((variant) => variant.available),
      isNew: false,
      createdAt: raw.createdAt,
    };
  });
  return { catalog: { products, collectionProductMap }, manifest };
}
