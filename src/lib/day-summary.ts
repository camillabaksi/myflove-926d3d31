/**
 * Mjuk dagssummering – beskriver bara vad som faktiskt hänt idag.
 * Inga poäng, streaks eller krav; tomt underlag ger en vänlig rad.
 */
export interface DaySummaryInput {
  completedToday: number;
  energyGivers: number;
  checkedIn: boolean;
}

export function daySummaryLines({ completedToday, energyGivers, checkedIn }: DaySummaryInput): string[] {
  const lines: string[] = [];
  if (completedToday > 0) lines.push(completedToday === 1 ? "Du har gjort en sak idag." : `Du har gjort ${completedToday} saker idag.`);
  if (energyGivers > 0) lines.push(energyGivers === 1 ? "En sak har gett dig energi." : `${energyGivers} saker har gett dig energi.`);
  if (checkedIn) lines.push("Du har checkat in hur du mår – bra koll på dig själv.");
  if (lines.length === 0) lines.push("Inget behöver vara gjort för att dagen ska räknas.");
  return lines;
}

/** Påminnelse om fångade tankar som väntar. Aldrig krav – null när inget väntar. */
export function waitingCapturesLine(count: number, hour: number): string | null {
  if (count <= 0) return null;
  const things = count === 1 ? "1 fångad tanke väntar" : `${count} fångade tankar väntar`;
  const them = count === 1 ? "den" : "dem";
  return hour >= 17 ? `${things} – vill du titta på ${them} innan dagen är slut?` : `${things}, när det passar dig.`;
}
