// Prioritering när flera situationer är aktiva samtidigt.
//
// Problemet: om både Jobb och Studier (och kanske Sjukskriven) är påslagna
// kan jobbprofilen och studieprofilen ge förslag som drar åt olika håll –
// "ta igen dokumentationen ikväll" och "plugga två pass ikväll" samma dag.
// Här vägs situationerna ihop till EN ordning som både Flow (AI-kontext),
// förslagskorten och Quickflow utgår från.

import { SITUATION_META, activeSituations, type SituationId, type SituationState } from "./situation";

export type Demand = "lätt" | "normal" | "krävande";

const DEMAND_WEIGHT: Record<Demand, number> = { lätt: 1, normal: 2, krävande: 3 };

/** Situationer där återhämtning alltid går före prestation. */
const RECOVERY: SituationId[] = ["sjukskriven", "foraldraledig"];

/** Grundvikt per situation – högre = styr dagen mer. */
const BASE_WEIGHT: Record<SituationId, number> = {
  sjukskriven: 100,
  foraldraledig: 80,
  jobb: 50,
  studier: 48,
  arbetssokande: 40,
  "mellan-arbeten": 30,
  annat: 20,
};

export interface SituationPriorityInput {
  situation: SituationState;
  /** Hur krävande arbetsdagen ser ut idag. */
  workDemand?: Demand;
  /** Hur krävande studieveckan ser ut. */
  studyDemand?: Demand;
  /** Har användaren en ifylld och påslagen jobbprofil? */
  hasWorkProfile?: boolean;
  hasStudyProfile?: boolean;
  energy?: number | null;
  /** FlowScore 0–100. */
  score?: number;
}

export interface SituationPriority {
  /** Aktiva situationer, viktigast först. */
  order: SituationId[];
  /** Den situation som styr dagen just nu (null = ingen vald). */
  lead: SituationId | null;
  /** Nästa i ordningen – får utrymme, men mindre. */
  second: SituationId | null;
  /** Går återhämtning före allt annat? */
  recoveryFirst: boolean;
  /** Hur många förslag jobbprofilen respektive studieprofilen får ge. */
  maxWorkSuggestions: number;
  maxStudySuggestions: number;
  /** Kort mening att visa i UI ovanför förslagen. */
  headline: string;
  /** Varför det blev så här – i Flow-röst. */
  rationale: string;
}

function weight(id: SituationId, input: SituationPriorityInput): number {
  let w = BASE_WEIGHT[id];
  if (id === "jobb" && input.workDemand) w += DEMAND_WEIGHT[input.workDemand];
  if (id === "studier" && input.studyDemand) w += DEMAND_WEIGHT[input.studyDemand];
  // En profil som faktiskt är ifylld säger mer om vardagen än en tom.
  if (id === "jobb" && input.hasWorkProfile) w += 0.5;
  if (id === "studier" && input.hasStudyProfile) w += 0.5;
  return w;
}

const label = (id: SituationId | null) =>
  id ? `${SITUATION_META[id].emoji} ${SITUATION_META[id].label}` : "";

/**
 * Väger ihop aktiva situationer till en tydlig ordning så att Jobb och
 * Studier aldrig konkurrerar om samma kväll.
 */
