/**
 * Investerar-/demokonto.
 *
 * Ett helt vanligt användarkonto med normal behörighet – ingen ny roll, inga
 * nya tabeller. Det enda som skiljer är en flagga i användarens metadata som
 * gör att appen kan (1) fylla kontot med syntetisk exempeldata en gång och
 * (2) hålla demoanvändningen utanför riktiga produktmått.
 *
 * Lösenordet finns aldrig i koden – kontot skapas manuellt (se DEMO_ACCOUNT.md).
 */

/** Standardadress för demokontot. Metadata-flaggan är den primära signalen. */
export const DEMO_EMAIL = "investor@myflove.se";

/** Visningsnamn som används i demobannern. */
export const DEMO_DISPLAY_NAME = "Paceable Demo";

/** Lokal enhetsflagga så att synkron kod (analytics) vet att sessionen är demo. */
export const DEMO_SESSION_KEY = "myflove-demo-session";

type MetadataLike = Record<string, unknown> | null | undefined;

export interface DemoUserLike {
  email?: string | null;
  user_metadata?: MetadataLike;
}

/** Är det här kontot demokontot? Metadata först, e-post som reserv. */
export function isDemoUser(user: DemoUserLike | null | undefined): boolean {
  if (!user) return false;
  const meta = user.user_metadata ?? {};
  if (meta["demo_account"] === true || meta["demo_account"] === "true") return true;
  return (user.email ?? "").toLowerCase() === DEMO_EMAIL;
}

/** Läser enhetsflaggan – används där vi inte kan await:a auth (t.ex. track()). */
export function isDemoSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DEMO_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/** Sätter/rensar enhetsflaggan när inloggningen ändras. */
export function setDemoSession(active: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_SESSION_KEY, active ? "1" : "0");
  } catch {
    /* utan lagring får sessionen bara inte demoflaggan */
  }
}
