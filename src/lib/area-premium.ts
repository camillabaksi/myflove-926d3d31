// Livsområden – Free vs Premium.
//
// Grunduppsättningen fungerar direkt. Färganpassning är öppen för alla nu
// och använder samma åtkomstkontroll som personliga teman och ljud.
//
// Premium (senare): personanpassning ovanpå samma datamodell –
// egna namn, egna emojis, egna färger och helt egna livsområden.
// Objekten i appen refererar bara till ett område-id, så inget behöver
// byggas om när premium slås på. Ingen betalvägg implementeras här.

import { useMemo, useEffect, useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { isPersonalizationUnlocked } from "@/lib/personalization";
import { getDataOwner } from "@/lib/account-scope";
import { AREA_META, type AreaMeta, type LifeArea } from "@/lib/life-areas";

export type PlanTier = "free" | "premium";

/** Vad respektive nivå får göra med livsområden. */
export const AREA_CAPABILITIES: Record<
  PlanTier,
  { rename: boolean; recolor: boolean; custom: boolean }
> = {
  free: { rename: false, recolor: false, custom: false },
  premium: { rename: true, recolor: true, custom: true },
};

/** Premium-anpassning av ett befintligt område. */
export interface AreaOverride {
  label?: string;
  emoji?: string;
  /** HSL-värde, samma format som AreaMeta.hue */
  hue?: string;
}

/** Ett helt eget livsområde (premium). Id:t prefixas alltid med "custom:". */
export interface CustomArea {
  id: string;
  label: string;
  emoji: string;
  hue: string;
}

export interface AreaCustomization {
  overrides: Partial<Record<LifeArea, AreaOverride>>;
  custom: CustomArea[];
}

export const EMPTY_AREA_CUSTOMIZATION: AreaCustomization = { overrides: {}, custom: [] };
export const AREA_CUSTOMIZATION_KEY = "myflove-area-customization";

/** Nuvarande nivå. Allt är gratis i detta steg – strukturen finns för framtiden. */
export function usePlanTier(): PlanTier {
  return "free";
}

/**
 * Läser användarens (framtida) anpassningar och slår ihop dem med
 * grunduppsättningen. Färganpassning är öppen nu, inför framtida Premium.
 */
export function useAreaCustomization() {
  const tier = usePlanTier();
  const [stored, setStored] = useCloudSyncedStorage<AreaCustomization>(
    AREA_CUSTOMIZATION_KEY,
    EMPTY_AREA_CUSTOMIZATION,
  );
  // Available to everyone now; the same entitlement seam can gate future writes.
  const active = normalizeAreaCustomization(stored);
  const setColor = useCallback(
    (area: LifeArea, hue?: string) => {
      if (!getDataOwner() || !isPersonalizationUnlocked() || (hue && !isAreaHue(hue))) return;
      setStored((previous) => {
        const next = normalizeAreaCustomization(previous);
        const overrides = { ...next.overrides };
        const override = { ...overrides[area] };
        if (hue) override.hue = hue;
        else delete override.hue;
        if (Object.keys(override).length) overrides[area] = override;
        else delete overrides[area];
        return { ...next, overrides };
      });
    },
    [setStored],
  );
  const resetColors = useCallback(() => {
    if (!getDataOwner() || !isPersonalizationUnlocked()) return;
    setStored((previous) => {
      const next = normalizeAreaCustomization(previous);
      const overrides = { ...next.overrides };
      for (const id of Object.keys(overrides) as LifeArea[]) {
        const { hue: _hue, ...other } = overrides[id]!;
        if (Object.keys(other).length) overrides[id] = other;
        else delete overrides[id];
      }
      return { ...next, overrides };
    });
  }, [setStored]);

  const meta = useMemo<Record<LifeArea, AreaMeta>>(() => {
    const out = { ...AREA_META };
    for (const [id, o] of Object.entries(active.overrides ?? {})) {
      const base = out[id as LifeArea];
      if (!base || !o) continue;
      out[id as LifeArea] = { ...base, ...o };
    }
    return out;
  }, [active]);

  return {
    tier,
    capabilities: { ...AREA_CAPABILITIES[tier], recolor: isPersonalizationUnlocked() },
    setColor,
    resetColors,
    customization: active,
    meta,
    customAreas: active.custom ?? [],
  };
}

export const AREA_COLOR_OPTIONS = [
  { label: "Salvia", hue: "150 45% 35%" },
  { label: "Rosa", hue: "327 62% 42%" },
  { label: "Lavendel", hue: "265 60% 45%" },
  { label: "Blå", hue: "212 72% 38%" },
  { label: "Persika", hue: "20 70% 38%" },
  { label: "Guld", hue: "45 70% 32%" },
  { label: "Turkos", hue: "184 55% 30%" },
  { label: "Grå", hue: "240 10% 40%" },
];

export function isAreaHue(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{1,3}(?:\.\d+)?) (\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)%$/.exec(value);
  return !!match && +match[1] <= 360 && +match[2] <= 100 && +match[3] <= 100;
}

export function normalizeAreaCustomization(value: unknown): AreaCustomization {
  if (!value || typeof value !== "object") return EMPTY_AREA_CUSTOMIZATION;
  const source = value as Partial<AreaCustomization>;
  const overrides: AreaCustomization["overrides"] = {};
  for (const id of Object.keys(AREA_META) as LifeArea[]) {
    const override = source.overrides?.[id];
    if (!override || typeof override !== "object") continue;
    // Names/emojis remain reserved; current activities retain stable area ids.
    const safe: AreaOverride = {};
    if (typeof override.label === "string") safe.label = override.label;
    if (typeof override.emoji === "string") safe.emoji = override.emoji;
    if (isAreaHue(override.hue)) safe.hue = override.hue;
    if (Object.keys(safe).length) overrides[id] = safe;
  }
  return { overrides, custom: Array.isArray(source.custom) ? source.custom : [] };
}

export function applyAreaColors(value: AreaCustomization, dark = false): void {
  const el = document.documentElement;
  for (const id of Object.keys(AREA_META) as LifeArea[]) {
    const hue = value.overrides[id]?.hue;
    if (!isAreaHue(hue)) {
      el.style.removeProperty(`--calendar-${id}`);
      continue;
    }
    const [h, s, l] = hue.split(" ");
    el.style.setProperty(
      `--calendar-${id}`,
      dark ? `${h} ${s} ${Math.max(70, parseFloat(l))}%` : hue,
    );
  }
}

/** Live across pages and light/dark changes; never changes stored activities. */
export function useAreaColors() {
  const { customization } = useAreaCustomization();
  const serialized = JSON.stringify(customization);
  useEffect(() => {
    const value = JSON.parse(serialized) as AreaCustomization;
    const apply = () => applyAreaColors(value, document.documentElement.classList.contains("dark"));
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
      applyAreaColors(EMPTY_AREA_CUSTOMIZATION);
    };
  }, [serialized]);
}
