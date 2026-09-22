/**
 * Helhetsöversättning till engelska.
 *
 * Den handskrivna ordlistan i `@/lib/i18n` går alltid först. Text som inte
 * finns där översätts en gång via Flow och sparas lokalt, så att skärmarna
 * blir helt engelska utan att varje vy behöver skrivas om.
 */

import { translate } from "@/lib/i18n";

const CACHE_KEY = "myflove-auto-en-v1";
const MAX_CACHE_ENTRIES = 4000;

let cache: Record<string, string> | null = null;

function readCache(): Record<string, string> {
  if (cache) return cache;
  if (typeof window === "undefined") return (cache = {});
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    cache = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function writeCache() {
  if (typeof window === "undefined" || !cache) return;
  try {
    const entries = Object.entries(cache);
    const trimmed = entries.length > MAX_CACHE_ENTRIES ? entries.slice(-MAX_CACHE_ENTRIES) : entries;
    cache = Object.fromEntries(trimmed);
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* fullt lagringsutrymme – strunt samma, vi översätter om nästa gång */
  }
}

/** Slår upp en färdig engelsk text: ordlistan först, sedan den sparade. */
export function lookupEnglish(text: string): string | null {
  const viaDict = translate(text, "en");
  if (viaDict !== text) return viaDict;
  const hit = readCache()[text];
  return hit ?? null;
}

/** Texter som inte är värda att skicka iväg: siffror, symboler, tomrum. */
export function isTranslatable(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2 || trimmed.length > 600) return false;
  if (!/[a-zA-ZåäöÅÄÖ]/.test(trimmed)) return false;
  if (/^\d[\d\s.,:/-]*$/.test(trimmed)) return false;
  return true;
}

const pending = new Set<string>();
const failed = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight = 0;
const MAX_PARALLEL = 3;

type Listener = () => void;
const listeners = new Set<Listener>();

/** Anropas när nya översättningar har landat, så att DOM:en kan uppdateras. */
export function onTranslationsReady(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Köa en okänd svensk sträng för översättning. */
export function queueForTranslation(text: string) {
  if (failed.has(text) || pending.has(text) || readCache()[text]) return;
  pending.add(text);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flush(), 250);
}

async function flush() {
  flushTimer = null;
  if (inFlight >= MAX_PARALLEL || pending.size === 0) return;

  const batch = Array.from(pending).slice(0, 40);
  batch.forEach((t) => pending.delete(t));
  inFlight += 1;
  try {
    const { autoTranslateToEnglish } = await import("@/lib/auto-translate.functions");
    const result = await autoTranslateToEnglish({ data: { texts: batch } });
    const store = readCache();
    let got = 0;
    for (const [sv, en] of Object.entries(result.translations ?? {})) {
      if (typeof en === "string" && en.trim()) {
        store[sv] = en;
        got += 1;
      }
    }
    batch.forEach((t) => {
      if (!store[t]) failed.add(t);
    });
    if (got > 0) {
      writeCache();
      listeners.forEach((l) => l());
    }
  } catch {
    // Misslyckas översättningen står svenskan kvar – aldrig tom text.
    batch.forEach((t) => failed.add(t));
  } finally {
    inFlight -= 1;
    if (pending.size > 0) flushTimer = setTimeout(() => void flush(), 150);
  }
}

/** Rensar det som sparats lokalt (används av inställningen). */
export function clearTranslationCache() {
  cache = {};
  failed.clear();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(CACHE_KEY);
    } catch {
      /* ignorera */
    }
  }
}
