/**
 * En enkel sammanfattning av vad som finns i MyFlove – och vart man går
 * för att göra respektive sak. Används av översiktssidan (/oversikt).
 */
export interface GuideEntry {
  href: string;
  label: string;
  what: string;
}

export interface GuideGroup {
  id: string;
  emoji: string;
  label: string;
  hint: string;
  entries: GuideEntry[];
}

export const APP_GUIDE: GuideGroup[] = [
  {
    id: "start",
    emoji: "🏠",
    label: "Börja här",
    hint: "Det du använder varje dag",
    entries: [
      { href: "/hem", label: "Hem", what: "Din överblick: nästa sak, energi och genvägar" },
      { href: "/idag", label: "Idag", what: "Allt som händer idag – och det du redan gjort" },
      {
        href: "/lagg-till",
        label: "Lägg till",
        what: "Vägen in för aktivitet, påminnelse, rutin eller medicin",
      },
      { href: "/flow", label: "Flow hjälper", what: "Ett förslag i taget när du kört fast" },
      {
        href: "/flowplan",
        label: "FlowPlan",
        what: "Ett redigerbart förslag på ordningen för dagens saker",
      },
      {
        href: "/assistant",
        label: "Prata med Flow",
        what: "Chatta med Flow när du vill prata av dig eller tänka högt",
      },
      { href: "/quickflow", label: "QuickFlow", what: "Skriv av dig snabbt – sortera sen" },
    ],
  },
  {
    id: "planera",
    emoji: "🗓️",
    label: "Planera",
    hint: "Bestäm och ordna vad som ska hända",
    entries: [
      { href: "/kalender", label: "Kalender", what: "Alla tider på en plats, med filter per rum" },
      {
        href: "/tasks",
        label: "Alla uppgifter",
        what: "Hela listan framåt – dagens saker bor i Idag",
      },
      { href: "/paminnelser", label: "Påminnelser", what: "Notiser och alarm som knuffar dig" },
      {
        href: "/daglig-rutin",
        label: "Rutiner & medicin",
        what: "Morgonstart, rutiner och medicin",
      },
      { href: "/pomodoro", label: "Timer", what: "Jobba en stund, ta paus" },
    ],
  },
  {
    id: "halsa",
    emoji: "❤️",
    label: "Hälsa",
    hint: "Energi, mående, träning, medicin och vila",
    entries: [
      { href: "/halsa", label: "Hälsa", what: "Ingången till allt som rör hur du mår" },
      {
        href: "/mitt-batteri",
        label: "Mitt batteri",
        what: "Checka in ork och mående på några sekunder – historik finns där",
      },
      { href: "/traning", label: "Träning & promenader", what: "Rörelse i lagom dos" },
      {
        href: "/daglig-rutin",
        label: "Rutiner & medicin",
        what: "Morgonstart, fasta rutiner och dagens doser",
      },
      { href: "/statistik", label: "Statistik", what: "Dina mönster över tid" },
    ],
  },
  {
    id: "hemma",
    emoji: "🏡",
    label: "Hem",
    hint: "Mat, inköp, städning och pengar",
    entries: [
      { href: "/matlista", label: "Matlista", what: "Veckans mat – egen eller delad" },
      { href: "/shopping", label: "Inköpslista", what: "Inköpslista du kan dela med andra" },
      { href: "/stadning", label: "Städning", what: "Vad som behöver göras hemma" },
      { href: "/finances", label: "Ekonomi", what: "Räkningar och budget" },
    ],
  },
  {
    id: "livet",
    emoji: "👨‍👩‍👧",
    label: "Människor & resor",
    hint: "De du delar vardagen med",
    entries: [
      { href: "/relationer", label: "Relationer", what: "Partner, vänner, familj och husdjur" },
      { href: "/familj", label: "Familj", what: "Dela listor och kalender" },
      { href: "/barn", label: "Barn", what: "Scheman och rutiner för barnen" },
      { href: "/travel", label: "Resor", what: "Buss och tåg i realtid" },
    ],
  },
  {
    id: "studier-jobb",
    emoji: "🎓",
    label: "Studier & jobb",
    hint: "När vardagen har krav utifrån",
    entries: [
      { href: "/studyflow", label: "StudyFlow", what: "Schema, prov och pluggplan" },
      { href: "/studybuddy", label: "StudyBuddy", what: "Quiz och flashcards från ditt material" },
      { href: "/jobb", label: "Jobb", what: "Uppgifter och möten" },
      { href: "/workflow", label: "WorkFlow", what: "Din kapacitet på jobbet" },
    ],
  },
  {
    id: "dig",
    emoji: "⚙️",
    label: "Gör appen till din",
    hint: "Anpassning och profil",
    entries: [
      { href: "/profil", label: "Min profil", what: "Namn, barn, din vardag och dina behov" },
      {
        href: "/anpassa-hem",
        label: "Anpassa hemskärmen",
        what: "Välj block, ordning och genvägar",
      },
      { href: "/anpassa", label: "Anpassa appen", what: "Lugnare färger, färre saker, tyst läge" },
      { href: "/insight", label: "Insight", what: "Testa strategier och se vad som funkar" },
    ],
  },
];
