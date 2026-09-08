#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog } from "./lib/build-catalog.mjs";
import { deduplicateProductImages } from "./lib/catalog-images.mjs";
import { downloadImages } from "./lib/download-images.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const dataPath = path.join(root, "lib/data");
const manifestFile = path.join(dataPath, "panjabishop-images.json");
const [snapshot, previous] = await Promise.all(
  [path.join(dataPath, "panjabishop-catalog.json"), manifestFile].map(async (file) =>
    JSON.parse(await fs.readFile(file, "utf8")),
  ),
);
const { catalog, manifest } = buildCatalog(snapshot, previous);

await downloadImages(root, [
  ...manifest.banners,
  ...manifest.categories,
  ...manifest.products.flatMap((product) => product.images),
]);
await deduplicateProductImages(root, catalog, manifest);

await fs.writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
await fs.writeFile(
  path.join(dataPath, "catalog.generated.json"),
  `${JSON.stringify(catalog, null, 2)}\n`,
);
console.log(
  `Updated all product surfaces: ${catalog.products.length} Panjabi Shop products, ${manifest.products.reduce((count, product) => count + product.images.length, 0)} product photos.`,
);
