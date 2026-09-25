/**
 * Personalisering – "Din MyFlove".
 *
 * Här bor de val som gör appen lite mer personlig: färgtema, alarmsignal
 * och alarmformat (ljud/vibration). Allt sparas i befintlig localStorage
 * (samma arkitektur som övriga enhetsval) – inget parallellt system.
 *
 * VIKTIGT: temat byter bara appens *identitetsfärger* (primary/ring/accent
 * och mjuka ytor). Semantiska färger – energi upp/ner, status, varning,
 * bekräftelse, destructive – ligger kvar i sina egna tokens och rörs aldrig.
 *
 * Premium-förberedelse: varje tema och signal har ett `premium`-fält och
 * åtkomsten går genom `isPersonalizationUnlocked()`. När betalvägg införs
 * byts bara den funktionen ut – UI och datamodell kan stå kvar.
 */

import { useCallback, useEffect, useState } from "react";

export type ThemeId =
  | "lavendel"
  | "rosa"
  | "salvia"
  | "ljusbla"
  | "persika"
  | "vanilj"
  | "turkos"
  | "lugn-gra";

export type AlarmSoundId =
  | "myflove"
  | "mjuk-klocka"
  | "litet-pling"
  | "mjuk-ton"
  | "bubblig"
  | "natur"
  | "lugn-melodi"
  | "klangskal"
  | "regndroppe"
  | "harpa";


/** Hur en påminnelse ska märkas av. */
export type AlarmFormat = "ljud" | "vibration" | "bada" | "tyst";

export interface Personalization {
  theme: ThemeId;
  alarmSound: AlarmSoundId;
  alarmFormat: AlarmFormat;
}

export const PERSONALIZATION_DEFAULTS: Personalization = {
  theme: "lavendel",
  alarmSound: "myflove",
  alarmFormat: "bada",
};

/** Nycklar – befintliga namn behålls så inget val tappas. */
export const THEME_KEY = "myflove-theme";
export const ALARM_SOUND_KEY = "myflove-alarm-sound";
export const ALARM_FORMAT_KEY = "myflove-alarm-format";

export const PERSONALIZATION_EVENT = "myflove-personalization";

/** HSL-värden för de tokens ett tema får ändra. */
interface ThemeVars {
  primary: string;
  primaryForeground: string;
  ring: string;
  accent: string;
  accentForeground: string;
  secondary: string;
  background: string;
  border: string;
  lavender: string;
}

export interface ThemePreset {
  id: ThemeId;
  label: string;
  /** Liten cirkel i UI:t. */
  swatch: string;
  premium: boolean;
  light: ThemeVars;
  dark: ThemeVars;
}

