import { logAnalyticsEventFn } from "@/lib/analytics.functions";
import { recordUsage } from "@/lib/usage-local";

const SESSION_KEY = "myflow-analytics-session-id";

/**
 * Slumpat, anonymt id som roteras varje dygn. Det går inte att koppla till ett
 * konto, en person eller en enhet över tid — det används bara för att räkna
 * unika besök per dag.
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw) {
      const [day, id] = raw.split("|");
      if (day === today && id) return id;
    }
    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem(SESSION_KEY, `${today}|${generated}`);
    return generated;
  } catch {
    return "unknown";
  }
}

/**
 * Fire-and-forget anonymous usage tracking. Never throws, never blocks the
 * caller, and never includes personal content (mood notes, task text, etc.) —
 * only which app section and which action happened.
 */
export function trackEvent(section: string, action: string): void {
  if (typeof window === "undefined") return;
  recordUsage(section);
  const sessionId = getSessionId();
  logAnalyticsEventFn({ data: { sessionId, section, action } }).catch(() => {
    // Analytics must never disrupt the user experience.
  });
}
