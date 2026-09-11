/**
 * Liten haptik-hjälpare för mjuka vibrationer i UI:t.
 * Använder webbens Vibration API när den finns (Android/Chrome).
 * Respekterar "reducerad rörelse" och tyst läge – ingen vibration då.
 */

import { isQuietNow } from "@/lib/quiet-mode";

export type HapticPattern = "tap" | "soft" | "bump" | "success";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  /** Vanligt vybyte – knappt märkbart. */
  tap: 12,
  /** Ännu lenare, för små justeringar. */
  soft: 8,
  /** Du är längst ut i flödet och kan inte gå längre. */
  bump: [8, 40, 8],
  /** Något blev klart. */
  success: 18,
};

function allowed(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (typeof navigator.vibrate !== "function") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    if (isQuietNow()) return false;
  } catch {
    /* tyst läge kunde inte läsas – fortsätt ändå */
  }
  return true;
}

/** Vibrera kort, om enheten och användarens inställningar tillåter det. */
export function haptic(pattern: HapticPattern = "tap"): void {
  if (!allowed()) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    /* vissa webbläsare kastar utan användarinteraktion – ignorera */
  }
}
