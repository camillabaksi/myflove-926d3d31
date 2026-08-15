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
      "TanStack Start med SSR, filbaserad routing och server-funktioner (2026-07-23)",
      "React 19, Tailwind CSS, shadcn/ui och Lucide-ikoner (2026-07-23)",
      "Lovable Cloud som databas, auth, storage och funktioner (2026-07-23)",
      "Inloggning, registrering och skyddade sidor under /_app (2026-07-23)",
      "Offline-first lagring i localStorage med molnsynk via user_kv (2026-07-20)",
      "PWA – installerbar på hemskärmen med service worker (2026-07-09)",
      "Capacitor-paketering för iOS och Android (2026-07-20)",
      "Namnbyte från MyFlow till MyFlove i hela appen och dokumentationen (2026-07-23)",
    ],
  },
  {
    title: "Kärnkoncept",
    items: [
      "Flow AI-personlighet – anpassat stöd efter din dagsform (2026-07-08)",
      "FlowPlan™ – AI-driven sekvensplanering av uppgifter (2026-07-08)",
      "FlowScore™ – kapacitetspoäng av energi, humör och arbetsbörda, med egen vy (2026-08-13)",
      "WorkFlow™ – arbetsläge med omplanering, mötesläge och Nu-lista (2026-08-13)",
      "StudyFlow™ – pluggläge med föreläsningsläge och kalendersynk (2026-08-13)",
      "StudyBuddy – flervalsfrågor, flashcards och Leitner-repetition (2026-08-13)",
      "MyFlove Insight™ – demoversion för NPF-profiler och strategier (2026-08-13)",
      "Stoppknappen™ – andningsövningar och AI-stöd vid överbelastning (2026-07-25)",
    ],
  },
  {
    title: "Livsområden & moduler",
    items: [
      "Livsområden: Vardag, Studier, Jobb och Privat med egna färger och ikoner (2026-08-13)",
      "Navigation grupperad i MyFlow, HomeFlow, FamilyFlow, StudyFlow och WorkFlow (2026-08-13)",
      "Global sökfunktion över alla vyer (2026-08-13)",
      "Hemskärm med valbara genvägar och områdesfiltrerade widgets (2026-07-20)",
      "Hemskärm: dubbla förslagsrubriker borttagna – bara \"Förslag just nu\" visas (2026-08-15)",
      "Barn-modulen – barnprofiler och delning inom familjen (2026-07-20)",
      "Barnets skolschema – lägg in lektioner (ämne, tid, sal, lärare) en gång, det ligger kvar och nästa lektion visas (2026-08-15)",
      "Hem & familj – hushåll, gemensam inköpslista och kalender (2026-07-20)",
      "Träning – styrka/kondition, AI-genererade pass och hälsoapp-koppling (2026-08-11)",
      "Promenadvägar – riktningsbaserade förslag i närområdet via geoposition (2026-08-14)",
      "Städning – rumsvisa lägen och checklistor (2026-08-13)",
      "Ekonomi – transaktioner och budgetpanel (2026-07-23)",
      "Matlista och matplanerare – fungerar även utan familj (2026-07-09)",
    ],
  },
  {
    title: "Planering & produktivitet",
    items: [
      "Uppgifter med tid, påminnelse, återkommande, delsteg och bilagor (2026-07-23)",
      "Uppgifter sparas i molnet och ligger kvar klarmarkerade (2026-07-20)",
      "Kalender med ICS-import/export och synk mot StudyFlow (2026-07-09)",
      "Schemaimport med AI-tolkning och 'nästa lektion' med vägbeskrivning (2026-08-14)",
      "Återkommande påminnelser (dagligen, veckovis, vardagar) (2026-07-20)",
      "Snooze, väntar-på-status och smarta deadline-påminnelser (2026-07-23)",
      "Quickflow – snabbinfångst av tankar med dubblettfilter (2026-08-13)",
      "Brain Dump – spara idéer (2026-07-23)",
      "Daglig rutin och Pomodoro-timer (2026-07-23)",
      "Minimera/maximera alla vyer med sparat läge (2026-08-14)",
      "Kalender: 'Ny händelse' och '+ Påminnelse' fick enhetligt utseende och placering (2026-08-15)",
    ],
  },
  {
    title: "Hälsa & välmående",
    items: [
      "Energikarta – logga energinivåer över tid, kopplad till FlowPlan (2026-07-08)",
      "Humörlogg och Må bra-vy (2026-07-23)",
      "Medicinlogg med schemalagda tider, tagningar och påminnelser (2026-07-23)",
      "Proaktiva förslag – väder, medicin, tvätt m.m. (2026-07-20)",
      "Väderkort på startsidan med platslokalisering (Open-Meteo) (2026-07-08)",
    ],
  },
  {
    title: "AI & assistent",
    items: [
      "Flow Assistant med sparad chatthistorik och sidopanel (2026-07-23)",
      "AI-genererade träningspass, studieplaner och quiz (2026-08-13)",
      "Personliga hälsningar, notiser och uppmuntran (2026-07-23)",
      "MCP-server så externa AI-agenter kan använda appen (2026-07-20)",
    ],
  },
  {
    title: "Familj & delning",
    items: [
      "Hushåll med unika join-koder (2026-07-20)",
      "Delad inköpslista och familjekalender (2026-07-20)",
      "Behörigheter och barn-delning (2026-07-20)",
      "Tyst läge – pausa påminnelser 30 min–8 timmar eller varje natt (2026-08-15)",
      "Inköpslista: valbar påminnelseradie per butik – i affären, alldeles nära eller i området (2026-08-15)",

    ],
  },
  {
    title: "Notiser & integrationer",
    items: [
      "Web Push-notiser för medicin, väder, påminnelser och loopar (2026-07-18)",
      "Alarmljud och val mellan alarm eller mild påminnelse (2026-07-20)",
      "Resesida med Trafiklab ResRobot v2.1 och pendlingsvarningar (2026-07-08)",
      "Kalendersynk via ICS (2026-07-09)",
      "Promenadvägar via OpenStreetMap Overpass och höjddata (2026-08-14)",
    ],
  },
  {
    title: "Konto, säkerhet & admin",
    items: [
      "Glömt lösenord – återställningslänk via mejl och sida för nytt lösenord (2026-08-14)",
      "Kontoborttagning (2026-07-23)",
      "Integritet, villkor och cookies-sidor (2026-07-23)",
      "Roller i separat tabell med RLS-härdning (2026-07-08)",
      "Adminpanel med statistik, rollhantering och friktionsrapporter (2026-07-20)",
      "Friktionsindex – användarfeedback med röstning (2026-07-08)",
      "Changelog-export till Word och PDF (2026-08-15)",
    ],
  },
  {
    title: "Design & upplevelse",
    items: [
      "Palett: beige bakgrund, skogsgrön primary, guld accent och vita kort (2026-08-14)",
      "Fraunces display + Inter body, mjuka radier och lena skuggor (2026-08-14)",
      "Flow-voice – varm och lugn svensk copy i hela appen (2026-07-08)",
      "Introtur, enkelt läge och svenska underrubriker (2026-08-14)",
      "Kontextuella hjälptexter med i-knapp på alla kort (2026-08-14)",
      "Tillbakaknapp baserad på historik (2026-08-14)",
      "SEO: sidspecifika og-taggar, JSON-LD, sitemap och robots.txt (2026-08-14)",
    ],
  },
];
