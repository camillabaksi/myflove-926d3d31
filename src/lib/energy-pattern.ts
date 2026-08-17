// Energimönster över dygnet – bygger på dina egna loggar i Energikartan.
// Syftet är inte att döma en tid på dygnet, utan att göra planen realistisk.

export interface EnergySample {
  level: number;
  loggedAt: string;
}

export interface EnergyPattern {
  /** Genomsnittlig energi per timme (0–23), null där data saknas. */
  byHour: (number | null)[];
  /** Antal loggar som mönstret bygger på. */
  samples: number;
  /** Sant först när underlaget räcker för att säga något. */
  reliable: boolean;
  /** Din genomsnittliga energi över alla loggar. */
  average: number | null;
}

/** Slår ihop närliggande timmar så att glesa loggar ändå ger en bild. */
const WINDOW = 1;

export function buildEnergyPattern(samples: EnergySample[]): EnergyPattern {
  const sums = Array.from({ length: 24 }, () => ({ total: 0, count: 0 }));
  for (const s of samples) {
    const h = new Date(s.loggedAt).getHours();
    if (Number.isNaN(h)) continue;
    sums[h].total += s.level;
    sums[h].count += 1;
  }

  const byHour = sums.map((_, h) => {
    let total = 0;
    let count = 0;
    for (let d = -WINDOW; d <= WINDOW; d++) {
      const bucket = sums[(h + d + 24) % 24];
      total += bucket.total;
      count += bucket.count;
    }
    return count ? total / count : null;
  });

  const average = samples.length
    ? samples.reduce((s, x) => s + x.level, 0) / samples.length
    : null;

  return {
    byHour,
    samples: samples.length,
    reliable: samples.length >= 8,
    average,
  };
}

export const EMPTY_ENERGY_PATTERN: EnergyPattern = {
  byHour: Array.from({ length: 24 }, () => null),
  samples: 0,
  reliable: false,
  average: null,
};

export interface EnergyExpectation {
  /** Förväntad energi just nu enligt dina egna loggar (1–5). */
  expected: number;
  /** Skillnaden mot ditt snitt – negativ = svackan brukar ligga här. */
  diff: number;
  /** Kort mening att visa för användaren. */
  note: string;
}

/**
 * Vad brukar din energi vara just den här tiden på dygnet?
 * Returnerar null när underlaget är för tunt – hellre tyst än gissa.
 */
export function expectationFor(
  pattern: EnergyPattern,
  now = new Date(),
): EnergyExpectation | null {
  if (!pattern.reliable || pattern.average == null) return null;
  const expected = pattern.byHour[now.getHours()];
  if (expected == null) return null;

  const diff = expected - pattern.average;
  const span = hourSpan(pattern, now.getHours(), diff < 0);
  const note =
    diff <= -0.4
      ? `Du brukar ha lägre energi ${span}. Planen tar höjd för det.`
      : diff >= 0.4
        ? `Du brukar ha bra energi ${span}. Passa på med något tyngre.`
        : `Din energi brukar vara ganska jämn ${span}.`;

  return { expected: Math.round(expected * 10) / 10, diff: Math.round(diff * 10) / 10, note };
}

/** Hittar hur långt den låga/höga perioden sträcker sig runt aktuell timme. */
function hourSpan(pattern: EnergyPattern, hour: number, low: boolean): string {
  const avg = pattern.average ?? 3;
  const matches = (h: number) => {
    const v = pattern.byHour[h];
    if (v == null) return false;
    return low ? v < avg - 0.2 : v > avg + 0.2;
  };
  let start = hour;
  let end = hour;
  while (matches((start - 1 + 24) % 24) && hour - start < 5) start -= 1;
  while (matches((end + 1) % 24) && end - hour < 5) end += 1;
  const pad = (h: number) => String(((h % 24) + 24) % 24).padStart(2, "0");
  if (start === end) return `runt kl ${pad(hour)}`;
  return `mellan ${pad(start)} och ${pad(end + 1)}`;
}
