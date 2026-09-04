/**
 * Steg-integration mot telefonens hälsoapp.
 *
 * Health Connect / Apple Health är AVSTÄNGT i MVP:n (2026-09-04) för att första
 * Google Play Internal Test inte ska kräva hälsodata-deklarationer. Modulen
 * behålls med samma API så att träningssidan fungerar oförändrat – den faller
 * tillbaka på manuell inmatning av steg.
 *
 * För att återaktivera: installera `capacitor-health`, lägg tillbaka
 * READ_STEPS-behörigheten och Health Connect-intent-filtret i Android-manifestet
 * samt HealthKit-capability i iOS-projektet, och återinför plugin-anropen här.
 */

export type HealthSource = "health-app" | "manual" | "none";

export interface DailySteps {
  /** YYYY-MM-DD */
  date: string;
  steps: number;
}

/** True när appen kör som mobilapp och hälsoappen går att nå. Avstängt i MVP. */
export async function isHealthAppAvailable(): Promise<boolean> {
  return false;
}

/** Ber om läsrättighet för steg. Avstängt i MVP. */
export async function requestStepPermission(): Promise<boolean> {
  return false;
}

/** Hämtar steg per dag. Avstängt i MVP – användaren fyller i manuellt. */
export async function readStepsForDays(_days = 7): Promise<DailySteps[] | null> {
  return null;
}

/** Hämtar dagens steg. Avstängt i MVP. */
export async function readTodaySteps(): Promise<number | null> {
  return null;
}

/** Öppnar systemets hälsoinställningar. Avstängt i MVP. */
export async function openHealthSettings(): Promise<void> {
  /* no-op */
}
