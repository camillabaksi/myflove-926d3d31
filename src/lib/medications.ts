/**
 * Medicin – en enda sanningskälla.
 *
 * Historiskt har medicinlistan legat under flera nycklar (`myflow-medications`,
 * `myflove-medications`) och loggen under `myflow-medication-log`. Det gjorde att
 * listan i appen kunde se tom ut samtidigt som påminnelsemotorn läste (eller hade
 * schemalagt utifrån) en annan källa.
 *
 * Här samlas den kanoniska nyckeln, normaliseringen av gamla format och
 * migreringen. Både medicinlistan och påminnelserna läser exakt samma data.
 * All lagring går via secure-local, så den fortsätter vara krypterad och
 * fortsätter rensas vid utloggning (prefixet `myflove-`).
 */
import { secureGetItem, secureSetItem } from "@/lib/secure-local";
import { occursOn, type RepeatMode } from "@/lib/recurrence";

export type { RepeatMode };

export const MEDICATIONS_KEY = "myflove-medications";
export const MEDICATION_LOG_KEY = "myflove-medication-log";

/** Gamla nycklar som migreras in i den kanoniska nyckeln och sedan tas bort. */
export const LEGACY_MEDICATION_KEYS = ["myflow-medications"] as const;
export const LEGACY_MEDICATION_LOG_KEYS = ["myflow-medication-log"] as const;

export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  times: string[]; // HH:MM, sorterade
  createdAt: number;
  /** Hur ofta medicinen tas. Saknas = varje dag (gammal data). */
  repeat?: RepeatMode;
  /** Startdatum (YYYY-MM-DD). Krävs för engångsdoser. */
  startDate?: string;
}

/** Ska medicinen tas den här dagen? */
export function medicationOccursOn(med: Medication, dateStr: string): boolean {
  const repeat = med.repeat ?? "daily";
  if (repeat === "daily" && !med.startDate) return true;
  const start = med.startDate ?? dateStr;
  return occursOn(start, repeat, dateStr);
}

export interface MedicationLogEntry {
  medId: string;
  time: string; // HH:MM
  date: string; // YYYY-MM-DD
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function normalizeTime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const padded = /^\d:\d\d$/.test(trimmed) ? `0${trimmed}` : trimmed.slice(0, 5);
  return TIME_RE.test(padded) ? padded : null;
}

/** Stabilt id för gamla poster som saknar id – samma namn ger samma id. */
function fallbackId(name: string, times: string[]): string {
  const base = `${name.toLowerCase().trim()}|${times.join(",")}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) hash = (hash * 31 + base.charCodeAt(i)) | 0;
  return `med-${Math.abs(hash).toString(36)}`;
}

/** Tolkar valfritt historiskt format till en giltig medicinlista. */
export function normalizeMedications(raw: unknown): Medication[] {
  if (!Array.isArray(raw)) return [];
  const out: Medication[] = [];
  for (const entry of raw) {
    if (typeof entry === "string") {
      const name = entry.trim();
      if (!name) continue;
      out.push({ id: fallbackId(name, []), name, times: [], createdAt: 0 });
      continue;
    }
    if (!entry || typeof entry !== "object") continue;
    const rec = entry as Record<string, unknown>;
    const name = typeof rec.name === "string" ? rec.name.trim() : "";
    if (!name) continue;

    const rawTimes: unknown[] = Array.isArray(rec.times)
      ? rec.times
      : rec.times !== undefined
        ? [rec.times]
        : rec.time !== undefined
          ? [rec.time]
          : [];
    const times = Array.from(
      new Set(rawTimes.map(normalizeTime).filter((t): t is string => t !== null)),
    ).sort();

    const dosage =
      typeof rec.dosage === "string" && rec.dosage.trim() ? rec.dosage.trim() : undefined;
    const id =
      typeof rec.id === "string" && rec.id.trim() ? rec.id.trim() : fallbackId(name, times);
    const createdAt = typeof rec.createdAt === "number" ? rec.createdAt : 0;
    const repeat: RepeatMode =
      rec.repeat === "none" || rec.repeat === "weekdays" || rec.repeat === "weekly"
        ? rec.repeat
        : "daily";
    const startDate =
      typeof rec.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rec.startDate.slice(0, 10))
        ? rec.startDate.slice(0, 10)
        : undefined;
    out.push({ id, name, dosage, times, createdAt, repeat, startDate });
  }
  return dedupeMedications(out);
}

function signature(med: Medication): string {
  return `${med.name.toLowerCase().trim()}|${med.times.join(",")}|${med.repeat ?? "daily"}|${med.startDate ?? ""}`;
}

/** Tar bort dubbletter både på id och på namn+tider (samma medicin två gånger). */
export function dedupeMedications(list: Medication[]): Medication[] {
  const byId = new Set<string>();
  const bySig = new Set<string>();
  const out: Medication[] = [];
  for (const med of list) {
    if (byId.has(med.id) || bySig.has(signature(med))) continue;
    byId.add(med.id);
    bySig.add(signature(med));
    out.push(med);
  }
  return out;
}

/** Slår ihop gammal och ny lista utan dubbletter – nya listan vinner. */
export function mergeMedications(primary: Medication[], legacy: Medication[]): Medication[] {
  return dedupeMedications([...primary, ...legacy]);
}

export function normalizeMedicationLog(raw: unknown): MedicationLogEntry[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: MedicationLogEntry[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const rec = entry as Record<string, unknown>;
    const medId = typeof rec.medId === "string" ? rec.medId : "";
    const time = normalizeTime(rec.time);
    const date = typeof rec.date === "string" ? rec.date.slice(0, 10) : "";
    if (!medId || !time || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const key = `${medId}|${time}|${date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ medId, time, date });
  }
  return out;
}

