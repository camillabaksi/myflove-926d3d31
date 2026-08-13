export type ChangelogSection = {
  title: string;
  items: string[];
};

export const CHANGELOG_TITLE = "MyFlove Changelog";
export const CHANGELOG_INTRO =
  "Sammanställning av de viktigaste funktionerna som byggts i MyFlove.";
export const CHANGELOG_UPDATED = "2026-08-13";

export const CHANGELOG_SECTIONS: ChangelogSection[] = [
  {
    title: "Kärnkoncept",
    items: [
      "Flow AI-personlighet – anpassat stöd efter din dagsform",
      "FlowPlan™ – sekvensplanering av uppgifter",
      "FlowScore™ – kapacitetspoäng baserad på energi, humör och arbetsbörda",
      "WorkFlow™ – arbetsläge med omplanering och mötesläge",
      "StudyFlow™ – pluggsmart läge med föreläsnings- och repetitionssynk",
      "MyFlove Insight™ – demoversion för NPF-profiler och strategier",
    ],
  },
  {
    title: "Livsområden & moduler",
    items: [
      "Vardag, Studier, Jobb, Privat – separata ytor med unika färger och ikoner",
      "Barn-modulen – barnprofiler och delning inom familjen",
      "Hem & familj – hushåll, gemensam inköpslista och kalender",
      "Träning – styrka/kondition, AI-pass och hälsoapp-koppling",
      "Städning – rumsvisa lägen och checklistor",
      "Ekonomi – transaktioner och budgetpanel",
      "Matlista – favoriter och förslag",
    ],
  },
  {
    title: "Planering & produktivitet",
    items: [
      "Uppgifter med tid, påminnelse, återkommande, delsteg och bilagor",
      "Kalender med ICS-import/export och synk mot StudyFlow",
      "Återkommande påminnelser (dagligen, veckovis, vardagar)",
      "Snooze, väntar-på-status och smarta deadline-påminnelser",
      "Quickflow – snabbinfångst av tankar",
      "Brain Dump – spara idéer",
    ],
  },
  {
    title: "Hälsa & välmående",
    items: [
      "Energikarta – logga energinivåer över tid",
      "Humörlogg",
      "Medicinlogg med tagningar och påminnelser",
      "Stoppknappen™ – andningsövningar och AI-stöd vid överbelastning",
      "Proaktiva förslag – väder, medicin, tvätt m.m.",
    ],
  },
  {
    title: "AI & assistent",
    items: [
      "Flow Assistant med chatthistorik",
      "FlowStudy – flervalsfrågor, flashcards och Leitner-repetition",
      "AI-genererade träningspass och studieplaner",
      "Personliga hälsningar och notiser",
    ],
  },
  {
    title: "Familj & delning",
    items: [
      "Hushåll med unika join-koder",
      "Delad inköpslista och familjekalender",
      "Behörigheter och barn-delande",
    ],
  },
  {
    title: "Notiser & integrationer",
    items: [
      "Web Push-notiser (medicin, väder, påminnelser, loopar)",
      "Väderintegration med platslokalisering",
      "Resesida med Trafiklab ResRobot v2.1",
      "Kalendersynk (ICS)",
    ],
  },
  {
    title: "Säkerhet, juridik & admin",
    items: [
      "Integritet, villkor och cookies-sidor",
      "Kontoborttagning",
      "Adminpanel med statistik, roller och friktionsrapporter",
      "RLS-härdning och säkerhetsfunktioner",
    ],
  },
  {
    title: "Teknik & plattform",
    items: [
      "PWA – installera på hemskärmen",
      "Capacitor-stöd för iOS/Android",
      "SEO, tillgänglighet, sitemap och robots.txt",
      "MCP-server för externa AI-agenter",
      "Analys och feedbackloggning i admin-statistik",
    ],
  },
];
