import { useEffect, useRef, useState } from "react";

/**
 * Mjuk uppräkning av ett tal (t.ex. batteriprocent).
 * Respekterar "reducerad rörelse": då hoppar värdet direkt utan animation.
 */
export function useAnimatedNumber(value: number, duration = 600): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
      setDisplay(value);
      return;
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || duration <= 0) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Lugn utfasning – ingen studs.
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (value - from) * eased;
      setDisplay(next);
      if (t < 1) {
        frameRef.current = window.requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };

    frameRef.current = window.requestAnimationFrame(step);
    return () => {
      if (frameRef.current != null) window.cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);

  return display;
}
