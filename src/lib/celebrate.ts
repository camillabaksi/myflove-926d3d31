/**
 * Lugn återkoppling: en mjuk dimma som löses upp utan blinkningar eller konfetti.
 */

export function celebrate(origin?: { x: number; y: number }) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 3;

  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = `position:fixed;left:0;top:0;width:0;height:0;z-index:9999;pointer-events:none;`;
  document.body.appendChild(layer);

  const count = 4;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    const size = 34 + i * 12;
    const dx = (i - 1.5) * 18;
    const dy = -20 - i * 8;
    p.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;border-radius:9999px;background:hsl(var(--lavender)/0.5);filter:blur(10px);opacity:0.55;will-change:transform,opacity;`;
    layer.appendChild(p);
    p.animate(
      [
        { transform: "translate(0,0) scale(0.75)", opacity: 0.35 },
        { transform: `translate(${dx}px, ${dy}px) scale(1.35)`, opacity: 0 },
      ],
      {
        duration: 1100 + i * 120,
        easing: "ease-out",
        fill: "forwards",
      },
    );
  }

  window.setTimeout(() => layer.remove(), 1800);
}

/** Firar utifrån var användaren klickade, så puffen sker vid uppgiften. */
export function celebrateFromEvent(e: { clientX?: number; clientY?: number }) {
  if (typeof e.clientX === "number" && typeof e.clientY === "number" && (e.clientX || e.clientY)) {
    celebrate({ x: e.clientX, y: e.clientY });
  } else {
    celebrate();
  }
}
