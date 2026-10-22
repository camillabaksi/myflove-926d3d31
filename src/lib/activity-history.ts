// Historik – vad hände den här dagen?
//
// Historiken svarar aldrig på "vad har användaren någonsin lagt in i appen".
// Varje aktivitet hör till ett datum, och varje förekomst av en återkommande
// aktivitet är en egen instans med egen status och egen energipåverkan.
//
// Ingen ny källa till sanning: aktiviteterna bor kvar i uppgifter och
// påminnelser. Här lagras bara det som är specifikt för en enskild dag
// (status, flytt, faktisk energi) i en liten instansjournal.

import { occursOn, type RepeatMode } from "@/lib/recurrence";
import { addDaysISO, dayOf } from "@/lib/day";

/** Statusar en aktivitetsinstans kan ha. */
export type ActivityStatus = "planerad" | "pagar" | "genomford" | "installd" | "flyttad";

export const STATUS_LABELS: Record<ActivityStatus, string> = {
  planerad: "Planerad",
  pagar: "Pågår",
  genomford: "Genomförd",
  installd: "Inställd",
  flyttad: "Flyttad",
};

/** Hur en genomförd aktivitet faktiskt påverkade orken. */
export type ActivityEnergy = "gives" | "both" | "neutral" | "drains_little" | "drains_much";

export const ENERGY_META: Record<
  ActivityEnergy,
  { dot: string; label: string; ask: string; score: number }
> = {
  gives: { dot: "🟢", label: "Gav energi", ask: "Ge energi", score: 2 },
  both: { dot: "↔️", label: "Både och", ask: "Både och", score: 0 },
  neutral: { dot: "🟡", label: "Neutral", ask: "Neutral", score: 0 },
  drains_little: { dot: "🟠", label: "Tog lite energi", ask: "Ta lite", score: -1 },
  drains_much: { dot: "🔴", label: "Tog mycket energi", ask: "Ta mycket", score: -2 },
};

export const ENERGY_CHOICES: ActivityEnergy[] = [
  "gives",
  "neutral",
  "drains_little",
  "drains_much",
];

/** Äldre svar (Att göra™) översätts till historikens fyra nivåer. */
export function fromTaskEnergy(
  value: "drains" | "gives" | "both" | "neutral" | "unknown" | undefined,
): ActivityEnergy | undefined {
  if (value === "gives") return "gives";
  if (value === "drains") return "drains_little";
  if (value === "both") return "both";
  if (value === "neutral") return "neutral";
  return undefined;
}

/** En aktivitet som den ser ut i sin källa (uppgift, påminnelse, barnpost). */
export interface ActivitySource {
  id: string;
  title: string;
  /** Planerat datum (YYYY-MM-DD). Startdatum om aktiviteten återkommer. */
  plannedDate: string;
  startTime?: string;
  endTime?: string;
  repeat?: RepeatMode;
  /** Slutdatum för återkommande aktiviteter. */
  until?: string;
  completed?: boolean;
  completedAt?: number;
  /** Förväntad energipåverkan, satt innan aktiviteten. */
  expectedEnergy?: ActivityEnergy;
  /** Faktisk energi från källan (gäller bara engångsaktiviteter). */
  actualEnergy?: ActivityEnergy;
  canceled?: boolean;
  kind?: string;
}

/** Det som är unikt för en enskild dag – lagras i journalen. */
export interface InstanceRecord {
  /** `${sourceId}|${plannedDate}` – stabil nyckel per förekomst. */
  key: string;
  sourceId: string;
  /** Ursprungligt planerat datum för förekomsten. */
  date: string;
  status?: ActivityStatus;
  completedAt?: number;
  /** Faktisk genomförandedag (kan skilja sig från planerat datum). */
  actualDate?: string;
  /** Om förekomsten flyttats: nytt datum. */
  movedTo?: string;
  expectedEnergy?: ActivityEnergy;
  energyImpact?: ActivityEnergy;
  energyImpactRecordedAt?: number;
  /** Befintlig energipost: ändringar och retries återanvänder samma post. */
  energyFactorId?: string;
  energyFactorOccurredAt?: string;
}

/** En konkret aktivitet på ett konkret datum. */
export interface ActivityInstance {
  key: string;
  sourceId: string;
  title: string;
  /** Datum instansen visas på (efter eventuell flytt). */
  date: string;
  plannedDate: string;
  startTime?: string;
  endTime?: string;
  status: ActivityStatus;
  completedAt?: number;
  actualDate?: string;
  expectedEnergy?: ActivityEnergy;
  energyImpact?: ActivityEnergy;
  energyImpactRecordedAt?: number;
  recurring: boolean;
}

export function instanceKey(sourceId: string, date: string): string {
  return `${sourceId}|${date}`;
}

/** Journalen som en uppslagstabell. */
export function recordMap(records: InstanceRecord[]): Map<string, InstanceRecord> {
  const map = new Map<string, InstanceRecord>();
  for (const r of records) map.set(r.key, r);
  return map;
}

function datesBetween(from: string, to: string): string[] {
  if (from > to) return [];
  const out: string[] = [];
  let day = from;
  // Skydd mot orimliga intervall – historiken tittar aldrig på år i taget.
  for (let i = 0; i < 400 && day <= to; i += 1) {
    out.push(day);
    day = addDaysISO(day, 1);
  }
  return out;
}

