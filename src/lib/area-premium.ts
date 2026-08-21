// Livsområden – Free vs Premium.
//
// Free: MyFloves grunduppsättning av livsområden med färdiga färger
// (se AREA_META i src/lib/life-areas.ts). Ingen konfigurering behövs.
//
// Premium (senare): personanpassning ovanpå samma datamodell –
// egna namn, egna emojis, egna färger och helt egna livsområden.
// Objekten i appen refererar bara till ett område-id, så inget behöver
// byggas om när premium slås på. Ingen betalvägg implementeras här.

import { useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { AREA_META, type AreaMeta, type LifeArea } from "@/lib/life-areas";

export type PlanTier = "free" | "premium";

/** Vad respektive nivå får göra med livsområden. */
export const AREA_CAPABILITIES: Record<PlanTier, { rename: boolean; recolor: boolean; custom: boolean }> = {
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

const EMPTY: AreaCustomization = { overrides: {}, custom: [] };
const STORAGE_KEY = "myflove-area-customization";

/** Nuvarande nivå. Allt är gratis i detta steg – strukturen finns för framtiden. */
export function usePlanTier(): PlanTier {
  return "free";
}

/**
 * Läser användarens (framtida) anpassningar och slår ihop dem med
 * grunduppsättningen. På Free returneras alltid grunduppsättningen.
 */
export function useAreaCustomization() {
  const tier = usePlanTier();
  const [stored] = useCloudSyncedStorage<AreaCustomization>(STORAGE_KEY, EMPTY);
  const active = tier === "premium" ? (stored ?? EMPTY) : EMPTY;

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
    capabilities: AREA_CAPABILITIES[tier],
    meta,
    customAreas: active.custom ?? [],
  };
}
