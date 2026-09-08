import assert from "node:assert/strict";
import test from "node:test";
import {
  isStorageChange,
  parseStoredHandles,
  readStorage,
  writeStorage,
} from "../lib/store/storage.ts";

function mockWindow(t, value) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "window", original);
    else delete globalThis.window;
  });
}

test("stored handles reject invalid data and retain unique valid handles in order", () => {
  for (const value of [null, "broken json", "{}", "null"]) {
    assert.deepEqual(parseStoredHandles(value), []);
  }
  assert.deepEqual(
    parseStoredHandles('["blue",false,"",null,"blue","red","removed"]',
      (handle) => handle !== "removed"),
    ["blue", "red"],
  );
});

test("browser storage is optional during server rendering", () => {
  assert.equal(readStorage("cart"), null);
  assert.doesNotThrow(() => writeStorage("cart", "[]"));
});

test("blocked storage reads and writes do not escape into shopping interactions", (t) => {
  mockWindow(t, {
    get localStorage() {
      throw new Error("Storage access denied");
    },
  });
  assert.equal(readStorage("cart"), null);
  assert.doesNotThrow(() => writeStorage("cart", "[]"));
  assert.equal(isStorageChange({ key: "cart" }, "cart"), false);
});

test("storage writes skip unchanged values and tolerate exhausted quotas", (t) => {
  const values = new Map([["cart", "[]"]]);
  let writes = 0;
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem(key, value) {
      writes++;
      if (key === "full") throw new Error("Quota exceeded");
      values.set(key, value);
    },
  };
  mockWindow(t, { localStorage: storage });
  writeStorage("cart", "[]");
  assert.equal(writes, 0);
  writeStorage("cart", "[1]");
  assert.equal(readStorage("cart"), "[1]");
  assert.equal(writes, 1);
  assert.doesNotThrow(() => writeStorage("full", "value"));
  assert.equal(isStorageChange({ storageArea: storage, key: "cart" }, "cart"), true);
  assert.equal(isStorageChange({ storageArea: storage, key: null }, "cart"), true);
  assert.equal(isStorageChange({ storageArea: storage, key: "other" }, "cart"), false);
  assert.equal(isStorageChange({ storageArea: {}, key: "cart" }, "cart"), false);
});
