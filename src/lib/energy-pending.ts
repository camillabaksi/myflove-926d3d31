/**
 * Energiloggar som väntar på att flyttas upp till kontot.
 *
 * Loggar som görs innan inloggning (eller när nätet ligger nere) sparas
 * lokalt under `myflove-energy-pending`. De ligger kvar tills molnet
 * bekräftat varje enskild post – misslyckas en insert behålls posten och
 * försöket görs om vid nästa inloggning, när nätet kommer tillbaka eller
 * vid nästa periodiska försök.
 *
 * Idempotens: varje post identifieras av ett stabilt UUID. Äldre poster som
 * saknar UUID får ett eget nytt UUID som sparas lokalt INNAN migreringen
 * skickar upp något. Två historiska observationer med samma tidsstämpel och
 * samma nivå förblir därför två separata poster – de slås aldrig ihop.
 * Posten skrivs med upsert på sitt id, så en avbruten migrering (insert
 * lyckades men den lokala rensningen hann inte) aldrig skapar dubbletter.
 */
import { supabase } from "@/integrations/supabase/client";

export const PENDING_ENERGY_KEY = "myflove-energy-pending";

export interface PendingEnergyEntry {
  id: string;
  level: number;
  logged_at: string;
}

interface CloudEnergyRow {
  id: string;
  level: number;
  logged_at: string;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function newUuid(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Ger varje äldre post (utan UUID) ett eget stabilt UUID. Övriga värden och
 * original-tidsstämpeln behålls exakt. `changed` säger om kön behöver sparas
 * om lokalt innan migreringen körs.
 */
export function ensurePendingUuids(pending: PendingEnergyEntry[]): {
  entries: PendingEnergyEntry[];
  changed: boolean;
} {
  let changed = false;
  const entries = pending.map((entry) => {
    if (isUuid(entry.id)) return entry;
    changed = true;
    return { ...entry, id: newUuid() };
  });
  return { entries, changed };
}

/** Poster vars id redan finns i molnet – de ska inte skrivas igen. */
export function splitAlreadyMigrated(
  pending: PendingEnergyEntry[],
  cloud: { id?: string }[],
): { toInsert: PendingEnergyEntry[]; alreadyThere: PendingEnergyEntry[] } {
  const seen = new Set(cloud.map((row) => row.id).filter(Boolean) as string[]);
  const toInsert: PendingEnergyEntry[] = [];
  const alreadyThere: PendingEnergyEntry[] = [];
  for (const entry of pending) {
    if (seen.has(entry.id)) alreadyThere.push(entry);
    else toInsert.push(entry);
  }
  return { toInsert, alreadyThere };
}

export interface MigrationResult {
  /** Poster som nu är säkert sparade på kontot. */
  migrated: PendingEnergyEntry[];
  /** Poster som fortfarande ligger kvar lokalt och ska försökas igen. */
  remaining: PendingEnergyEntry[];
  /** Nya rader från molnet (för att uppdatera vyn direkt). */
  inserted: CloudEnergyRow[];
  /** Kön med UUID påsatta – ska sparas lokalt av anroparen. */
  normalized: PendingEnergyEntry[];
}

/**
 * Flyttar väntande loggar till `energy_logs`, en i taget så att ett fel på
 * en post inte blockerar de andra. Ett andra molnread gör kontrollen mot
 * hela historiken, även om en gammal pending-post ligger utanför listan som
 * visas i gränssnittet. Alla poster skrivs med upsert på sitt stabila UUID.
 */
export async function migratePendingEnergy(
  userId: string,
  pending: PendingEnergyEntry[],
  cloud: { id?: string }[],
): Promise<MigrationResult> {
  if (pending.length === 0)
    return { migrated: [], remaining: [], inserted: [], normalized: [] };

  const { entries } = ensurePendingUuids(pending);

  const { data: history } = await supabase
    .from("energy_logs")
    .select("id, level, logged_at")
    .eq("user_id", userId);
  const knownCloud = history ?? cloud;
  const { toInsert, alreadyThere } = splitAlreadyMigrated(entries, knownCloud);
  const migrated: PendingEnergyEntry[] = [...alreadyThere];
  const remaining: PendingEnergyEntry[] = [];
  const inserted: CloudEnergyRow[] = [];

  for (const entry of toInsert) {
    try {
      const payload = {
        id: entry.id,
        user_id: userId,
        level: entry.level,
        logged_at: entry.logged_at,
      };
      const { data, error } = await supabase
        .from("energy_logs")
        .upsert(payload, { onConflict: "id" })
        .select("id, level, logged_at")
        .single();
      if (error || !data) {
        // Nätverksfel eller serverfel – behåll posten och försök igen senare.
        remaining.push(entry);
        continue;
      }
      migrated.push(entry);
      inserted.push(data as CloudEnergyRow);
    } catch {
      remaining.push(entry);
    }
  }

  return { migrated, remaining, inserted, normalized: entries };
}
