import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildCatalog } from "../scripts/lib/build-catalog.mjs";
import { deduplicateProductImages } from "../scripts/lib/catalog-images.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const [snapshot, previous, generated] = await Promise.all(
  ["panjabishop-catalog.json", "panjabishop-images.json", "catalog.generated.json"].map(
    async (file) => JSON.parse(await fs.readFile(path.join(root, "lib/data", file), "utf8")),
  ),
);

function oneProduct(change = () => {}) {
  const input = { ...snapshot, products: [structuredClone(snapshot.products[0])] };
  change(input.products[0]);
  return input;
}

test("recorded source rebuilds the exact catalog and manifest using local images", async () => {
  const input = structuredClone(snapshot);
  const manifestInput = structuredClone(previous);
  const { catalog, manifest } = buildCatalog(input, manifestInput);
  assert.deepEqual(input, snapshot);
  assert.deepEqual(manifestInput, previous);
  await deduplicateProductImages(root, catalog, manifest);
  assert.deepEqual(catalog, generated);
  assert.deepEqual(manifest, previous);
});

test("catalog transformation rejects missing data and invalid financial or stock fields", () => {
  assert.throws(() => buildCatalog({}, previous), /products array/);
  for (const change of [
    (product) => { product.price = Number.NaN; },
    (product) => { product.price = -1; },
    (product) => { product.compareAtPrice = Infinity; },
    (product) => { product.images = []; },
    (product) => { product.images = ["file:///tmp/photo"]; },
    (product) => { product.categoryHandles = ["unknown"]; },
    (product) => { product.handle = "../unsafe"; },
    (product) => { product.title = " "; },
    (product) => { product.variants = []; },
    (product) => { product.variants[0].id = ""; },
    (product) => { product.variants[0].price = Number.NaN; },
    (product) => { product.variants[0].available = "true"; },
  ]) {
    assert.throws(() => buildCatalog(oneProduct(change), previous), /[Ii]ncomplete|[Ii]nvalid/);
  }
});

test("duplicate product handles, product IDs and variant IDs are rejected", () => {
  const duplicateHandle = oneProduct();
  duplicateHandle.products.push(structuredClone(duplicateHandle.products[0]));
  assert.throws(() => buildCatalog(duplicateHandle, previous), /Duplicate product ps-/);

  const duplicateId = structuredClone(duplicateHandle);
  duplicateId.products[1].handle = "another-product";
  assert.throws(() => buildCatalog(duplicateId, previous), /Duplicate product ID/);

  const duplicateVariant = structuredClone(duplicateId);
  duplicateVariant.products[1].id = "another-id";
  assert.throws(() => buildCatalog(duplicateVariant, previous), /Duplicate variant/);
});

test("source values are escaped, gallery URLs deduplicated and categories mapped once", () => {
  const input = oneProduct((product) => {
    product.title = ' A & B <special> "edition" ';
    product.categoryHandles.push("premium-panjabi");
    product.images.push(product.images[0]);
    product.variants[0].price = product.price + 500;
  });
  const { catalog, manifest } = buildCatalog(input, previous);
  const [product] = catalog.products;
  assert.match(product.descriptionHtml, /A &amp; B &lt;special&gt; &quot;edition&quot;/);
  assert.equal(product.priceMax, input.products[0].price + 500);
  assert.deepEqual(catalog.collectionProductMap["premium-panjabi"], [product.handle]);
  assert.equal(manifest.products[0].images.length, new Set(input.products[0].images).size);
});
