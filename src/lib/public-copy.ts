/** Current names for app-owned copy and translation dictionaries, never saved user content. */
export function currentProductCopy(text: string, lang: "sv" | "en" = "sv"): string {
  const english = lang === "en";
  return text
    .replace(/Min första dag i Flow/g, "Min första dag med Pace")
    .replace(/(?:Lägg till i|Tillagd i|Tillagt i) MyFlow/g, (match) =>
      match.startsWith("Lägg") ? "Lägg till som uppgift" : "Tillagd som uppgift",
    )
    .replace(/MyFlove Insight/g, english ? "Insights" : "Insikter")
    .replace(/Dagens Flow[Ss]core(?:™)?/g, "Dagens balans")
    .replace(/Veckans Flow/g, "Veckans översikt")
    .replace(/Family Flow(?:™)?/g, english ? "Family" : "Familj")
    .replace(/Daily Flow(?:™)?/g, english ? "Today" : "Idag")
    .replace(/Flow Reset(?:™)?/g, english ? "Evening reset" : "Kvällsavslut")
    .replace(/\bQuick[Ff]low(?:™)?/g, english ? "Capture" : "Fånga")
    .replace(/\b(?:Study[Ff]low|Flow[Ss]tudy)(?:™)?/g, english ? "Studies" : "Studier")
    .replace(/\bWork[Ff]low(?:™)?/g, english ? "Work" : "Arbete")
    .replace(/\bFlow[Pp]lans\b/g, english ? "Planning's" : "planeringens")
    .replace(/\bFlow[Pp]lan(?:™)?/g, english ? "Planning" : "Planering")
    .replace(/\bFlow[Ss]core(?:™)?/g, english ? "Daily balance" : "Dagens balans")
    .replace(/\b(?:My[Ff]love|My[Ff]low)s\b/g, "Paceables")
    .replace(/\b(?:My[Ff]love|My[Ff]low)(?:™)?/g, "Paceable")
    .replace(/\bFlows\b/g, english ? "Pace's" : "Paces")
    .replace(/\bFlow\b/g, "Pace");
}

/** Preserve old translation keys as aliases while new copy keeps its existing translation. */
export function currentCopyDictionary(source: Record<string, string>): Record<string, string> {
  const result = Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, currentProductCopy(value, "en")]),
  );
  for (const [key, value] of Object.entries(source)) {
    const currentKey = currentProductCopy(key);
    if (!(currentKey in result)) result[currentKey] = currentProductCopy(value, "en");
  }
  return result;
}
