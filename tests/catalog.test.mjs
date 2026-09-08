import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  collectionProductMap,
  getProductByHandle,
  getProductsByCollection,
  products,
  searchProducts,
} from "../lib/data/products.ts";

const snapshot = JSON.parse(
  fs.readFileSync(
    new URL("../lib/data/panjabishop-catalog.json", import.meta.url),
    "utf8",
  ),
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

test("product lookup resolves source handles and rejects unknown handles", () => {
  for (const product of products) {
    assert.equal(getProductByHandle(product.handle), product);
  }
  assert.equal(getProductByHandle("missing-product"), undefined);
  assert.equal(getProductByHandle("toString"), undefined);
});

test("collection queries preserve exact membership and catalog order", () => {
  for (const [handle, members] of Object.entries(collectionProductMap)) {
    assert.deepEqual(
      getProductsByCollection(handle),
      products.filter((product) => members.includes(product.handle)),
    );
    for (const member of members) assert.ok(getProductByHandle(member), member);
  }
  assert.deepEqual(getProductsByCollection("unknown-collection"), []);
  assert.deepEqual(getProductsByCollection("toString"), []);
  assert.deepEqual(getProductsByCollection(""), []);
});

test("sorting or clearing a collection result cannot mutate subsequent queries", () => {
  const original = getProductsByCollection("men");
  assert.ok(original.length > 1);
  const mutableResult = getProductsByCollection("men");
  mutableResult.reverse();
  assert.deepEqual(getProductsByCollection("men"), original);
  mutableResult.length = 0;
  assert.deepEqual(getProductsByCollection("men"), original);
});

test("search matches title, type and tags, ignoring case and surrounding spaces", () => {
  const queries = ["WHITE", " premium panjabi ", "waistcoat", "no-such-product"];
  for (const query of queries) {
    const needle = query.trim().toLowerCase();
    assert.deepEqual(
      searchProducts(query),
      products.filter((product) =>
        [product.title, product.productType, ...product.tags].some((value) =>
          value.toLowerCase().includes(needle),
        ),
      ),
    );
  }
  assert.deepEqual(searchProducts(" \n "), products.slice(0, 12));
  const emptyQueryResults = searchProducts("");
  emptyQueryResults.length = 0;
  assert.deepEqual(searchProducts(""), products.slice(0, 12));
});
