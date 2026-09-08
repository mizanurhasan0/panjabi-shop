import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const connections = globalThis as typeof globalThis & {
  shopDatabases?: Map<string, DatabaseSync>;
};

export function getDataDirectory(): string {
  return resolve(process.env.SHOP_DATA_DIR || join(process.cwd(), "data"));
}

/** A local persistent volume is required when deploying this SQLite-backed shop. */
export function getDb(): DatabaseSync {
  const directory = getDataDirectory();
  connections.shopDatabases ??= new Map();
  const existing = connections.shopDatabases.get(directory);
  if (existing) return existing;

  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(join(directory, "shop.sqlite"));
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS shop_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, handle TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
      stock INTEGER NOT NULL CHECK(stock >= 0), active INTEGER NOT NULL,
      updated_at TEXT NOT NULL, data TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS products_active_updated ON products(active, updated_at DESC);
    CREATE INDEX IF NOT EXISTS products_stock ON products(active, stock);
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL,
      stage TEXT NOT NULL, created_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0, request_key TEXT UNIQUE, request_hash TEXT, data TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS orders_stage_created ON orders(deleted, stage, created_at DESC);
    CREATE INDEX IF NOT EXISTS orders_created ON orders(deleted, created_at DESC);
    CREATE TABLE IF NOT EXISTS shop_settings (id INTEGER PRIMARY KEY CHECK(id = 1), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, order_id TEXT, is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, data TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS notifications_read_created ON notifications(is_read, created_at DESC);
  `);
  if (!database.prepare("PRAGMA table_info(orders)").all().some((column) => column.name === "request_hash")) {
    database.exec("ALTER TABLE orders ADD COLUMN request_hash TEXT");
  }
  connections.shopDatabases.set(directory, database);
  return database;
}

/** SQLite serializes writers before any stock is read, preventing overselling. */
export function transaction<T>(work: (database: DatabaseSync) => T): T {
  const database = getDb();
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = work(database);
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
