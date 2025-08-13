"use client";

import { useEffect } from "react";

export default function UIEffects() {
  useEffect(() => {
    const prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Ripple (delegated)
    const onDown = (e: MouseEvent) => {
      if (prefersReduced) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Find closest ripple-able element
      const el = target.closest<HTMLElement>("[data-ripple], .btn-primary, .chip, .carousel-arrow");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--rx", `${x}px`);
      el.style.setProperty("--ry", `${y}px`);
      el.classList.remove("is-rippling");
      // force reflow to restart animation
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (el as HTMLElement).offsetHeight;
      el.classList.add("is-rippling");
      // cleanup class after animation
      window.setTimeout(() => el.classList.remove("is-rippling"), 450);
    };
    document.addEventListener("mousedown", onDown, { capture: true });

  // Reveal effect removed to avoid hydration mismatches

    // Mesh parallax: update CSS var based on scroll
    let raf = 0;
    const onScroll = () => {
      if (prefersReduced) return;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        const offset = Math.max(-10, Math.min(10, y * 0.02));
        document.documentElement.style.setProperty("--mesh-parallax-y", `${offset}px`);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
  document.removeEventListener("mousedown", onDown, { capture: true } as unknown as EventListenerOptions);
      window.removeEventListener("scroll", onScroll as EventListener);
    };
  }, []);

  return null;
}
