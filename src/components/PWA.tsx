"use client";

import { useEffect } from "react";

export default function PWA() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const sw = "/sw.js";
    const register = async () => {
      try {
        await navigator.serviceWorker.register(sw);
      } catch {
        // ignore registration errors in dev
      }
    };
    register();
  }, []);
  return null;
}
