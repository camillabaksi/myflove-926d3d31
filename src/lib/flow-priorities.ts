/**
 * Vilka typer av tider Flow ska prioritera.
 * Ingen ny datamodell – bara en tolkning av titeln på det som redan finns.
 */

export type FlowPriorityKey =
  | "barn"
  | "medicin"
  | "studier"
  | "jobb"
  | "traning"
  | "inkop"
  | "ovrigt";

export const FLOW_PRIORITIES: Array<{ key: FlowPriorityKey; label: string; hint: string }> = [
  { key: "barn", label: "Barn & hämtning", hint: "Lämning, hämtning, skola och förskola" },
  { key: "medicin", label: "Medicin", hint: "Doser och rutiner du inte vill missa" },
  { key: "studier", label: "Studier", hint: "Föreläsningar, tentor och plugg" },
  { key: "jobb", label: "Jobb", hint: "Möten och arbetstider" },
  { key: "traning", label: "Träning & promenad", hint: "Rörelse, gym och utomhus" },
  { key: "inkop", label: "Inköp & ärenden", hint: "Handla, apotek och ärenden" },
  { key: "ovrigt", label: "Övrigt", hint: "Allt annat i dagen" },
];

export type FlowPriorityMap = Record<FlowPriorityKey, boolean>;

export const DEFAULT_FLOW_PRIORITIES: FlowPriorityMap = {
  barn: true,
  medicin: true,
  studier: true,
  jobb: true,
  traning: true,
  inkop: true,
  ovrigt: true,
};

export function priorityForTitle(title: string): FlowPriorityKey {
  if (/barn|lämna|hämta|förskola|skolan|dagis/i.test(title)) return "barn";
  if (/medicin|tablett|dos/i.test(title)) return "medicin";
  if (/plugg|studie|tenta|prov|föreläs|lektion|skola/i.test(title)) return "studier";
  if (/jobb|möte|arbete|kund|deadline/i.test(title)) return "jobb";
  if (/träning|gym|löp|promenad|cykel|hund/i.test(title)) return "traning";
  if (/handla|inköp|apotek|ärende|mat/i.test(title)) return "inkop";
  return "ovrigt";
}

export function linkForPriority(key: FlowPriorityKey): { href: string; label: string } {
  switch (key) {
    case "barn":
      return { href: "/barn", label: "Barnens dag" };
    case "medicin":
      return { href: "/daglig-rutin", label: "Rutiner & medicin" };
    case "studier":
      return { href: "/studyflow", label: "Studier" };
    case "jobb":
      return { href: "/jobb", label: "Jobb" };
    case "traning":
      return { href: "/traning", label: "Träning" };
    case "inkop":
      return { href: "/matlista", label: "Inköpslista" };
    default:
      return { href: "/idag", label: "Idag" };
  }
}

/** Är klockslaget inom Flows tillåtna fönster? Stödjer fönster över midnatt. */
export function withinWindow(nowMin: number, from: string, to: string): boolean {
  const parse = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
  };
  const a = parse(from);
  const b = parse(to);
  if (a == null || b == null) return true;
  if (a === b) return true;
  return a < b ? nowMin >= a && nowMin <= b : nowMin >= a || nowMin <= b;
}
