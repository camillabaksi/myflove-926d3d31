/**
 * Automatisk återhämtning: om backend (auth/databas) är pausad eller precis
 * startar upp, pingar vi den tills den svarar och kör om åtgärden.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export type WakeStatus = "waking" | "ready" | "failed";

/** Fel som tyder på att tjänsten sover/startar, snarare än fel lösenord. */
export function isBackendAsleepError(error: unknown): boolean {
  if (!error) return false;
  const e = error as { status?: number; message?: string; name?: string };
  if (
    typeof e.status === "number" &&
    (e.status === 0 ||
      e.status === 503 ||
      e.status === 502 ||
      e.status === 504 ||
      e.status === 522 ||
      e.status === 408)
  ) {
    return true;
  }
  const msg = `${e.name ?? ""} ${e.message ?? ""}`.toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("load failed") ||
    msg.includes("timeout") ||
    msg.includes("upstream") ||
    msg.includes("unavailable") ||
    msg.includes("paused")
  );
}

async function pingAuth(timeoutMs: number): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_KEY },
      signal: controller.signal,
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Pingar backend tills den svarar (varje ping väcker en pausad tjänst).
 * Returnerar true när den är uppe.
 */
export async function wakeBackend(opts?: {
  attempts?: number;
  onProgress?: (attempt: number, attempts: number) => void;
}): Promise<boolean> {
  const attempts = opts?.attempts ?? 8;
  for (let i = 1; i <= attempts; i++) {
    opts?.onProgress?.(i, attempts);
    if (await pingAuth(8000)) return true;
    // Ökande väntetid: 1s, 2s, 3s … max 6s
    await new Promise((r) => setTimeout(r, Math.min(i * 1000, 6000)));
  }
  return pingAuth(8000);
}

/**
 * Kör en åtgärd (t.ex. inloggning). Om backend verkar sovande väcks den och
 * åtgärden körs om.
 */
export async function withBackendRecovery<T extends { error: unknown }>(
  action: () => Promise<T>,
  onStatus?: (status: WakeStatus) => void,
): Promise<T> {
  let result: T;
  try {
    result = await action();
  } catch (err) {
    if (!isBackendAsleepError(err)) throw err;
    result = { error: err } as T;
  }

  if (!isBackendAsleepError(result.error)) return result;

  onStatus?.("waking");
  const awake = await wakeBackend();
  if (!awake) {
    onStatus?.("failed");
    return result;
  }
  onStatus?.("ready");
  return action();
}