export const THEMES: ThemePreset[] = [
  {
    id: "lavendel",
    label: "Lavendel",
    swatch: "hsl(258 68% 62%)",
    premium: false,
    light: {
      primary: "258 68% 62%",
      primaryForeground: "0 0% 100%",
      ring: "258 68% 62%",
      accent: "327 70% 94%",
      accentForeground: "327 45% 38%",
      secondary: "262 55% 95%",
      background: "264 60% 98%",
      border: "264 35% 91%",
      lavender: "264 72% 93%",
    },
    dark: {
      primary: "258 78% 72%",
      primaryForeground: "260 40% 12%",
      ring: "258 78% 72%",
      accent: "327 30% 26%",
      accentForeground: "327 70% 86%",
      secondary: "260 18% 22%",
      background: "260 30% 10%",
      border: "260 18% 22%",
      lavender: "264 26% 24%",
    },
  },
  {
    id: "rosa",
    label: "Rosa",
    swatch: "hsl(335 62% 60%)",
    premium: true,
    light: {
      primary: "335 60% 56%",
      primaryForeground: "0 0% 100%",
      ring: "335 60% 56%",
      accent: "340 72% 94%",
      accentForeground: "335 45% 36%",
      secondary: "336 55% 95%",
      background: "336 60% 98%",
      border: "336 35% 91%",
      lavender: "336 72% 94%",
    },
    dark: {
      primary: "335 68% 70%",
      primaryForeground: "335 40% 12%",
      ring: "335 68% 70%",
      accent: "335 30% 26%",
      accentForeground: "335 70% 88%",
      secondary: "330 16% 22%",
      background: "330 24% 10%",
      border: "330 16% 22%",
      lavender: "335 24% 24%",
    },
  },
  {
    id: "salvia",
    label: "Salvia",
    swatch: "hsl(150 34% 42%)",
    premium: true,
    light: {
      primary: "150 34% 38%",
      primaryForeground: "0 0% 100%",
      ring: "150 34% 38%",
      accent: "150 40% 92%",
      accentForeground: "150 35% 26%",
      secondary: "150 30% 94%",
      background: "150 34% 98%",
      border: "150 20% 89%",
      lavender: "150 40% 93%",
    },
    dark: {
      primary: "150 40% 60%",
      primaryForeground: "150 40% 10%",
      ring: "150 40% 60%",
      accent: "150 20% 24%",
      accentForeground: "150 45% 85%",
      secondary: "150 12% 22%",
      background: "150 18% 10%",
      border: "150 12% 22%",
      lavender: "150 18% 22%",
    },
  },
  {
    id: "ljusbla",
    label: "Ljusblå",
    swatch: "hsl(210 66% 52%)",
    premium: true,
    light: {
      primary: "210 66% 48%",
      primaryForeground: "0 0% 100%",
      ring: "210 66% 48%",
      accent: "205 72% 93%",
      accentForeground: "210 48% 32%",
      secondary: "208 55% 95%",
      background: "208 60% 98%",
      border: "208 32% 90%",
      lavender: "205 72% 93%",
    },
    dark: {
      primary: "205 72% 68%",
      primaryForeground: "210 45% 12%",
      ring: "205 72% 68%",
      accent: "205 26% 25%",
      accentForeground: "205 70% 87%",
      secondary: "208 16% 22%",
      background: "210 24% 10%",
      border: "208 16% 22%",
      lavender: "205 24% 24%",
    },
  },
  {
    id: "persika",
    label: "Persika",
    swatch: "hsl(20 72% 54%)",
    premium: true,
    light: {
      primary: "20 68% 48%",
      primaryForeground: "0 0% 100%",
      ring: "20 68% 48%",
      accent: "24 80% 93%",
      accentForeground: "20 52% 32%",
      secondary: "24 60% 95%",
      background: "26 62% 98%",
      border: "24 35% 90%",
      lavender: "24 80% 93%",
    },
    dark: {
      primary: "24 76% 68%",
      primaryForeground: "20 45% 12%",
      ring: "24 76% 68%",
      accent: "22 26% 25%",
      accentForeground: "24 72% 86%",
      secondary: "22 14% 22%",
      background: "22 20% 10%",
      border: "22 14% 22%",
      lavender: "22 22% 24%",
    },
  },
  {
    id: "vanilj",
    label: "Vanilj",
    swatch: "hsl(42 62% 44%)",
    premium: true,
    light: {
      primary: "40 62% 38%",
      primaryForeground: "0 0% 100%",
      ring: "40 62% 38%",
      accent: "44 82% 91%",
      accentForeground: "38 48% 28%",
      secondary: "44 60% 94%",
      background: "44 62% 98%",
      border: "44 32% 89%",
      lavender: "44 80% 92%",
    },
    dark: {
      primary: "44 70% 66%",
      primaryForeground: "40 45% 12%",
      ring: "44 70% 66%",
      accent: "42 24% 24%",
      accentForeground: "44 70% 86%",
      secondary: "42 12% 22%",
      background: "42 16% 10%",
      border: "42 12% 22%",
      lavender: "42 20% 23%",
    },
  },
  {
    id: "turkos",
    label: "Turkos",
    swatch: "hsl(184 60% 38%)",
    premium: true,
    light: {
      primary: "184 62% 34%",
      primaryForeground: "0 0% 100%",
      ring: "184 62% 34%",
      accent: "184 58% 91%",
      accentForeground: "184 45% 24%",
      secondary: "184 45% 94%",
      background: "184 50% 98%",
      border: "184 26% 89%",
      lavender: "184 58% 92%",
    },
    dark: {
      primary: "184 60% 58%",
      primaryForeground: "184 45% 10%",
      ring: "184 60% 58%",
      accent: "184 24% 24%",
      accentForeground: "184 60% 85%",
      secondary: "184 12% 22%",
      background: "186 20% 10%",
      border: "184 12% 22%",
      lavender: "184 20% 23%",
    },
  },
  {
    id: "lugn-gra",
    label: "Lugn grå",
    swatch: "hsl(240 8% 45%)",
    premium: true,
    light: {
      primary: "240 10% 40%",
      primaryForeground: "0 0% 100%",
      ring: "240 10% 40%",
      accent: "240 18% 93%",
      accentForeground: "240 14% 30%",
      secondary: "240 16% 95%",
      background: "240 22% 98%",
      border: "240 12% 90%",
      lavender: "240 18% 93%",
    },
    dark: {
      primary: "240 14% 72%",
      primaryForeground: "240 20% 12%",
      ring: "240 14% 72%",
      accent: "240 10% 25%",
      accentForeground: "240 16% 88%",
      secondary: "240 8% 22%",
      background: "240 12% 10%",
      border: "240 8% 22%",
      lavender: "240 10% 23%",
    },
  },
];

