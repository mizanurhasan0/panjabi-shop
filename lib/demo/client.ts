"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { getDemoServerSnapshot, getDemoSnapshot, subscribeDemo } from "./store";
import type { DemoSnapshot } from "./types";

/** All demo screens subscribe to one browser workspace, with no request layer. */
export function useDemoQuery<T>(select: (state: DemoSnapshot) => T) {
  const state = useSyncExternalStore(
    subscribeDemo,
    getDemoSnapshot,
    getDemoServerSnapshot,
  );
  const [, refresh] = useState(0);
  const reload = useCallback(() => refresh((revision) => revision + 1), []);
  let data: T | undefined;
  let error = "";
  if (state) {
    try {
      data = select(state);
    } catch (failure) {
      error = errorMessage(failure);
    }
  }
  return { data, loading: state === null, error, reload };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to update the demo. Please try again.";
}
