/** Storage is optional: blocked cookies, private browsing and quotas must not break shopping. */
export function readStorage(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    if (typeof window !== "undefined" && readStorage(key) !== value) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // State remains available in memory when persistence is unavailable.
  }
}

export function isStorageChange(event: StorageEvent, key: string): boolean {
  try {
    return (
      event.storageArea === window.localStorage &&
      (event.key === key || event.key === null)
    );
  } catch {
    return false;
  }
}

export function parseStoredHandles(
  stored: string | null,
  isValid: (handle: string) => boolean = () => true,
): string[] {
  try {
    const parsed: unknown = JSON.parse(stored ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter(
      (handle): handle is string =>
        typeof handle === "string" && handle.length > 0 && isValid(handle),
    ))];
  } catch {
    return [];
  }
}
