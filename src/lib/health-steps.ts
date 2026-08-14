/**
 * Läser steg från telefonens hälsoapp (Apple Health / Google Health Connect)
 * via Capacitor-pluginet `capacitor-health`.
 *
 * I webbläsaren finns ingen sådan API – då returneras null och användaren
 * fyller i steg manuellt.
 */

export type HealthSource = "health-app" | "manual" | "none";

export interface DailySteps {
  /** YYYY-MM-DD */
  date: string;
  steps: number;
}

interface HealthPluginLike {
  isHealthAvailable(): Promise<{ available: boolean }>;
  requestHealthPermissions(opts: { permissions: string[] }): Promise<unknown>;
  queryAggregated(opts: {
    startDate: string;
    endDate: string;
    dataType: "steps";
    bucket: string;
  }): Promise<{ aggregatedData: Array<{ startDate: string; endDate: string; value: number }> }>;
  openAppleHealthSettings(): Promise<void>;
  openHealthConnectSettings(): Promise<void>;
  showHealthConnectInPlayStore(): Promise<void>;
}

function dateKey(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function isNative(): Promise<boolean> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

let pluginPromise: Promise<HealthPluginLike | null> | null = null;

async function loadPlugin(): Promise<HealthPluginLike | null> {
  if (!(await isNative())) return null;
  pluginPromise ??= (async () => {
    try {
      const mod = (await import("capacitor-health")) as unknown as { Health: HealthPluginLike };
      return mod.Health ?? null;
    } catch {
      return null;
    }
  })();
  return pluginPromise;
}

/** True när appen kör som mobilapp och hälsoappen går att nå. */
export async function isHealthAppAvailable(): Promise<boolean> {
  const plugin = await loadPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.isHealthAvailable();
    return Boolean(res?.available);
  } catch {
    return false;
  }
}

/** Ber om läsrättighet för steg. Returnerar false om det inte gick. */
export async function requestStepPermission(): Promise<boolean> {
  const plugin = await loadPlugin();
  if (!plugin) return false;
  try {
    await plugin.requestHealthPermissions({ permissions: ["READ_STEPS"] });
    return true;
  } catch {
    return false;
  }
}

/** Hämtar steg per dag för de senaste `days` dagarna (inkl. idag). */
export async function readStepsForDays(days = 7): Promise<DailySteps[] | null> {
  const plugin = await loadPlugin();
  if (!plugin) return null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (Math.max(1, days) - 1));
  const end = new Date();

  try {
    await plugin.requestHealthPermissions({ permissions: ["READ_STEPS"] });
    const res = await plugin.queryAggregated({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      dataType: "steps",
      bucket: "day",
    });
    const buckets = res?.aggregatedData ?? [];
    const totals = new Map<string, number>();
    for (const b of buckets) {
      if (typeof b?.value !== "number" || !Number.isFinite(b.value)) continue;
      const key = dateKey(b.startDate);
      totals.set(key, (totals.get(key) ?? 0) + b.value);
    }
    return [...totals.entries()]
      .map(([date, steps]) => ({ date, steps: Math.round(steps) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return null;
  }
}

/** Hämtar dagens steg från hälsoappen. Returnerar null om det inte går. */
export async function readTodaySteps(): Promise<number | null> {
  const rows = await readStepsForDays(1);
  if (!rows) return null;
  const today = dateKey(new Date());
  const hit = rows.find((r) => r.date === today);
  return hit ? hit.steps : (rows.at(-1)?.steps ?? 0);
}

/** Öppnar systemets hälsoinställningar så användaren kan ge åtkomst. */
export async function openHealthSettings(): Promise<void> {
  const plugin = await loadPlugin();
  if (!plugin) return;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.getPlatform() === "ios") await plugin.openAppleHealthSettings();
    else await plugin.openHealthConnectSettings();
  } catch {
    /* ignorera */
  }
}
