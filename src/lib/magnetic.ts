"use client";

// Lightweight magnetic hover helpers, respects reduced motion.
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function magMove(e: React.MouseEvent<HTMLElement>, strength = 8) {
  if (prefersReducedMotion()) return;
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;
  const nx = dx / (rect.width / 2);
  const ny = dy / (rect.height / 2);
  const tx = Math.max(Math.min(nx * strength, strength), -strength);
  const ty = Math.max(Math.min(ny * strength, strength), -strength);
  el.style.setProperty("--mag-tx", `${tx}px`);
  el.style.setProperty("--mag-ty", `${ty}px`);
}

export function magLeave(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget as HTMLElement;
  el.style.setProperty("--mag-tx", "0px");
  el.style.setProperty("--mag-ty", "0px");
}
