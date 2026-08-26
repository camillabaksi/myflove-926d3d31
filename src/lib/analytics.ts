import { logAnalyticsEventFn } from "@/lib/analytics.functions";
import { recordUsage } from "@/lib/usage-local";
import {
  eventSection,
  getAnalyticsSink,
  sanitizePayload,
  type AnalyticsEventName,
  type AnalyticsPayload,
} from "@/lib/analytics-events";

const SESSION_KEY = "myflow-analytics-session-id";
/** Användarens egen avstängning av anonym statistik. */
export const ANALYTICS_OPT_OUT_KEY = "myflove-analytics-opt-out";

/**
 * Slumpat, anonymt id som lagras lokalt i webbläsaren. Det innehåller ingen
 * personlig information och kopplas aldrig till ett konto, en e-post eller en
 * IP — det används bara för att räkna unika besök och återkomst.
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem(SESSION_KEY, generated);
    return generated;
  } catch {
    return "unknown";
  }
}

/** Respekterar användarens val att stänga av anonym statistik. */
export function analyticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) !== "1";
  } catch {
    return true;
  }
}

/**
 * Fire-and-forget anonymous usage tracking. Never throws, never blocks the
 * caller, and never includes personal content (mood notes, task text, etc.) —
 * only which app section and which action happened.
 */
export function trackEvent(section: string, action: string): void {
  if (typeof window === "undefined") return;
  if (!analyticsEnabled()) return;
  recordUsage(section);
  const sessionId = getSessionId();
  logAnalyticsEventFn({ data: { sessionId, section, action } }).catch(() => {
    // Analytics must never disrupt the user experience.
  });
}

/**
 * Det enda sättet att logga produktflöden i MyFlove.
 * Namnet måste finnas i event-schemat och payloaden saneras innan den skickas,
 * så att inget känsligt innehåll kan följa med.
 */
export function track(name: AnalyticsEventName, payload?: AnalyticsPayload): void {
  if (typeof window === "undefined") return;
  if (!analyticsEnabled()) return;
  const clean = sanitizePayload(payload);
  const section = eventSection(name);
  try {
    getAnalyticsSink()?.({ name, section, payload: clean });
  } catch {
    // En extern leverantör får aldrig påverka appen.
  }
  trackEvent(section, name);
}
