export type ChangelogSection = {
  title: string;
  items: string[];
};

export const CHANGELOG_TITLE = "MyFlove Changelog";
export const CHANGELOG_INTRO =
  "Komplett logg över allt som byggts i MyFlove – från första prototypen till dagens version.";
export const CHANGELOG_UPDATED = "2026-08-16";

export const CHANGELOG_SECTIONS: ChangelogSection[] = [
  {
    title: "Daglig loop",
    items: [
      "Designtokens för palett, rundningar, avstånd, skuggor och kantlinjer – nya komponenter följer designen automatiskt (2026-08-16)",
      "Pastellikoner och emoji på startsidans brickor och genvägar – rundare kort, tydligare ikoner och lätt tryckkänsla (2026-08-16)",
      "Egen sida \"Vad ska jag göra nu?\" på /vad-nu – ett förslag i taget med tid, prioritet, friktion och varför (2026-08-16)",
      "Tidslinje i kalenderns dagsvy – 06–22 med pastellkort, bildstöd och \"Nu\"-markering (2026-08-16)",
      "Pastell-hero på startsidan och i QuickFlow, med andande illustration (2026-08-16)",
      "Hoppa över onboarding – tydlig knapp uppe till höger och fullbredd knapp under, leder direkt till startsidan (2026-08-16)",
      "Onboarding sveps i sidled med tryckbara punkter och räknare \"Steg 2 av 4\" (2026-08-16)",
      "Pasteller och mjuk rörelse – sidor tonar in, kort poppar upp, knappar svarar på tryck (2026-08-16)",
      "QuickFlow i mitten av bottennavigationen – fem platser: Hem, ditt val, QuickFlow, ditt val och Mer (2026-08-16)",
      "Lila även på sidteman – kalender, ekonomi, familj och övriga kategorisidor tintas i lila/rosa/mint (2026-08-16)",
      "Ny design – mjuk lila palett, violett primärfärg, rosa accent, vita kort och rundare former (2026-08-16)",
      "Stop-knapp i Hälsa – nås nu direkt högst upp på \"Må bra\" (2026-08-16)",
      "Anpassa appen (NPF-läge) – lugnare färger, ingen rörelse, färre saker på skärmen, enkla ord, större text och globalt bildstöd (2026-08-16)",
      "Egen kategori \"Flow\" i navigationen – FlowPlan, Fokus, Veckans Flow, Quickflow, Hjälp, Belöningar och MyFlove Insight samlade på ett ställe (2026-08-16)",
      "Egen kategori \"Hälsa\" i navigationen – Må bra, Träning, FlowScore och Statistik separerade från \"Din dag\" (2026-08-16)",
      "Egen ordning på hemskärmen – dra och släpp blocken i \"Anpassa hemskärmen\" (2026-08-16)",
      "Anpassa hemskärmen – lugnare startläge och egna val för vilka block som syns (2026-08-16)",
      "Daily Flow – incheckning av energi, mental belastning och tid som styr dagens förslag (2026-08-16)",

      "Bygg om dagen – MyFlove räknar om resten av dagen när planen spricker, utan skuld (2026-08-16)",
      "\"Vad ska jag göra nu?\" – en rekommendation i taget baserad på FlowScore, friktion och tid (2026-08-16)",
      "Fokusläge – en sak, en timer, inget brus (2026-08-16)",
      "QuickFlow som flytande knapp – dumpa först, bestäm sen (2026-08-16)",
      "QuickFlow-sortering med typförslag och varsam uppföljning av gamla poster (2026-08-16)",
      "Flow Reset – frivilligt kvällsläge med omplanering utan skuld (2026-08-16)",
      "Veckans Flow – lugn tillbakablick och mönster som observationer (2026-08-16)",
      "Onboarding – vad vill du att MyFlove främst hjälper dig med? (2026-08-16)",
    ],
  },
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
      "Skolschema som bild eller dokument – ladda upp och se det direkt i barnets schemavy (2026-08-15)",
      "Barnvyn visar fel med \"Försök igen\" istället för att fastna på laddning (2026-08-15)",
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
