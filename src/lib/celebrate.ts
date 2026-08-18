/**
 * Litet mikro-firande: en kort konfettipuff av DOM-partiklar.
 * Inga beroenden, respekterar "reducerad rörelse".
 */

const COLORS = [
  "hsl(var(--terracotta, 7 47% 49%))",
  "hsl(var(--sage, 138 24% 40%))",
  "hsl(var(--gold, 35 65% 45%))",
  "hsl(var(--primary))",
];

export function celebrate(origin?: { x: number; y: number }) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 3;

  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = `position:fixed;left:0;top:0;width:0;height:0;z-index:9999;pointer-events:none;`;
  document.body.appendChild(layer);

  const count = 18;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    const size = 6 + Math.random() * 6;
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distance = 60 + Math.random() * 90;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 30;
    p.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size * 0.6}px;border-radius:2px;background:${
      COLORS[i % COLORS.length]
    };opacity:0.95;will-change:transform,opacity;`;
    layer.appendChild(p);
    p.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${dx}px, ${dy}px) rotate(${Math.random() * 360}deg)`,
          opacity: 1,
          offset: 0.6,
        },
        {
          transform: `translate(${dx * 1.15}px, ${dy + 140}px) rotate(${Math.random() * 540}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 900 + Math.random() * 400,
        easing: "cubic-bezier(0.2,0.7,0.3,1)",
        fill: "forwards",
      },
    );
  }

  window.setTimeout(() => layer.remove(), 1600);
}

/** Firar utifrån var användaren klickade, så puffen sker vid uppgiften. */
export function celebrateFromEvent(e: { clientX?: number; clientY?: number }) {
  if (typeof e.clientX === "number" && typeof e.clientY === "number" && (e.clientX || e.clientY)) {
    celebrate({ x: e.clientX, y: e.clientY });
  } else {
    celebrate();
  }
}
