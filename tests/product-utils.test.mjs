import assert from "node:assert/strict";
import test from "node:test";
import { filterProducts, getSizeCounts } from "../lib/utils/products.ts";

const catalog = [
  {
    handle: "two-colors",
    productType: "Shirt",
    price: 100,
    variants: [
      { size: "M", color: "Black", available: true },
      { size: "M", color: "Blue", available: true },
      { size: "L", color: "Black", available: false },
    ],
  },
  {
    handle: "another-product",
    productType: "Panjabi",
    price: 200,
    variants: [
      { size: "M", color: "White", available: true },
      { size: "L", color: "White", available: true },
      { size: "", color: "White", available: true },
    ],
  },
];

test("size counts count matching products, not colors or unavailable variants", () => {
  assert.deepEqual(getSizeCounts(catalog), { M: 2, L: 1 });
  for (const [size, count] of Object.entries(getSizeCounts(catalog))) {
    assert.equal(
      filterProducts(catalog, { sizes: [size], minPrice: null, maxPrice: null })
        .length,
      count,
    );
  }
});

test("product types combine with size and price filters", () => {
  const filters = {
    productTypes: ["Shirt", "Panjabi"],
    sizes: ["L"],
    minPrice: 100,
    maxPrice: 200,
  };
  assert.deepEqual(
    filterProducts(catalog, filters).map((product) => product.handle),
    ["another-product"],
  );
  assert.deepEqual(
    filterProducts(catalog, { ...filters, productTypes: ["Shirt"] }),
    [],
  );
  assert.equal(
    filterProducts(catalog, { ...filters, productTypes: [], sizes: [] }).length,
    2,
  );
});

test("size and price filters combine without admitting sold-out sizes", () => {
  assert.deepEqual(
    filterProducts(catalog, { sizes: ["L"], minPrice: null, maxPrice: 150 }),
    [],
  );
  assert.deepEqual(
    filterProducts(catalog, { sizes: ["M"], minPrice: 200, maxPrice: 200 }).map(
      (product) => product.handle,
    ),
    ["another-product"],
  );
});
