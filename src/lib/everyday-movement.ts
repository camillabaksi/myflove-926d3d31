export interface MovementIdea {
  id: string;
  label: string;
  minutes: number;
  /** Kort beskrivning som sänker tröskeln att börja */
  hint: string;
  tag: "hem" | "ute" | "paus" | "transport";
}

/**
 * Vardagsmotion – korta, låg-tröskel-rörelser.
 * Tänkt för NPF: tydligt, kort, konkret och alltid "får räknas".
 */
export const MOVEMENT_IDEAS: MovementIdea[] = [
  { id: "walk-10", label: "10 min promenad", minutes: 10, hint: "Runt kvarteret. Musik eller poddar i öronen räknas.", tag: "ute" },
  { id: "walk-out", label: "Gå av en hållplats tidigare", minutes: 8, hint: "Samma resa, lite mer rörelse.", tag: "transport" },
  { id: "stairs", label: "Ta trapporna", minutes: 3, hint: "En gång idag – det räcker.", tag: "transport" },
  { id: "dance", label: "Dansa till en låt", minutes: 4, hint: "En låt. Ingen ser dig.", tag: "hem" },
  { id: "tidy", label: "Städa/plocka i 10 min", minutes: 10, hint: "Timer på, ett rum, sen klart.", tag: "hem" },
  { id: "stretch", label: "Stretcha axlar & rygg", minutes: 5, hint: "Bra efter mycket skärmtid.", tag: "paus" },
  { id: "shake", label: "Skaka loss / hoppa", minutes: 2, hint: "Bra när kroppen är rastlös.", tag: "paus" },
  { id: "errand", label: "Gå ett ärende", minutes: 15, hint: "Butik, brevlåda, återvinning.", tag: "ute" },
  { id: "call-walk", label: "Gå under telefonsamtal", minutes: 10, hint: "Prata och rör dig samtidigt.", tag: "transport" },
  { id: "bike", label: "Cykla en sträcka", minutes: 15, hint: "Kort tur räknas lika mycket.", tag: "ute" },
  { id: "garden", label: "Trädgård eller balkong", minutes: 12, hint: "Vattna, rensa, greja.", tag: "hem" },
  { id: "play", label: "Lek/spring med barnen", minutes: 15, hint: "Räknas absolut som träning.", tag: "hem" },
];

export const MOVEMENT_TAG_LABEL: Record<MovementIdea["tag"], string> = {
  hem: "Hemma",
  ute: "Ute",
  paus: "Paus",
  transport: "På väg",
};

export const MOVEMENT_TAG_HUE: Record<MovementIdea["tag"], string> = {
  hem: "42 62% 45%",
  ute: "152 30% 32%",
  paus: "265 32% 45%",
  transport: "205 45% 34%",
};

export function movementById(id: string): MovementIdea | undefined {
  return MOVEMENT_IDEAS.find((m) => m.id === id);
}

/** Dagens tips – roterar så det känns nytt utan att bli slumpmässigt kaos. */
export function movementOfTheDay(dateKey: string): MovementIdea {
  const sum = [...dateKey].reduce((a, c) => a + c.charCodeAt(0), 0);
  return MOVEMENT_IDEAS[sum % MOVEMENT_IDEAS.length]!;
}
