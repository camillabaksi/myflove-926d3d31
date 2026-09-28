import { logAnalyticsEventFn } from "@/lib/analytics.functions";
import { touchLastActive } from "@/lib/last-active";
import { isDemoSession } from "@/lib/demo-account";
import { recordUsage } from "@/lib/usage-local";
import { sanitizeEventName } from "@/lib/analytics-sanitize";
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

/**
 * Läser webbläsarens anonyma statistik-id. Används av adminvyn för att kunna
 * märka den här webbläsaren som intern (grundare/test) — aldrig för spårning.
 */
export function getAnalyticsSessionId(): string {
  return getSessionId();
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
  if (isDemoSession()) return;
  touchLastActive();
  if (!analyticsEnabled()) return;
  const safeSection = sanitizeEventName(section);
  const safeAction = sanitizeEventName(action);
  if (!safeSection || !safeAction) return;
  recordUsage(safeSection);
  const sessionId = getSessionId();
  logAnalyticsEventFn({ data: { sessionId, section: safeSection, action: safeAction } }).catch(
    () => {
      // Analytics must never disrupt the user experience.
    },
  );
}

/**
 * Skydd mot dubbelloggning: identiska "visnings"-event (öppnat/visat) som
 * kommer inom kort tid räknas som ETT. Det gör att React StrictMode,
 * omrenderingar och snabba navigeringar fram och tillbaka inte blåser upp
 * statistiken. Riktiga handlingar (t.ex. avbockade uppgifter) dedupliceras
 * aldrig – de ska kunna ske flera gånger.
 */
const VIEW_DEDUPE_MS = 2000;
const lastSeen = new Map<string, number>();

function isViewEvent(name: AnalyticsEventName): boolean {
  return name.endsWith("_viewed") || name.endsWith("_opened");
}

/** Endast för tester: nollställer dubblettskyddet. */
export function resetAnalyticsDedupe(): void {
  lastSeen.clear();
}

/**
 * Spårar en sidvisning (besöksanalys). Anropas automatiskt vid varje
 * navigering i appen. Sökvägen mappas om till en säker, anonym etikett
 * (t.ex. "/mitt-batteri" → "mitt-batteri", "/" → "start") och dedupliceras
 * så att samma sida inte loggas flera gånger i rad.
 */
const lastTrackedPath = { value: "" as string, at: 0 };

export function trackPageView(pathname: string): void {
  if (typeof window === "undefined") return;
  if (!analyticsEnabled()) return;
  const slug =
    pathname === "/"
      ? "start"
      : pathname
          .replace(/^\/+|\/+$/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 48);
  if (!slug || !sanitizeEventName(slug)) return;
  const now = Date.now();
  if (lastTrackedPath.value === slug && now - lastTrackedPath.at < VIEW_DEDUPE_MS) return;
  lastTrackedPath.value = slug;
  lastTrackedPath.at = now;
  trackEvent("page", slug);
}

/**
 * Det enda sättet att logga produktflöden i MyFlove.
 * Namnet måste finnas i event-schemat och payloaden saneras innan den skickas,
 * så att inget känsligt innehåll kan följa med. Exakt ett event skickas per
 * anrop – den äldre trackEvent()-vägen anropas bara härifrån.
 */
export function track(name: AnalyticsEventName, payload?: AnalyticsPayload): void {
  if (typeof window === "undefined") return;
  if (isDemoSession()) return;
  if (!analyticsEnabled()) return;
  const clean = sanitizePayload(payload);
  const section = eventSection(name);
  if (isViewEvent(name)) {
    const key = `${name}|${clean.source ?? ""}`;
    const now = Date.now();
    const prev = lastSeen.get(key);
    if (prev != null && now - prev < VIEW_DEDUPE_MS) return;
    lastSeen.set(key, now);
  }
  try {
    getAnalyticsSink()?.({ name, section, payload: clean });
  } catch {
    // En extern leverantör får aldrig påverka appen.
  }
  trackEvent(section, name);
}
