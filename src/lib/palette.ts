/**
 * Gemensamma personfärger i MyFlove.
 *
 * Samma lila/rosa-palett används överallt där en person (barn eller
 * familjemedlem) märks ut med en färg – barnsidan, familjesidan och kalendern.
 */
export const PERSON_COLORS = [
  { value: "#7C5CE0", label: "Violett" },
  { value: "#F5B8D0", label: "Rosa" },
  { value: "#A78BFA", label: "Lavendel" },
  { value: "#6C8FE0", label: "Blå" },
  { value: "#5FBFA6", label: "Mint" },
  { value: "#E2719B", label: "Körsbär" },
] as const;

/** Bara färgvärdena, i samma ordning. */
export const PERSON_COLOR_VALUES = PERSON_COLORS.map((c) => c.value);

/** Används när ett barn saknar vald färg. */
export const DEFAULT_CHILD_COLOR = "#7C5CE0";

/** Används när en familjemedlem saknar vald färg. */
export const DEFAULT_MEMBER_COLOR = "#E2719B";
