"use client";

import { useSyncExternalStore } from "react";

const AUTO_SAVE_KEY = "autoSave";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/**
 * Reads/writes the "save on category tap" flag from localStorage without
 * triggering setState-in-effect. Server snapshot is always false.
 */
export function useAutoSave(): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(AUTO_SAVE_KEY) === "true",
    () => false
  );
  const setValue = (next: boolean) => {
    localStorage.setItem(AUTO_SAVE_KEY, String(next));
    window.dispatchEvent(new Event("storage"));
  };
  return [value, setValue];
}

/** The current origin, client-only (empty string during SSR). */
export function useOrigin(): string {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ""
  );
}