export interface AlarmSoundPreset {
  id: AlarmSoundId;
  label: string;
  hint: string;
  premium: boolean;
}

export const ALARM_SOUNDS: AlarmSoundPreset[] = [
  { id: "myflove", label: "MyFlove-standard", hint: "Tre mjuka pip", premium: false },
  { id: "mjuk-klocka", label: "Mjuk klocka", hint: "Klingar långsamt", premium: true },
  { id: "litet-pling", label: "Litet pling", hint: "Kort och lätt", premium: true },
  { id: "mjuk-ton", label: "Mjuk ton", hint: "En enda varm ton", premium: true },
  { id: "bubblig", label: "Bubblig", hint: "Små studsande toner", premium: true },
  { id: "natur", label: "Natur", hint: "Mjukt sus och fågelpip", premium: true },
  { id: "lugn-melodi", label: "Lugn melodi", hint: "Fyra toner i dur", premium: true },
  { id: "klangskal", label: "Klangskål", hint: "Djup resonans som tonar in", premium: true },
  { id: "regndroppe", label: "Regndroppe", hint: "Mjukt och organiskt", premium: true },
  { id: "harpa", label: "Mjuk harpa", hint: "Varm och dämpad", premium: true },
];


export const ALARM_FORMATS: Array<{ id: AlarmFormat; label: string; icon: string }> = [
  { id: "ljud", label: "Ljud", icon: "🔔" },
  { id: "vibration", label: "Vibration", icon: "📳" },
  { id: "bada", label: "Ljud och vibration", icon: "🔔📳" },
  { id: "tyst", label: "Tyst", icon: "🔕" },
];

/**
 * Premium-grind. Idag har alla tillgång till allt – när Premium införs
 * byts implementationen (t.ex. mot en entitlement-koll) utan UI-ändringar.
 */
export function isPersonalizationUnlocked(): boolean {
  return true;
}

