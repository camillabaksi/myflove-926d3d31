import { CHECKIN_WINDOWS, type CheckinSlot } from "@/hooks/use-flow-checkin";
import type { MoodEntry } from "@/hooks/use-data";
import type { EnergyLogEntry } from "@/hooks/use-quick-checkin";

const LABEL: Record<CheckinSlot, string> = {
  morgon: "Morgon",
  dag: "Dag",
  kvall: "Kväll",
};

const SLOTS: CheckinSlot[] = ["morgon", "dag", "kvall"];

function slotOf(ts: number | string, now: Date): CheckinSlot | null {
  const d = new Date(ts);
  if (d.toDateString() !== now.toDateString()) return null;
  const h = d.getHours();
  return SLOTS.find((s) => h >= CHECKIN_WINDOWS[s].from && h < CHECKIN_WINDOWS[s].to) ?? null;
}

const time = (ts: number | string) =>
  new Date(ts).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

/**
 * Sammanfattar dagens check-ins (morgon/dag/kväll) från den befintliga
 * centrala loggningen, så att Flow kan prata om dem i chatten – inte bara
 * visa dem i Mitt batteri-historiken. Ingen ny datakälla skapas.
 */
export function checkinContext(
  moods: MoodEntry[],
  energy: EnergyLogEntry[],
  now: Date = new Date(),
): string {
  const lines: string[] = [];

  for (const slot of SLOTS) {
    const m = moods.filter((x) => slotOf(x.date, now) === slot);
    const e = energy.filter((x) => slotOf(x.logged_at, now) === slot);
    if (!m.length && !e.length) continue;

    const parts: string[] = [];
    const lastEnergy = e[e.length - 1];
    const lastMood = m[m.length - 1];
    if (lastEnergy) parts.push(`energi ${lastEnergy.level}/5`);
    if (lastMood) parts.push(`mående ${lastMood.score}/5`);
    const stamp = time(lastEnergy?.logged_at ?? lastMood?.date ?? now.getTime());
    lines.push(`- ${LABEL[slot]} (kl. ${stamp}): ${parts.join(", ")}`);

    for (const note of m.map((x) => x.note?.trim()).filter(Boolean)) {
      lines.push(`  Egna ord: ”${note}”`);
    }
  }

  if (!lines.length) {
    return "Användaren har inte checkat in i dag ännu. Du kan varsamt bjuda in till en incheckning om det passar.";
  }

  return [
    "Dagens check-ins (användarens egna loggningar av energi och mående):",
    ...lines,
    "Använd dessa för att förstå hur dagen utvecklats. Det är användarens egen upplevelse, inte en diagnos.",
  ].join("\n");
}
