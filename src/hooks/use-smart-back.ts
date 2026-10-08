import { useCallback } from "react";
import { useRouter } from "@tanstack/react-router";

/**
 * Tillbaka som följer appens riktiga historik.
 *
 * - Finns det en föregående sida i routerns historik går vi dit (history.back()).
 * - Landar du direkt på sidan (extern länk, refresh, ny flik) faller vi tillbaka
 *   till en rimlig överordnad sida i stället för att fastna.
 *
 * Ingen egen parallell historik skapas – vi använder routerns egen.
 */
export function useSmartBack(fallback = "/idag") {
  const router = useRouter();

  return useCallback(() => {
    if (typeof window === "undefined") return;
    const canGoBack = router.history.canGoBack?.() ?? router.history.length > 1;
    if (canGoBack) {
      router.history.back();
      return;
    }
    router.navigate({ to: fallback });
  }, [router, fallback]);
}

export default useSmartBack;
