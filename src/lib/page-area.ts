/** Central mapping from route to the area whose muted tone tints the page background. */
export type PageArea = "idag" | "kalender" | "tankar" | "halsa" | "hem" | "aterhamtning" | "neutral";

const RULES: Array<[PageArea, string[]]> = [
  ["kalender", ["/kalender", "/calendar", "/planning", "/planera", "/week-flow", "/vecka"]],
  ["tankar", ["/quickflow", "/tankar", "/notes", "/dump", "/fanga"]],
  ["halsa", ["/halsa", "/mood", "/battery", "/traning", "/health", "/maende"]],
  ["aterhamtning", ["/pause", "/paus", "/stop", "/stopp", "/aterhamtning", "/ljus"]],
  ["hem", ["/hem", "/familj", "/familjeflow", "/barn", "/hushall"]],
  ["idag", ["/idag", "/day", "/daily-flow", "/tasks", "/uppgifter", "/reminders", "/paminnelser"]],
];

export function pageAreaFor(pathname: string): PageArea | null {
  const path = pathname.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  if (["/assistant", "/flowplan", "/flow"].some((p) => path === p || path.startsWith(`${p}/`))) return null;
  for (const [area, prefixes] of RULES) {
    if (prefixes.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}-`))) return area;
  }
  return "neutral";
}
