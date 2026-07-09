import { logAnalyticsEventFn } from "@/lib/analytics.functions";

const SESSION_KEY = "myflow-analytics-session-id";

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
 * Fire-and-forget anonymous usage tracking. Never throws, never blocks the
 * caller, and never includes personal content (mood notes, task text, etc.) —
 * only which app section and which action happened.
 */
export function trackEvent(section: string, action: string): void {
  if (typeof window === "undefined") return;
  const sessionId = getSessionId();
  logAnalyticsEventFn({ data: { sessionId, section, action } }).catch(() => {
    // Analytics must never disrupt the user experience.
  });
}
