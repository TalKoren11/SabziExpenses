"use client";

import { useEffect } from "react";

/** Registers the PWA service worker once the app shell has mounted. */
export function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal — the app still works online.
      });
    }
  }, []);
  return null;
}
