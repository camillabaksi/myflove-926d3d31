/**
 * Conservative, local Swedish step suggestions. Only recognized activities
 * get concrete steps; unclear requests stay editable and are not auto-saved.
 */
export function suggestTaskSteps(title: string): string[] {
  const value = title.toLocaleLowerCase("sv-SE").trim();
  const contains = (...terms: string[]) => terms.some(term => value.includes(term));
  if (contains("gå till parken", "till parken", "parkpromenad")) return [
    "Kolla vädret och välj kläder",
    "Ta med nycklar och det du behöver",
    "Ta på skor och ytterkläder",
    "Gå till parken",
  ];
  if (contains("handla", "matbutik", "köpa mat")) return [
    "Se vad som saknas hemma",
    "Skriv en kort inköpslista",
    "Ta med kasse och gå till affären",
    "Handla det som står på listan",
  ];
  if (contains("tvätta", "tvättstuga")) return [
    "Samla ihop det som ska tvättas",
    "Sortera och starta tvätten",
    "Häng upp eller torktumla",
    "Vik och lägg undan när det är torrt",
  ];
  if (contains("städa", "dammsuga")) return [
    "Välj ett rum eller en liten yta",
    "Plocka undan saker som ligger framme",
    "Torka av eller dammsug ytan",
    "Ställ tillbaka det du använt",
  ];
  if (contains("göra frukost", "laga frukost")) return [
    "Bestäm vad du vill äta",
    "Ta fram det som behövs",
    "Gör i ordning frukosten",
    "Ställ fram och ät",
  ];
  if (contains("betala räkning", "betala faktura")) return [
    "Ta fram fakturan",
    "Öppna banken och kontrollera uppgifterna",
    "Godkänn betalningen",
    "Markera fakturan som betald",
  ];
  if (contains("kalas", "fest")) return [
    "Bestäm om du ska ordna kalaset eller gå som gäst",
    "Skriv ner vad som behöver förberedas",
    "Välj en första konkret sak att göra",
  ];
  return [
    "Fundera på vad som behöver vara klart först",
    "Skriv ett litet första steg här",
    "Lägg till nästa steg om det behövs",
  ];
}
