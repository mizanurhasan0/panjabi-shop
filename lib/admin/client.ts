"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export async function api<T>(url: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({ error: "The server returned an unreadable response. Please try again." }));
  if (!response.ok) {
    if (response.status === 401 && !url.includes("/auth/") && !url.includes("/session")) {
      window.dispatchEvent(new Event("admin-session-expired"));
    }
    throw new Error(result.error ?? "Something went wrong. Please try again.");
  }
  return result.data as T;
}

export function useAdminResource<T>(url: string) {
  const router = useRouter();
  useEffect(() => {
    const expire = () => router.replace("/admin/login");
    window.addEventListener("admin-session-expired", expire);
    return () => window.removeEventListener("admin-session-expired", expire);
  }, [router]);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ url: string; data?: T; error: string; loading: boolean }>({url, error: "", loading: true});
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    api<T>(url, { signal: controller.signal }).then(data => {
      if (active) setState({url, data, error: "", loading: false});
    }).catch(error => {
      if (active && error.name !== "AbortError") setState(previous => ({url, data: previous.url === url ? previous.data : undefined, error: error.message, loading: false}));
    });
    return () => { active = false; controller.abort(); };
  }, [url, revision]);
  const current = state.url === url;
  return { data: current ? state.data : undefined, error: current ? state.error : "", loading: !current || state.loading, reload };
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
