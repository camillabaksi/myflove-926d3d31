import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";

/**
 * Gemensam, subtil sidövergång.
 *
 * - Vid riktig routing-navigation tonas nuvarande vy ut (~160 ms) och
 *   den nya vyn tonas in (~220 ms).
 * - Lokala interaktioner på samma sida triggar ingenting: vi lyssnar bara
 *   på routerns navigationshändelser och på byte av pathname.
 * - `prefers-reduced-motion` hanteras i CSS (animationerna stängs av).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [phase, setPhase] = useState<"idle" | "out">("idle");
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = router.subscribe("onBeforeNavigate", (event) => {
      // Bara verkliga sidbyten – inte sök-/hashändringar på samma sida.
      if (event.fromLocation?.pathname === event.toLocation.pathname) return;
      setPhase("out");
      if (safety.current) clearTimeout(safety.current);
      // Skyddsnät: fastna aldrig i utfasat läge.
      safety.current = setTimeout(() => setPhase("idle"), 600);
    });
    return () => {
      unsub();
      if (safety.current) clearTimeout(safety.current);
    };
  }, [router]);

  useEffect(() => {
    if (safety.current) clearTimeout(safety.current);
    setPhase("idle");
  }, [pathname]);

  return (
    <div
      key={pathname}
      data-page-phase={phase}
      className={phase === "out" ? "page-transition-out" : "page-transition"}
    >
      {children}
    </div>
  );
}

export default PageTransition;
