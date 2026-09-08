import type { BackupInfo } from "../admin/types";
import type { DemoSnapshot } from "./types";
import { getDemoSnapshot, replaceDemoSnapshot } from "./store.ts";
import { validateDemoSnapshot } from "./validation.ts";
import { downloadBlob } from "./downloads.ts";

export const DEMO_BACKUP_LIMIT = 5;
const MAX_DEMO_BACKUP_BYTES = 15 * 1024 * 1024;
const STORAGE_KEY = "panjabi-demo-backups-v1";
const BACKUP_ID =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

interface DemoBackupFile {
  format: "panjabi-demo-backup";
  version: 1;
  id: string;
  createdAt: string;
  snapshot: DemoSnapshot;
}

function storage(): Storage {
  try {
    if (typeof window !== "undefined") return window.localStorage;
  } catch {
    /* Give a useful message for blocked or private browser storage. */
  }
  throw new Error(
    "Browser storage is unavailable. Enable local storage to manage demo backups.",
  );
}

function validateBackup(value: unknown): DemoBackupFile {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("This is not a valid demo backup.");
  const backup = value as Partial<DemoBackupFile>;
  if (
    backup.format !== "panjabi-demo-backup" ||
    backup.version !== 1 ||
    typeof backup.id !== "string" ||
    !BACKUP_ID.test(backup.id) ||
    typeof backup.createdAt !== "string" ||
    !Number.isFinite(Date.parse(backup.createdAt))
  ) {
    throw new Error(
      "This backup is invalid or uses an unsupported version. Choose a backup downloaded from this demo.",
    );
  }
  return {
    format: backup.format,
    version: backup.version,
    id: backup.id,
    createdAt: backup.createdAt,
    snapshot: validateDemoSnapshot(backup.snapshot),
  };
}

function readBackups(): DemoBackupFile[] {
  const raw = storage().getItem(STORAGE_KEY);
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(
      "Saved demo backups are unreadable. Your active shop data has not changed.",
    );
  }
  if (!Array.isArray(value) || value.length > DEMO_BACKUP_LIMIT)
    throw new Error(
      "Saved demo backups are invalid. Your active shop data has not changed.",
    );
  const backups = value.map(validateBackup);
  if (new Set(backups.map((backup) => backup.id)).size !== backups.length)
    throw new Error("Saved demo backups contain duplicate IDs.");
  return backups.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

function writeBackups(backups: DemoBackupFile[]): void {
  try {
    storage().setItem(STORAGE_KEY, JSON.stringify(backups));
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      throw new Error(
        "Browser storage is full. Download and delete an older backup, or remove unused product images, then try again. Your existing data is unchanged.",
      );
    }
    throw new Error(
      "The browser could not save this backup. Check your storage settings and try again.",
    );
  }
  window.dispatchEvent(new Event("panjabi:demo-backups-updated"));
}

function info(backup: DemoBackupFile): BackupInfo {
  return {
    id: backup.id,
    createdAt: backup.createdAt,
    bytes: new TextEncoder().encode(JSON.stringify(backup)).byteLength,
    products: backup.snapshot.products.length,
    orders: backup.snapshot.orders.length,
  };
}

function findBackup(id: string): DemoBackupFile {
  const backup = readBackups().find((item) => item.id === id);
  if (!backup)
    throw new Error(
      "This backup could not be found. Refresh the list and try again.",
    );
  return backup;
}

function addBackup(backup: DemoBackupFile): BackupInfo {
  const current = readBackups();
  if (current.some((item) => item.id === backup.id))
    throw new Error("This backup is already saved in your browser.");
  if (current.length >= DEMO_BACKUP_LIMIT)
    throw new Error(
      "You can keep up to 5 demo backups. Download and delete an older backup before adding another.",
    );
  writeBackups([backup, ...current]);
  return info(backup);
}

export function getDemoBackups(): BackupInfo[] {
  return readBackups().map(info);
}

export function createDemoBackup(): BackupInfo {
  const snapshot = getDemoSnapshot();
  return addBackup({
    format: "panjabi-demo-backup",
    version: 1,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    snapshot: validateDemoSnapshot(snapshot),
  });
}

export function downloadDemoBackup(id: string): void {
  const backup = findBackup(id);
  downloadBlob(
    new Blob([JSON.stringify(backup)], { type: "application/json" }),
    `panjabi-demo-backup-${backup.createdAt.slice(0, 10)}-${backup.id.slice(0, 8)}.json`,
  );
}

export function deleteDemoBackup(id: string): void {
  const current = readBackups();
  if (!current.some((backup) => backup.id === id))
    throw new Error("This backup has already been deleted.");
  writeBackups(current.filter((backup) => backup.id !== id));
}

export function restoreDemoBackup(id: string): void {
  replaceDemoSnapshot(findBackup(id).snapshot);
}

export async function importDemoBackup(file: File): Promise<BackupInfo> {
  if (file.size === 0 || file.size > MAX_DEMO_BACKUP_BYTES)
    throw new Error("Choose a demo JSON backup smaller than 15 MB.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error(
      "This file is not readable JSON. Choose a backup downloaded from this demo.",
    );
  }
  return addBackup(validateBackup(parsed));
}
