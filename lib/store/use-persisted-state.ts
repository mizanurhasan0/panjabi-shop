"use client";

import { useEffect, useState } from "react";
import { isStorageChange, readStorage, writeStorage } from "./storage";

/** Pass stable codecs so subscriptions survive unrelated provider renders. */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  parse: (stored: string | null) => T,
  serialize: (value: T) => string = JSON.stringify,
) {
  const [value, setValue] = useState(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Match the server render before restoring browser state, and never persist
    // the initial value over the stored value before hydration finishes.
    const timer = window.setTimeout(() => {
      setValue(parse(readStorage(key)));
      setHydrated(true);
    }, 0);
    const onStorage = (event: StorageEvent) => {
      if (!isStorageChange(event, key)) return;
      const next = parse(event.newValue);
      setValue((previous) =>
        serialize(previous) === serialize(next) ? previous : next,
      );
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, [key, parse, serialize]);

  useEffect(() => {
    if (hydrated) writeStorage(key, serialize(value));
  }, [hydrated, key, serialize, value]);

  return [value, setValue] as const;
}