/**
 * Expanderar källor till faktiska datuminstanser i ett intervall.
 *
 * En återkommande aktivitet ger EN instans per datum den faktiskt inträffar –
 * varje instans har sin egen status och sin egen energipåverkan. En instans
 * som flyttats visas bara på sitt nya datum.
 */
export function expandInstances(
  sources: ActivitySource[],
  records: InstanceRecord[],
  from: string,
  to: string,
): ActivityInstance[] {
  const byKey = recordMap(records);
  const days = datesBetween(from, to);
  const out: ActivityInstance[] = [];

  for (const source of sources) {
    if (!source.plannedDate) continue;
    const repeat = source.repeat ?? "none";
    const recurring = repeat !== "none";
    // Ett flyttat datum kan ligga utanför intervallet – vi tittar därför på
    // både dagarna i intervallet och de journalposter som pekar hit.
    const candidateDates = new Set<string>();
    for (const day of days) {
      if (source.until && day > source.until) continue;
      if (occursOn(source.plannedDate, repeat, day)) candidateDates.add(day);
    }
    for (const record of records) {
      if (record.sourceId !== source.id) continue;
      if (record.movedTo && days.includes(record.movedTo)) candidateDates.add(record.date);
    }

    for (const plannedDate of candidateDates) {
      const record = byKey.get(instanceKey(source.id, plannedDate));
      const shownDate = record?.movedTo ?? plannedDate;
      if (!days.includes(shownDate)) continue;

      const completedAt = record?.completedAt ?? (recurring ? undefined : source.completedAt);
      const completedDay = dayOf(completedAt);
      const derivedStatus: ActivityStatus = source.canceled
        ? "installd"
        : record?.status
          ? record.status
          : completedDay && completedDay === shownDate
            ? "genomford"
            : // En engångsaktivitet som bockats av hör till sin planerade dag,
              // även om avbockningen gjordes en annan dag. Annars skulle den
              // ligga kvar som "planerad" för alltid och aldrig synas i historiken.
              !recurring && source.completed
              ? "genomford"
              : "planerad";

      out.push({
        key: instanceKey(source.id, plannedDate),
        sourceId: source.id,
        title: source.title,
        date: shownDate,
        plannedDate,
        startTime: source.startTime,
        endTime: source.endTime,
        status: derivedStatus,
        completedAt,
        actualDate:
          record?.actualDate ??
          (derivedStatus === "genomford" ? (completedDay ?? shownDate) : undefined),
        expectedEnergy: record?.expectedEnergy ?? source.expectedEnergy,
        energyImpact: record?.energyImpact ?? (recurring ? undefined : source.actualEnergy),
        energyImpactRecordedAt: record?.energyImpactRecordedAt,
        recurring,
      });
    }
  }

  return out.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99") ||
      a.title.localeCompare(b.title),
  );
}

/** Skriver (eller skapar) journalposten för en instans. */
export function upsertRecord(
  records: InstanceRecord[],
  sourceId: string,
  date: string,
  patch: Partial<Omit<InstanceRecord, "key" | "sourceId" | "date">>,
): InstanceRecord[] {
  const key = instanceKey(sourceId, date);
  const existing = records.find((r) => r.key === key);
  if (existing) return records.map((r) => (r.key === key ? { ...r, ...patch } : r));
  return [...records, { key, sourceId, date, ...patch }];
}

/**
 * Flyttar en förekomst till ett nytt datum. Den gamla kopplingen uppdateras –
 * aktiviteten ligger aldrig kvar som genomförd på en dag den inte hände.
 */
export function moveInstance(
  records: InstanceRecord[],
  sourceId: string,
  fromDate: string,
  toDate: string,
): InstanceRecord[] {
  return upsertRecord(records, sourceId, fromDate, {
    movedTo: toDate === fromDate ? undefined : toDate,
    status: "planerad",
    completedAt: undefined,
    actualDate: undefined,
  });
}

/** Markerar en förekomst som genomförd på just den dagen. */
export function completeInstance(
  records: InstanceRecord[],
  sourceId: string,
  date: string,
  at = Date.now(),
): InstanceRecord[] {
  return upsertRecord(records, sourceId, date, {
    status: "genomford",
    completedAt: at,
    actualDate: dayOf(at) ?? date,
  });
}

/** Sparar hur aktiviteten faktiskt kändes. Alltid frivilligt. */
export function recordEnergy(
  records: InstanceRecord[],
  sourceId: string,
  date: string,
  energy: ActivityEnergy,
  at = Date.now(),
  factor?: { id: string; occurredAt: string },
  actualDate?: string,
): InstanceRecord[] {
  return upsertRecord(records, sourceId, date, {
    energyImpact: energy,
    energyImpactRecordedAt: at,
    ...(factor ? { energyFactorId: factor.id, energyFactorOccurredAt: factor.occurredAt } : {}),
    ...(actualDate ? { actualDate } : {}),
  });
}

/** Historik grupperad per dag, nyaste först. */
export function groupByDay(
  instances: ActivityInstance[],
): { date: string; items: ActivityInstance[] }[] {
  const map = new Map<string, ActivityInstance[]>();
  for (const item of instances) {
    const list = map.get(item.date) ?? [];
    list.push(item);
    map.set(item.date, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }));
}
