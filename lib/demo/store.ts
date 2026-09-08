import { createDemoSeed } from "./seed.ts";
import { validateDemoSnapshot } from "./validation.ts";
import type { DemoSnapshot } from "./types.ts";

const DEMO_STORAGE_KEY = "panjabi-demo-v1";
let snapshot: DemoSnapshot | null = null;
let storageWarning: string | null = null;
let memoryOnly = false;
const listeners = new Set<() => void>();

function announce() {
  listeners.forEach((listener) => listener());
}

function storage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function getDemoSnapshot(): DemoSnapshot {
  if (snapshot) return snapshot;
  if (typeof window === "undefined")
    throw new Error("Demo data is available after browser hydration.");
  try {
    const saved = storage()?.getItem(DEMO_STORAGE_KEY);
    if (saved) {
      try {
        snapshot = validateDemoSnapshot(JSON.parse(saved));
      } catch {
        storageWarning =
          "Saved demo data could not be read. Sample data is shown; reset the demo to replace the saved copy.";
      }
    }
  } catch {
    memoryOnly = true;
    storageWarning =
      "Browser storage is unavailable. Demo changes last only until this page is reloaded.";
  }
  snapshot ??= createDemoSeed();
  return snapshot;
}

export function getDemoServerSnapshot(): null {
  return null;
}
export function getDemoStorageWarning(): string | null {
  return storageWarning;
}

function syncFromStorage(event: StorageEvent) {
  if (event.key !== DEMO_STORAGE_KEY && event.key !== null) return;
  try {
    snapshot = event.newValue
      ? validateDemoSnapshot(JSON.parse(event.newValue))
      : createDemoSeed();
    storageWarning = null;
    announce();
  } catch {
    storageWarning =
      "Another tab saved invalid demo data. Your current view has been kept.";
    announce();
  }
}

export function subscribeDemo(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined")
    window.addEventListener("storage", syncFromStorage);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && typeof window !== "undefined")
      window.removeEventListener("storage", syncFromStorage);
  };
}

/** Persist before publishing so quota failures never look like a successful save. */
function commit(next: DemoSnapshot): void {
  if (typeof window === "undefined")
    throw new Error("Demo changes require a browser.");
  if (!memoryOnly) {
    try {
      storage()?.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new Error(
        "Demo storage is full or unavailable. Remove large images or allow browser storage, then try again. This change was not saved.",
      );
    }
    storageWarning = null;
  }
  snapshot = next;
  announce();
}

export function replaceDemoSnapshot(input: unknown): void {
  getDemoSnapshot();
  commit(validateDemoSnapshot(input));
}

export function updateDemoSnapshot<T>(mutate: (draft: DemoSnapshot) => T): T {
  const draft = structuredClone(getDemoSnapshot());
  const result = mutate(draft);
  commit(draft);
  return result;
}

export function resetDemoData(): void {
  getDemoSnapshot();
  commit(createDemoSeed());
}
