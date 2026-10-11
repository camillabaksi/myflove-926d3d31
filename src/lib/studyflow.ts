// StudyFlow™ – MyFlove i studierna.
// Samma motor som WorkFlow (poängsättning, kapacitet, ombyggnad av dagen),
// men med språk och rutiner anpassade för plugg, föreläsningar och inlämningar.

export const END_OF_STUDY_CHECK = [
  "Anteckningar sparade på rätt ställe",
  "Nästa plugg-pass bestämt",
  "Material framplockat till imorgon",
  "Saker du behöver komma ihåg → Fånga",
];

/** Övergångshjälp mellan föreläsning, plugg och paus. */
export function studyTransitionPlan(gapMinutes: number): string[] {
  if (gapMinutes <= 5)
    return ["🧠 Andas ut i 2 minuter", "📝 Skriv ner det du inte får glömma i Fånga"];
  if (gapMinutes <= 15)
    return [
      "📌 Skriv 3 rader om vad föreläsningen handlade om",
      "🃏 Ta en snabb runda flashcards",
      "🧠 5 min paus",
    ];
  return [
    "📌 Renskriv dagens anteckningar",
    "🃏 Repetera flashcards som är förfallna",
    "🎯 Ta en liten bit av närmaste inlämning",
    "🧠 Paus innan nästa pass",
  ];
}

/** Fallback-steg när AI inte är tillgänglig. */
export function fallbackStudySteps(title: string): string[] {
  return [
    `Öppna materialet för "${title}"`,
    "Läs instruktionen i 2 minuter",
    "Skriv rubriker / punktlista",
    "Skriv första stycket eller lös första uppgiften",
    "Bestäm när du fortsätter",
  ];
}

/** Minuter kvar av dagens plugg-fönster. */
export function minutesLeftOfStudyDay(endHour = 20, now = new Date()): number {
  const end = new Date(now);
  end.setHours(endHour, 0, 0, 0);
  return Math.max(0, Math.round((end.getTime() - now.getTime()) / 60000));
}
