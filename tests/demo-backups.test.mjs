import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  createDemoBackup,
  deleteDemoBackup,
  getDemoBackups,
  importDemoBackup,
  restoreDemoBackup,
} from "../lib/demo/backups.ts";
import { getDemoSnapshot, resetDemoData } from "../lib/demo/store.ts";
import { saveSettings } from "../lib/demo/commands.ts";

const entries = new Map();
let storageFull = false;
const browser = new EventTarget();
browser.localStorage = {
  getItem: (key) => entries.get(key) ?? null,
  setItem: (key, value) => {
    if (storageFull) throw new DOMException("Quota full", "QuotaExceededError");
    entries.set(key, value);
  },
};
globalThis.window = browser;
const backupKey = "panjabi-demo-backups-v1";

beforeEach(() => {
  storageFull = false;
  entries.clear();
  resetDemoData();
});

test("demo snapshots preserve identity and restore shop state without replacing saved backups", async () => {
  const originalName = getDemoSnapshot().settings.name;
  const backup = createDemoBackup();
  const serialized = JSON.parse(entries.get(backupKey))[0];
  saveSettings({ name: "A changed demo shop" });
  restoreDemoBackup(backup.id);
  assert.equal(getDemoSnapshot().settings.name, originalName);
  assert.equal(getDemoBackups().length, 1);
  deleteDemoBackup(backup.id);
  const imported = await importDemoBackup(
    new File([JSON.stringify(serialized)], "backup.json", {
      type: "application/json",
    }),
  );
  assert.equal(imported.id, backup.id);
  assert.equal(imported.createdAt, backup.createdAt);
  assert.equal(imported.products, backup.products);
  assert.equal(imported.orders, backup.orders);
});

test("malformed backup imports do not replace active data or save a snapshot", async () => {
  const original = getDemoSnapshot();
  const valid = createDemoBackup();
  const malformed = JSON.parse(entries.get(backupKey))[0];
  deleteDemoBackup(valid.id);
  malformed.snapshot.orders[0].total += 123;
  await assert.rejects(() =>
    importDemoBackup(new File([JSON.stringify(malformed)], "bad.json")),
  );
  assert.equal(getDemoBackups().length, 0);
  assert.equal(getDemoSnapshot(), original);
});

test("backup quota failures and the five-snapshot limit keep existing snapshots intact", () => {
  createDemoBackup();
  const beforeQuota = entries.get(backupKey);
  storageFull = true;
  assert.throws(createDemoBackup, /storage is full/);
  assert.equal(entries.get(backupKey), beforeQuota);
  storageFull = false;
  for (let count = 1; count < 5; count += 1) createDemoBackup();
  const beforeLimit = entries.get(backupKey);
  assert.throws(createDemoBackup, /up to 5/);
  assert.equal(entries.get(backupKey), beforeLimit);
  assert.equal(getDemoBackups().length, 5);
});
