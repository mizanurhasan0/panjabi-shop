import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

export async function deduplicateProductImages(root, catalog, manifest) {
  const { products } = catalog;
  // Some source galleries publish the same photo under multiple URLs.
  for (let index = 0; index < manifest.products.length; index++) {
    const seenPhotos = new Set();
    const unique = [];
    for (const image of manifest.products[index].images) {
      const bytes = await fs.readFile(path.join(root, "public", image.file));
      const hash = createHash("sha256").update(bytes).digest("hex");
      if (seenPhotos.has(hash)) continue;
      seenPhotos.add(hash);
      unique.push(image);
    }
    manifest.products[index].images = unique;
    products[index].images = unique.map((image) => image.file);
  }
}
