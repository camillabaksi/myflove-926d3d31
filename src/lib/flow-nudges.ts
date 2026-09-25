// Proaktiva puffar från Flow.
//
// Regler:
//  • Allt bygger på användarens egen data – inga antaganden.
//  • Max en puff per regel och dag (nyckeln innehåller datumet).
//  • Puffarna schemaläggs som vanliga påminnelser (push_reminders), så de
//    kommer fram även när appen är stängd.

export interface FlowNudgeInput {
  now: Date;
  /** Dagens ork på 1–10-skalan, null om inget loggats idag. */
  orkValue10: number | null;
  /** Antal öppna Quickflow-poster (mental inkorg). */
  openQuickflowCount: number;
  /** Antal tidsatta aktiviteter idag. */
  timedTodayCount: number;
  /** Dagens kapacitetsläge (prioritetsmotorn). Valfritt. */
  capacityMode?: "fullt" | "mellan" | "lagt";
  /** Första "Måste idag"-saken från prioritetsmotorn. */
  firstMustDo?: string | null;
}

export interface FlowNudge {
  key: string;
  title: string;
  body: string;
  url: string;
  /** ISO-tid när puffen ska levereras. */
  deliverAt: string;
}

/** Tröskel för när inkorgen känns tung nog att nämna. */
export const QUICKFLOW_FULL_THRESHOLD = 8;
/** Ork på 1–10 där dagen bör bäras lättare. */
export const LOW_ORK_MAX = 4;

function dateKey(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function at(now: Date, hour: number, minute = 0): string {
  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * Vilka puffar Flow vill skicka just nu. Ren funktion – lätt att testa och
 * fri från antaganden om användarens liv.
 */
export function buildFlowNudges(input: FlowNudgeInput): FlowNudge[] {
  const { now, orkValue10, openQuickflowCount, timedTodayCount } = input;
  const day = dateKey(now);
  const nudges: FlowNudge[] = [];

  // 1) Ingen ork loggad idag – en enda enkel fråga, mitt på förmiddagen.
  if (orkValue10 == null) {
    nudges.push({
      key: `flow-ork-${day}`,
      title: "Hur är orken idag? 🔋",
      body: "En knapptryckning räcker. MyFlove gör resten.",
      url: "/hem",
      deliverAt: at(now, 10),
    });
  }

  // 2) Låg ork + full dag – en mjuk påminnelse om att bära mindre.
  if (orkValue10 != null && orkValue10 <= LOW_ORK_MAX && timedTodayCount >= 3) {
    nudges.push({
      key: `flow-latt-dag-${day}`,
      title: "Låt dagen väga mindre 💜",
      body: `Du har ${timedTodayCount} tider idag och lite ork. Det som kan vänta kan flyttas till imorgon.`,
      url: "/kalender",
      deliverAt: at(now, 12),
    });
  }

  // 3) Inkorgen växer – erbjud en stund att tömma huvudet.
  if (openQuickflowCount >= QUICKFLOW_FULL_THRESHOLD) {
    nudges.push({
      key: `flow-quickflow-${day}`,
      title: "Mycket snurrar i huvudet 🧠",
      body: `${openQuickflowCount} saker ligger i Quickflow. Vill du sortera några?`,
      url: "/quickflow",
      deliverAt: at(now, 17),
    });
  }

  // 4) Lågt läge: EN konkret nästa sak, och färre puffar totalt.
  if (input.capacityMode === "lagt") {
    const out: FlowNudge[] = [];
    if (input.firstMustDo) {
      out.push({
        key: `flow-first-${day}`,
        title: `Måste idag: ${input.firstMustDo}`,
        body: "Vi tar en sak i taget. Resten kan vänta.",
        url: "/hem",
        deliverAt: at(now, 9, 30),
      });
    }
    return [...out, ...nudges].slice(0, 2);
  }
  return nudges;
}
