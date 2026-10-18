import type { LifeArea } from "@/lib/life-areas";

const RULES: ReadonlyArray<{ area: LifeArea; terms: string[] }> = [
  { area: "barn", terms: ["förskola", "fritids", "barnen", "barnens", "hämta barn", "lämna barn", "föräldramöte", "bvc"] },
  { area: "ekonomi", terms: ["räkning", "faktura", "budget", "deklaration", "elräkning"] },
  { area: "halsa", terms: ["läkare", "tandläkare", "vårdcentral", "medicin", "träning", "vaccin"] },
  { area: "studier", terms: ["tentamen", "föreläsning", "kursansökan", "inlämning", "studera", "seminarium"] },
  { area: "jobb", terms: ["jobbmöte", "arbetsmöte", "kollegor", "arbetspass", "lönesamtal"] },
  { area: "egentid", terms: ["egentid", "meditera", "lugn promenad", "återhämtning"] },
  { area: "socialt", terms: ["träffa vänner", "fika med", "kompis"] },
  { area: "privat", terms: ["familjemiddag", "släktträff", "bröllop"] },
  { area: "vardag", terms: ["städa", "tvätta", "handla", "diska", "dammsuga", "göra frukost", "laga mat"] },
];

export function suggestActivityArea(title: string): LifeArea | null {
  const normalized = " " + title.toLocaleLowerCase("sv-SE").trim().replace(/[^a-zåäö0-9]+/g, " ") + " ";
  if (!title.trim()) return null;
  const matched = RULES.filter(rule => rule.terms.some(term => normalized.includes(" " + term + " ")));
  return matched.length === 1 ? matched[0].area : null;
}