export function mergeMedicationLog(
  primary: MedicationLogEntry[],
  legacy: MedicationLogEntry[],
): MedicationLogEntry[] {
  return normalizeMedicationLog([...primary, ...legacy]);
}

function readJson(key: string): unknown {
  const raw = secureGetItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export interface MedicationMigrationResult {
  medications: Medication[];
  log: MedicationLogEntry[];
  /** Sant när något faktiskt skrevs om (gammal nyckel eller gammalt format). */
  changed: boolean;
  /** Endast poster från gamla nycklar – bara dessa får lyftas till molnet. */
  legacyMedications: Medication[];
  legacyLog: MedicationLogEntry[];
}

/**
 * Migrera gamla nycklar/format till den nya lagringen. Idempotent.
 */
export function migrateMedicationStorage(): MedicationMigrationResult {
  const currentRaw = readJson(MEDICATIONS_KEY);
  const currentLogRaw = readJson(MEDICATION_LOG_KEY);

  let medications = normalizeMedications(currentRaw);
  let log = normalizeMedicationLog(currentLogRaw);
  let changed = false;
  let legacyMedications: Medication[] = [];
  let legacyLog: MedicationLogEntry[] = [];

  for (const legacyKey of LEGACY_MEDICATION_KEYS) {
    const legacyRaw = readJson(legacyKey);
    if (legacyRaw === null) continue;
    const items = normalizeMedications(legacyRaw);
    legacyMedications = mergeMedications(legacyMedications, items);
    medications = mergeMedications(medications, items);
    removeKey(legacyKey);
    changed = true;
  }

  for (const legacyKey of LEGACY_MEDICATION_LOG_KEYS) {
    const legacyRaw = readJson(legacyKey);
    if (legacyRaw === null) continue;
    const items = normalizeMedicationLog(legacyRaw);
    legacyLog = mergeMedicationLog(legacyLog, items);
    log = mergeMedicationLog(log, items);
    removeKey(legacyKey);
    changed = true;
  }

  // Loggrader för borttagna mediciner ska inte ligga kvar.
  const ids = new Set(medications.map((m) => m.id));
  const prunedLog = log.filter((l) => ids.has(l.medId));
  if (prunedLog.length !== log.length) {
    log = prunedLog;
    changed = true;
  }

  if (changed || JSON.stringify(currentRaw ?? []) !== JSON.stringify(medications)) {
    secureSetItem(MEDICATIONS_KEY, JSON.stringify(medications));
    changed = true;
  }
  if (changed || JSON.stringify(currentLogRaw ?? []) !== JSON.stringify(log)) {
    secureSetItem(MEDICATION_LOG_KEY, JSON.stringify(log));
    changed = true;
  }

  return { medications, log, changed, legacyMedications, legacyLog };
}

function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* utan lagring finns inget att ta bort */
  }
}

// ---- Påminnelsenycklar ------------------------------------------------------

export const MEDICATION_REMINDER_PREFIX = "med:";

export function medicationReminderKey(medId: string, date: string, time: string): string {
  return `${MEDICATION_REMINDER_PREFIX}${medId}:${date}:${time}`;
}

/** Plockar ut medicin-id ur en påminnelsenyckel (`med:<id>:<datum>:<tid>`). */
export function medicationIdFromReminderKey(clientKey: string): string | null {
  if (!clientKey.startsWith(MEDICATION_REMINDER_PREFIX)) return null;
  const rest = clientKey.slice(MEDICATION_REMINDER_PREFIX.length);
  const parts = rest.split(":");
  // <id>:<datum>:<hh>:<mm> – de tre sista delarna är datum och tid.
  if (parts.length < 4) return null;
  return parts.slice(0, parts.length - 3).join(":") || null;
}

/**
 * Vilka köade medicinpåminnelser hör inte längre till en aktiv medicin?
 * Används både i klienten och i testerna för att garantera att listan och
 * påminnelserna aldrig går isär.
 */
export function staleMedicationReminderKeys(
  queuedKeys: string[],
  medications: Medication[],
): string[] {
  const active = new Set(medications.filter((m) => m.times.length > 0).map((m) => m.id));
  return queuedKeys.filter((key) => {
    const id = medicationIdFromReminderKey(key);
    return id !== null && !active.has(id);
  });
}