function readKey(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function readPersonalization(): Personalization {
  const theme = readKey(THEME_KEY, PERSONALIZATION_DEFAULTS.theme) as ThemeId;
  const alarmSound = readKey(ALARM_SOUND_KEY, PERSONALIZATION_DEFAULTS.alarmSound) as AlarmSoundId;
  const alarmFormat = readKey(
    ALARM_FORMAT_KEY,
    PERSONALIZATION_DEFAULTS.alarmFormat,
  ) as AlarmFormat;
  return {
    theme: THEMES.some((t) => t.id === theme) ? theme : PERSONALIZATION_DEFAULTS.theme,
    alarmSound: ALARM_SOUNDS.some((s) => s.id === alarmSound)
      ? alarmSound
      : PERSONALIZATION_DEFAULTS.alarmSound,
    alarmFormat: ALARM_FORMATS.some((f) => f.id === alarmFormat)
      ? alarmFormat
      : PERSONALIZATION_DEFAULTS.alarmFormat,
  };
}

export function getAlarmSoundId(): AlarmSoundId {
  return readPersonalization().alarmSound;
}

export function getAlarmFormat(): AlarmFormat {
  return readPersonalization().alarmFormat;
}

/** Sätter temats CSS-variabler på <html>. Semantiska tokens rörs inte. */
export function applyTheme(themeId: ThemeId): void {
  if (typeof document === "undefined") return;
  const preset = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const el = document.documentElement;
  const dark = el.classList.contains("dark");
  const vars = dark ? preset.dark : preset.light;

  el.dataset["theme"] = preset.id;
  el.style.setProperty("--primary", vars.primary);
  el.style.setProperty("--primary-foreground", vars.primaryForeground);
  el.style.setProperty("--ring", vars.ring);
  el.style.setProperty("--accent", vars.accent);
  el.style.setProperty("--accent-foreground", vars.accentForeground);
  el.style.setProperty("--secondary", vars.secondary);
  el.style.setProperty("--background", vars.background);
  el.style.setProperty("--border", vars.border);
  el.style.setProperty("--lavender", vars.lavender);
  el.style.setProperty("--forest", vars.primary);
}

/** Ljust, mörkt eller följ telefonen. Sparas per enhet. */
export type Appearance = "auto" | "ljust" | "morkt";
export const APPEARANCE_KEY = "myflove-appearance";
export const APPEARANCES: Array<{ id: Appearance; label: string; hint: string }> = [
  { id: "ljust", label: "Ljust", hint: "Ljusa ytor hela dagen" },
  { id: "morkt", label: "Mörkt", hint: "Mörka ytor, skonsamt på kvällen" },
  { id: "auto", label: "Som telefonen", hint: "Följer telefonens inställning" },
];

export function readAppearance(): Appearance {
  const v = readKey(APPEARANCE_KEY, "ljust");
  return v === "auto" || v === "morkt" ? v : "ljust";
}

export function applyAppearance(a: Appearance = readAppearance()): void {
  if (typeof document === "undefined") return;
  const dark =
    a === "morkt" ||
    (a === "auto" && typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", Boolean(dark));
}

export function setAppearance(a: Appearance): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(APPEARANCE_KEY, a);
  } catch {
    /* gäller bara denna session */
  }
  applyAppearance(a);
  applyTheme(readPersonalization().theme);
  window.dispatchEvent(new CustomEvent(PERSONALIZATION_EVENT, { detail: readPersonalization() }));
}

export function setPersonalization(patch: Partial<Personalization>): void {
  if (typeof window === "undefined") return;
  try {
    if (patch.theme) window.localStorage.setItem(THEME_KEY, patch.theme);
    if (patch.alarmSound) window.localStorage.setItem(ALARM_SOUND_KEY, patch.alarmSound);
    if (patch.alarmFormat) window.localStorage.setItem(ALARM_FORMAT_KEY, patch.alarmFormat);
  } catch {
    /* utan lagring gäller valet bara denna session */
  }
  if (patch.theme) applyTheme(patch.theme);
  window.dispatchEvent(new CustomEvent(PERSONALIZATION_EVENT, { detail: readPersonalization() }));
}

/** Kallas vid appstart så temat finns på plats direkt. */
export function initPersonalization(): void {
  applyAppearance();
  applyTheme(readPersonalization().theme);
}

export function usePersonalization() {
  const [value, setValue] = useState<Personalization>(PERSONALIZATION_DEFAULTS);
  const [appearance, setAppearanceState] = useState<Appearance>("ljust");

  useEffect(() => {
    const sync = () => {
      setValue(readPersonalization());
      setAppearanceState(readAppearance());
    };
    sync();
    initPersonalization();
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onScheme = () => {
      if (readAppearance() === "auto") initPersonalization();
    };
    mq?.addEventListener?.("change", onScheme);
    window.addEventListener(PERSONALIZATION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      mq?.removeEventListener?.("change", onScheme);
      window.removeEventListener(PERSONALIZATION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((patch: Partial<Personalization>) => setPersonalization(patch), []);
  const reset = useCallback(() => {
    setPersonalization(PERSONALIZATION_DEFAULTS);
    setAppearance("ljust");
  }, []);

  return {
    personalization: value,
    appearance,
    setAppearance,
    update,
    reset,
    unlocked: isPersonalizationUnlocked(),
  };
}
