export type ChangelogSection = {
  title: string;
  items: string[];
};

export const CHANGELOG_TITLE = "MyFlove Changelog";
export const CHANGELOG_INTRO =
  "Komplett logg över allt som byggts i MyFlove – från första prototypen till dagens version.";
export const CHANGELOG_UPDATED = "2026-08-15";

export const CHANGELOG_SECTIONS: ChangelogSection[] = [
  {
    title: "Grund & plattform",
    items: [
      "TanStack Start med SSR, filbaserad routing och server-funktioner",
      "React 19, Tailwind CSS, shadcn/ui och Lucide-ikoner",
      "Lovable Cloud som databas, auth, storage och funktioner",
      "Inloggning, registrering och skyddade sidor under /_app",
      "Offline-first lagring i localStorage med molnsynk via user_kv",
      "PWA – installerbar på hemskärmen med service worker",
      "Capacitor-paketering för iOS och Android",
      "Namnbyte från MyFlow till MyFlove i hela appen och dokumentationen",
    ],
  },
  {
    title: "Kärnkoncept",
    items: [
      "Flow AI-personlighet – anpassat stöd efter din dagsform",
      "FlowPlan™ – AI-driven sekvensplanering av uppgifter",
      "FlowScore™ – kapacitetspoäng av energi, humör och arbetsbörda, med egen vy",
      "WorkFlow™ – arbetsläge med omplanering, mötesläge och Nu-lista",
      "StudyFlow™ – pluggläge med föreläsningsläge och kalendersynk",
      "StudyBuddy – flervalsfrågor, flashcards och Leitner-repetition",
      "MyFlove Insight™ – demoversion för NPF-profiler och strategier",
      "Stoppknappen™ – andningsövningar och AI-stöd vid överbelastning",
    ],
  },
  {
    title: "Livsområden & moduler",
    items: [
      "Livsområden: Vardag, Studier, Jobb och Privat med egna färger och ikoner",
      "Navigation grupperad i MyFlow, HomeFlow, FamilyFlow, StudyFlow och WorkFlow",
      "Global sökfunktion över alla vyer",
      "Hemskärm med valbara genvägar och områdesfiltrerade widgets",
      "Barn-modulen – barnprofiler och delning inom familjen",
      "Hem & familj – hushåll, gemensam inköpslista och kalender",
      "Träning – styrka/kondition, AI-genererade pass och hälsoapp-koppling",
      "Promenadvägar – riktningsbaserade förslag i närområdet via geoposition",
      "Städning – rumsvisa lägen och checklistor",
      "Ekonomi – transaktioner och budgetpanel",
      "Matlista och matplanerare – fungerar även utan familj",
    ],
  },
  {
    title: "Planering & produktivitet",
    items: [
      "Uppgifter med tid, påminnelse, återkommande, delsteg och bilagor",
      "Uppgifter sparas i molnet och ligger kvar klarmarkerade",
      "Kalender med ICS-import/export och synk mot StudyFlow",
      "Schemaimport med AI-tolkning och 'nästa lektion' med vägbeskrivning",
      "Återkommande påminnelser (dagligen, veckovis, vardagar)",
      "Snooze, väntar-på-status och smarta deadline-påminnelser",
      "Quickflow – snabbinfångst av tankar med dubblettfilter",
      "Brain Dump – spara idéer",
      "Daglig rutin och Pomodoro-timer",
      "Minimera/maximera alla vyer med sparat läge",
    ],
  },
  {
    title: "Hälsa & välmående",
    items: [
      "Energikarta – logga energinivåer över tid, kopplad till FlowPlan",
      "Humörlogg och Må bra-vy",
      "Medicinlogg med schemalagda tider, tagningar och påminnelser",
      "Proaktiva förslag – väder, medicin, tvätt m.m.",
      "Väderkort på startsidan med platslokalisering (Open-Meteo)",
    ],
  },
  {
    title: "AI & assistent",
    items: [
      "Flow Assistant med sparad chatthistorik och sidopanel",
      "AI-genererade träningspass, studieplaner och quiz",
      "Personliga hälsningar, notiser och uppmuntran",
      "MCP-server så externa AI-agenter kan använda appen",
    ],
  },
  {
    title: "Familj & delning",
    items: [
      "Hushåll med unika join-koder",
      "Delad inköpslista och familjekalender",
      "Behörigheter och barn-delning",
    ],
  },
  {
    title: "Notiser & integrationer",
    items: [
      "Web Push-notiser för medicin, väder, påminnelser och loopar",
      "Alarmljud och val mellan alarm eller mild påminnelse",
      "Resesida med Trafiklab ResRobot v2.1 och pendlingsvarningar",
      "Kalendersynk via ICS",
      "Promenadvägar via OpenStreetMap Overpass och höjddata",
    ],
  },
  {
    title: "Konto, säkerhet & admin",
    items: [
      "Glömt lösenord – återställningslänk via mejl och sida för nytt lösenord",
      "Kontoborttagning",
      "Integritet, villkor och cookies-sidor",
      "Roller i separat tabell med RLS-härdning",
      "Adminpanel med statistik, rollhantering och friktionsrapporter",
      "Friktionsindex – användarfeedback med röstning",
      "Changelog-export till Word och PDF",
    ],
  },
  {
    title: "Design & upplevelse",
    items: [
      "Palett: beige bakgrund, skogsgrön primary, guld accent och vita kort",
      "Fraunces display + Inter body, mjuka radier och lena skuggor",
      "Flow-voice – varm och lugn svensk copy i hela appen",
      "Introtur, enkelt läge och svenska underrubriker",
      "Kontextuella hjälptexter med i-knapp på alla kort",
      "Tillbakaknapp baserad på historik",
      "SEO: sidspecifika og-taggar, JSON-LD, sitemap och robots.txt",
    ],
  },
];
