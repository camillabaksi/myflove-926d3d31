/**
 * Läser steg från telefonens hälsoapp (Apple Health / Google Health Connect)
 * när appen körs som native Capacitor-app med ett hälso-plugin installerat.
 * I webbläsaren finns ingen sådan API – då används manuellt inmatade steg.
 */

export type HealthSource = "health-app" | "manual" | "none";

interface HealthPluginLike {
  requestAuthorization?: (opts: unknown) => Promise<unknown>;
  isAvailable?: () => Promise<{ available?: boolean } | boolean>;
  queryAggregated?: (opts: unknown) => Promise<unknown>;
  querySteps?: (opts: unknown) => Promise<unknown>;
}

function pickNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["steps", "value", "count", "total", "aggregatedData"]) {
      const found = pickNumber(obj[key]);
      if (found !== null) return found;
    }
  }
  if (Array.isArray(value)) {
    let sum = 0;
    let hit = false;
    for (const entry of value) {
      const n = pickNumber(entry);
      if (n !== null) {
        sum += n;
        hit = true;
      }
    }
    if (hit) return sum;
  }
  return null;
}

async function loadPlugin(): Promise<HealthPluginLike | null> {
  try {
    const core = (await import("@capacitor/core")) as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean; isPluginAvailable?: (n: string) => boolean };
      registerPlugin?: <T>(name: string) => T;
    };
    if (!core.Capacitor?.isNativePlatform?.()) return null;
    for (const name of ["Health", "HealthKit", "CapacitorHealthkit", "HealthConnect"]) {
      if (core.Capacitor?.isPluginAvailable?.(name) && core.registerPlugin) {
        return core.registerPlugin<HealthPluginLike>(name);
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function isHealthAppAvailable(): Promise<boolean> {
  return (await loadPlugin()) !== null;
}

/** Hämtar dagens steg från hälsoappen. Returnerar null om det inte går. */
export async function readTodaySteps(): Promise<number | null> {
  const plugin = await loadPlugin();
  if (!plugin) return null;

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date();
  const range = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    dataType: "steps",
    bucket: "day",
  };

  try {
    await plugin.requestAuthorization?.({ read: ["steps"], all: [], write: [] });
    const raw = plugin.queryAggregated
      ? await plugin.queryAggregated(range)
      : await plugin.querySteps?.(range);
    return pickNumber(raw);
  } catch {
    return null;
  }
}
