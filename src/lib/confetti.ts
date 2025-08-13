// Lightweight confetti burst positioned near an element.
// Respects prefers-reduced-motion and auto-cleans after ~700ms.

export function confettiAtElement(
  el: Element | null,
  opts?: {
    count?: number;
    profile?: "subtle" | "celebration" | "low-power";
  }
) {
  if (!el) return;
  if (typeof window === "undefined") return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const rect = el.getBoundingClientRect();

  // Create a small canvas around the element to minimize work and avoid jank
  const pad = Math.max(16, Math.min(64, Math.round(Math.max(rect.width, rect.height) * 0.9)));
  const localW = Math.ceil(rect.width + pad * 2);
  const localH = Math.ceil(rect.height + pad * 2);
  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.position = "fixed";
  canvas.style.left = `${Math.max(0, rect.left - pad)}px`;
  canvas.style.top = `${Math.max(0, rect.top - pad)}px`;
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  canvas.width = Math.floor(localW * dpr);
  canvas.height = Math.floor(localH * dpr);
  canvas.style.width = `${localW}px`;
  canvas.style.height = `${localH}px`;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  // Profile-based tuning
  const profile = opts?.profile;
  const cfg = {
    // counts
    count: typeof opts?.count === "number" ? opts!.count : (profile === "celebration" ? 20 : profile === "subtle" ? 10 : 14),
    // motion
    duration: profile === "celebration" ? 800 : profile === "subtle" ? 550 : 700,
    gravity: 0.08,
    fade: profile === "subtle" ? 0.02 : 0.015,
    // kinematics
    speedMin: profile === "celebration" ? 2.8 : profile === "subtle" ? 1.8 : 2.2,
    speedMax: profile === "celebration" ? 4.2 : profile === "subtle" ? 3.0 : 3.2,
    sizeMin: profile === "celebration" ? 3 : profile === "subtle" ? 2 : 3,
    sizeMax: profile === "celebration" ? 6 : profile === "subtle" ? 4 : 7,
    spreadScale: profile === "celebration" ? 0.7 : profile === "subtle" ? 0.4 : 0.6,
    cone: Math.PI / (profile === "celebration" ? 3 : profile === "subtle" ? 6 : 4),
  } as const;

  const count = Math.max(8, Math.min(24, cfg.count));
  const colors = [
    getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#6EE7F9",
    "#F472B6",
    "#F59E0B",
    "#34D399",
    "#818CF8",
  ];
  type P = { x: number; y: number; vx: number; vy: number; size: number; rot: number; vr: number; color: string; life: number; };
  const parts: P[] = [];
  const centerXLocal = pad + rect.width / 2;
  const centerYLocal = pad + rect.height / 2;
  for (let i = 0; i < count; i++) {
    // Start slightly around the element center within local canvas coords
    const rx = (Math.random() - 0.5) * (rect.width * cfg.spreadScale);
    const ry = (Math.random() - 0.5) * (rect.height * cfg.spreadScale);
    const startX = centerXLocal + rx;
    const startY = centerYLocal + ry;
    // Bias initial velocity to move outward from the center
    const dirX = startX - centerXLocal;
    const dirY = startY - centerYLocal;
    const baseAngle = Math.atan2(dirY || 0.0001, dirX || 0.0001);
    const angle = baseAngle + (Math.random() - 0.5) * cfg.cone;
    const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
    parts.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin),
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
      color: colors[i % colors.length],
      life: 0.9 + Math.random() * 0.6,
    });
  }

  const start = performance.now();
  const duration = cfg.duration; // ms
  const gravity = cfg.gravity;
  const fade = cfg.fade;

  function tick(now: number) {
    const t = now - start;
    // Clear only our small canvas region
    (ctx as CanvasRenderingContext2D).clearRect(0, 0, localW, localH);
    for (const p of parts) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= fade;
      (ctx as CanvasRenderingContext2D).save();
      (ctx as CanvasRenderingContext2D).translate(p.x, p.y);
      (ctx as CanvasRenderingContext2D).rotate(p.rot);
      (ctx as CanvasRenderingContext2D).globalAlpha = Math.max(0, p.life);
      (ctx as CanvasRenderingContext2D).fillStyle = p.color;
      (ctx as CanvasRenderingContext2D).fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      (ctx as CanvasRenderingContext2D).restore();
    }
    if (t < duration && parts.some((p) => p.life > 0)) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(tick);
}
