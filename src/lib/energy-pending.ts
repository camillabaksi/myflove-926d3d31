/**
 * Energiloggar som väntar på att flyttas upp till kontot.
 *
 * Loggar som görs innan inloggning (eller när nätet ligger nere) sparas
 * lokalt under `myflove-energy-pending`. De ligger kvar tills molnet
 * bekräftat varje enskild post – misslyckas en insert behålls posten och
 * försöket görs om vid nästa inloggning, när nätet kommer tillbaka eller
 * vid nästa periodiska försök.
 *
 * Idempotens: varje post har en stabil tidsstämpel (`logged_at`) och nivå.
 * Innan en post skickas jämförs den mot de poster som redan finns i
 * `energy_logs` – finns en post med samma sekund och samma nivå räknas den
 * som redan migrerad och tas bort lokalt utan ny insert. Det gör att en
 * avbruten migrering (insert lyckades men den lokala rensningen hann inte)
 * aldrig skapar dubbletter.
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

/** Nyckel för jämförelse: samma sekund + samma nivå = samma observation. */
export function energyFingerprint(entry: { level: number; logged_at: string }): string {
  const seconds = new Date(entry.logged_at).toISOString().slice(0, 19);
  return `${seconds}|${entry.level}`;
}

/** Poster som redan finns i molnet (eller är dubbletter av varandra). */
export function splitAlreadyMigrated(
  pending: PendingEnergyEntry[],
  cloud: { level: number; logged_at: string }[],
): { toInsert: PendingEnergyEntry[]; alreadyThere: PendingEnergyEntry[] } {
  const seen = new Set(cloud.map(energyFingerprint));
  const toInsert: PendingEnergyEntry[] = [];
  const alreadyThere: PendingEnergyEntry[] = [];
  for (const entry of pending) {
    const key = energyFingerprint(entry);
    if (seen.has(key)) {
      alreadyThere.push(entry);
    } else {
      seen.add(key);
      toInsert.push(entry);
    }
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
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Flyttar väntande loggar till `energy_logs`, en i taget så att ett fel på
 * en post inte blockerar de andra. Ett andra molnread gör kontrollen mot
 * hela historiken, även om en gammal pending-post ligger utanför listan som
 * visas i gränssnittet. UUID-poster skrivs med upsert på sitt stabila id;
 * äldre lokala id:n använder fingerprint-kontrollen ovan.
 */
export async function migratePendingEnergy(
  userId: string,
  pending: PendingEnergyEntry[],
  cloud: { level: number; logged_at: string }[],
): Promise<MigrationResult> {
  if (pending.length === 0) return { migrated: [], remaining: [], inserted: [] };

  const { data: history } = await supabase
    .from("energy_logs")
    .select("id, level, logged_at")
    .eq("user_id", userId);
  const knownCloud = history ?? cloud;
  const { toInsert, alreadyThere } = splitAlreadyMigrated(pending, knownCloud);
  const migrated: PendingEnergyEntry[] = [...alreadyThere];
  const remaining: PendingEnergyEntry[] = [];
  const inserted: CloudEnergyRow[] = [];

  for (const entry of toInsert) {
    try {
      const payload = {
        ...(isUuid(entry.id) ? { id: entry.id } : {}),
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

  return { migrated, remaining, inserted };
}