export function resolveSituationPriority(input: SituationPriorityInput): SituationPriority {
  const active = activeSituations(input.situation);
  const order = [...active].sort((a, b) => weight(b, input) - weight(a, input));
  const lead = order[0] ?? null;
  const second = order[1] ?? null;
  const recoveryFirst = order.some((id) => RECOVERY.includes(id));

  const low = (input.energy != null && input.energy <= 2) || (input.score != null && input.score < 40);

  let maxWork = active.includes("jobb") ? 3 : 0;
  let maxStudy = active.includes("studier") ? 3 : 0;

  if (active.includes("jobb") && active.includes("studier")) {
    // Båda pågår: den som väger tyngst leder, den andra får en enda sak.
    const jobbLeads = order.indexOf("jobb") < order.indexOf("studier");
    maxWork = jobbLeads ? 2 : 1;
    maxStudy = jobbLeads ? 1 : 2;
  }

  if (recoveryFirst) {
    maxWork = Math.min(maxWork, 1);
    maxStudy = Math.min(maxStudy, 1);
  }
  if (low) {
    maxWork = Math.min(maxWork, 1);
    maxStudy = Math.min(maxStudy, recoveryFirst || maxWork === 1 ? 1 : maxStudy);
    // Aldrig fler än två förslag totalt när orken är låg.
    if (maxWork + maxStudy > 2) maxStudy = Math.max(0, 2 - maxWork);
  }

  let headline = "";
  let rationale = "";

  if (!lead) {
    headline = "Ingen situation vald än";
    rationale = "Välj din situation så vet jag vad som ska väga tyngst.";
  } else if (order.length === 1) {
    headline = `${label(lead)} styr dagen`;
    rationale = SITUATION_META[lead].flowHint;
  } else if (recoveryFirst) {
    headline = `${label(lead)} går först`;
    rationale = `Flera saker pågår samtidigt, men ${SITUATION_META[lead].label.toLowerCase()} väger tyngst just nu. ${
      second ? `${SITUATION_META[second].label} får plats i det lilla` : "Resten får vänta"
    } – inte i full skala.`;
  } else {
    const demand =
      lead === "jobb" ? input.workDemand : lead === "studier" ? input.studyDemand : undefined;
    headline = `${label(lead)} väger tyngst idag`;
    rationale = `${label(lead)}${demand ? ` (${demand} dag)` : ""} styr, ${
      second ? `${label(second)} får en sak` : "resten får vänta"
    }. Så slipper du två planer som drar åt olika håll.`;
  }
  if (low && lead) rationale += " Orken är låg, så jag håller listan kort.";

  return {
    order,
    lead,
    second,
    recoveryFirst,
    maxWorkSuggestions: maxWork,
    maxStudySuggestions: maxStudy,
    headline,
    rationale,
  };
}

/**
 * Kontexttext till Flow: en enda prioritering, så att svaren inte blir
 * motstridiga när flera situationer och profiler är påslagna.
 */
export function situationPriorityContext(p: SituationPriority): string {
  if (!p.lead || p.order.length < 2) return "";
  const lines = [
    "Prioritering mellan aktiva situationer (avgjord av appen – följ den):",
    `- Ordning: ${p.order.map((id, i) => `${i + 1}. ${SITUATION_META[id].label}`).join(", ")}`,
    `- ${SITUATION_META[p.lead].label} styr dagens förslag. ${
      p.second ? `${SITUATION_META[p.second].label} får högst en liten sak.` : ""
    }`,
  ];
  if (p.recoveryFirst) {
    lines.push("- Återhämtning går före prestation: sänk kraven i alla situationer, utan skuld.");
  }
  lines.push(
    "- Ge ETT sammanhängande råd. Föreslå aldrig både en tung jobbinsats och ett tungt pluggpass samma kväll, och beskriv inte samma tid som ledig i en situation och upptagen i en annan.",
  );
  return lines.join("\n");
}

/**
 * Sorterar Quickflow-destinationer så att den ledande situationen ligger
 * först bland förslagen (jobb/studier byter plats efter prioriteringen).
 */
export function orderByPriority<T extends string>(
  destinations: T[],
  p: SituationPriority,
): T[] {
  const rank = (d: T) => {
    if (d === ("jobb" as T)) return p.order.indexOf("jobb");
    if (d === ("studier" as T)) return p.order.indexOf("studier");
    return -1;
  };
  const both = destinations.includes("jobb" as T) && destinations.includes("studier" as T);
  if (!both || p.order.indexOf("jobb") < 0 || p.order.indexOf("studier") < 0) return destinations;
  const out = [...destinations];
  const iJobb = out.indexOf("jobb" as T);
  const iStud = out.indexOf("studier" as T);
  const first = rank("jobb" as T) < rank("studier" as T) ? "jobb" : "studier";
  const lo = Math.min(iJobb, iStud);
  const hi = Math.max(iJobb, iStud);
  out[lo] = first as T;
  out[hi] = (first === "jobb" ? "studier" : "jobb") as T;
  return out;
}
