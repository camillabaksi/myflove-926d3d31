/**
 * Vad kräver dig idag? – familjens åtaganden som en del av helheten.
 *
 * Ren logik. Inget nytt batteri, inga påhittade energikostnader och ingen
 * bedömning av barnets kapacitet. Här räknas bara det föräldern själv har
 * lagt in: vilka familjeaktiviteter som kräver ens närvaro, hur mycket
 * förberedelse och resa de innebär och hur tätt de ligger.
 */

import type { CapacityLevel } from "@/lib/adaptive-activity";
import { orkWord } from "@/lib/ork-word";

export interface FamilyLoadItem {
  /** HH:MM */
  time: string;
  endTime?: string;
  title: string;
  childName: string;
  /** Odefinierad betyder "inte angivet" och räknas som att den gäller dig. */
  requiresParent?: boolean;
  prepMinutes?: number;
  travelMinutes?: number;
  recoveryAfter?: boolean;
  completed?: boolean;
}

export interface FamilyLoadInput {
  items: FamilyLoadItem[];
  /** Mitt batteri 0–100 om det finns. */
  batteryPercent?: number | null;
  capacity: CapacityLevel;
  /** Minuter sedan midnatt. */
  nowMinutes?: number;
  /** Försiktig mening om användarens egna tidigare loggar. */
  patternNote?: string | null;
}

export interface FamilyLoadSummary {
  /** Allt i familjen idag. */
  total: number;
  /** Det som kräver förälderns närvaro. */
  requiring: number;
  /** Kvar av dagen. */
  upcoming: FamilyLoadItem[];
  /** Summa tid inklusive förberedelse och resa, minuter. */
  committedMinutes: number;
  /** "16:15–19:30" */
  windowLabel: string | null;
  /** Dagen kräver mycket av föräldern i förhållande till kapaciteten. */
  demanding: boolean;
  headline: string;
  /** Kort rad att visa i Family Flow. */
  summaryLine: string;
  /** Mjukt förslag – aldrig ett krav, aldrig automatisk ombokning. */
  suggestion: string | null;
  patternNote: string | null;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m ?? 0);
}

const DEFAULT_LENGTH = 45;

/** Räknar hur mycket en aktivitet faktiskt tar av dagen, med prep och resa. */
export function itemMinutes(item: FamilyLoadItem): number {
  const start = toMinutes(item.time);
  const end = item.endTime ? Math.max(toMinutes(item.endTime), start + 15) : start + DEFAULT_LENGTH;
  return end - start + (item.prepMinutes ?? 0) + (item.travelMinutes ?? 0);
}

export function requiresParent(item: FamilyLoadItem): boolean {
  return item.requiresParent !== false;
}

export function buildFamilyLoad(input: FamilyLoadInput): FamilyLoadSummary {
  const now = input.nowMinutes ?? 0;
  const items = [...input.items].sort((a, b) => a.time.localeCompare(b.time));
  const mine = items.filter(requiresParent);
  const upcoming = mine.filter((i) => !i.completed && toMinutes(i.time) + DEFAULT_LENGTH >= now);
  const committedMinutes = upcoming.reduce((sum, i) => sum + itemMinutes(i), 0);

  const first = upcoming[0];
  const last = upcoming[upcoming.length - 1];
  const windowLabel = first && last ? `${first.time}–${last.endTime ?? last.time}` : null;

  const demanding =
    upcoming.length >= 2 ||
    committedMinutes >= 120 ||
    (upcoming.length >= 1 && input.capacity === "låg");

  const batteryText =
    typeof input.batteryPercent === "number"
      ? `Du har ${orkWord(Math.round(input.batteryPercent)).label.toLocaleLowerCase("sv")}. `
      : "";

  const summaryLine = upcoming.length
    ? `${batteryText}${upcoming.length === 1 ? "En familjeaktivitet" : `${upcoming.length} familjeaktiviteter`} kräver dig${windowLabel ? ` ${windowLabel}` : ""}.`
    : `${batteryText}Inget i familjen kräver dig resten av dagen.`;

  const headline = !upcoming.length
    ? "Resten av dagen är fri från familjeåtaganden."
    : demanding
      ? "Den här delen av dagen kräver en del av dig."
      : "Så här ser familjens dag ut för dig.";

  const battery = typeof input.batteryPercent === "number" ? Math.round(input.batteryPercent) : null;
  const lowBattery = (battery !== null && battery <= 40) || input.capacity === "låg";
  const hasMeal = upcoming.some((i) => /middag|mat|lunch|kvällsmat/i.test(i.title));
  const partOfDay = first && toMinutes(first.time) >= 12 * 60 ? "eftermiddag" : "dag";
  const suggestion = !upcoming.length
    ? null
    : demanding && lowBattery && upcoming.length >= 2
      ? `Din ${partOfDay} är ganska tät${battery !== null ? ` och du har ${orkWord(battery).label.toLocaleLowerCase("sv")}` : ""}. Vill du ${hasMeal ? "förenkla middagen och " : ""}lägga in 20 min återhämtning efter ${first!.title.toLocaleLowerCase("sv")}?`
      : demanding
        ? "Vill du att jag hjälper dig hitta en kort återhämtning som får plats?"
        : "Vill du att jag hjälper dig hitta ett lugnt nästa steg?";

  return {
    total: items.length,
    requiring: mine.length,
    upcoming,
    committedMinutes,
    windowLabel,
    demanding,
    headline,
    summaryLine,
    suggestion,
    patternNote: input.patternNote ?? null,
  };
}

/** Rader till Flows kontext – användarens egna uppgifter, inga slutsatser. */
export function familyLoadContext(summary: FamilyLoadSummary): string | null {
  if (!summary.upcoming.length) return null;
  const lines = [
    "Familjens åtaganden idag (från användarens eget familjeschema, inte energivärden):",
    ...summary.upcoming
      .slice(0, 5)
      .map(
        (i) =>
          `- ${i.time} ${i.title} (${i.childName})${i.prepMinutes ? `, förberedelse ${i.prepMinutes} min` : ""}${i.travelMinutes ? `, resa ${i.travelMinutes} min` : ""}${i.recoveryAfter ? ", användaren vill gärna ha lugn stund efteråt" : ""}`,
      ),
    summary.demanding
      ? "Det här kan göra eftermiddagen/kvällen tätare än kalendern ser ut. Föreslå gärna att hålla resten enkelt och lägga in kort återhämtning – men bara som förslag, aldrig ombokning."
      : "Det ser hanterbart ut. Föreslå bara återhämtning om användaren själv verkar behöva det.",
  ];
  if (summary.patternNote) lines.push(`- ${summary.patternNote}`);
  lines.push(
    "Sätt aldrig energivärden på barnens aktiviteter och uttala dig aldrig om barnets kapacitet.",
  );
  return lines.join("\n");
}

/**
 * Försiktig mönstermening från användarens egna loggar. Returnerar null tills
 * det finns tillräckligt många loggar – Flow ska aldrig gissa.
 */
export function familyPatternNote(counts: { drains: number; logged: number }): string | null {
  if (counts.logged < 3) return null;
  if (counts.drains / counts.logged < 0.6) return null;
  return "Du har tidigare loggat att liknande dagar med flera familjeaktiviteter tar mycket energi.";
}
