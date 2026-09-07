import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const snapshot = JSON.parse(
  fs.readFileSync(
    new URL("../lib/data/panjabishop-catalog.json", import.meta.url),
    "utf8",
  ),
);
const generated = fs.readFileSync(
  new URL("../lib/data/products.ts", import.meta.url),
  "utf8",
);
const products = JSON.parse(
  generated.match(/export const products: Product\[\] = ([\s\S]*?);\n/)[1],
);
const featured = JSON.parse(
  fs.readFileSync(
    new URL("../lib/data/search-config.json", import.meta.url),
    "utf8",
  ),
);

test("every displayed product uses the selected source identity, price and stock", () => {
  assert.equal(products.length, snapshot.products.length);
  const variantIds = new Set();
  for (const product of products) {
    const source = snapshot.products.find(
      (entry) => `ps-${entry.handle}` === product.handle,
    );
    assert.ok(source, `Old or unknown product: ${product.handle}`);
    assert.equal(product.vendor, "Panjabi Shop");
    assert.equal(product.price, source.price);
    assert.ok(product.title.includes(source.title.trim()));
    assert.deepEqual(product.colors, source.color ? [source.color] : []);
    for (const variant of product.variants) {
      const original = source.variants.find(
        (entry) => `ps-${entry.id}` === variant.id,
      );
      assert.ok(original);
      assert.equal(variant.price, original.price);
      assert.equal(variant.available, original.available);
      assert.ok(!variantIds.has(variant.id));
      variantIds.add(variant.id);
    }
  }
});

test("all card/gallery images and featured search products belong to the new catalog", () => {
  for (const product of products) {
    assert.ok(product.images.length > 0);
    for (const image of product.images) {
      assert.ok(image.startsWith("/images/panjabishop/products/"));
      assert.ok(
        fs.existsSync(new URL(`../public${image}`, import.meta.url)),
        image,
      );
    }
  }
  for (const item of featured.featuredProducts)
    assert.ok(products.some((product) => product.handle === item.handle));
});
