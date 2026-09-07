import fs from "node:fs";

export const imageManifestUrl = new URL(
  "../../lib/data/panjabishop-images.json",
  import.meta.url,
);

export function readImageManifest() {
  return JSON.parse(fs.readFileSync(imageManifestUrl, "utf8"));
}

/** Keep explicitly selected imagery when refreshing the source catalog. */
export function applyProductImageOverrides(
  products,
  manifest = readImageManifest(),
) {
  const overrides = new Map(
    manifest.products.map((product) => [
      product.handle,
      product.images.map((image) => image.file),
    ]),
  );
  return products.map((product) =>
    overrides.has(product.handle)
      ? { ...product, images: overrides.get(product.handle) }
      : product,
  );
}
