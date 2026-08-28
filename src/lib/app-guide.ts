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
      { href: "/idag", label: "Min dag", what: "Allt som händer idag – och det du redan gjort" },
      { href: "/flow", label: "Flow", what: "Får du ett förslag i taget när du kört fast" },
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
    hint: "Tider, uppgifter och rutiner",
    entries: [
      { href: "/kalender", label: "Kalender", what: "Alla tider på en plats, med filter per rum" },
      { href: "/tasks", label: "Att göra", what: "Dina uppgifter, med tid och energinivå" },
      { href: "/paminnelser", label: "Påminnelser", what: "Notiser och alarm som knuffar dig" },
      { href: "/daglig-rutin", label: "Rutiner & medicin", what: "Morgonstart, rutiner och medicin" },
      { href: "/pomodoro", label: "Timer", what: "Jobba en stund, ta paus" },
    ],
  },
  {
    id: "mabra",
    emoji: "💜",
    label: "Mående & energi",
    hint: "Hur du mår och hur mycket ork du har",
    entries: [
      { href: "/mitt-batteri", label: "Mitt batteri", what: "Logga humör och ork på några sekunder" },
      { href: "/energifloede", label: "Energins historik", what: "Vad som brukar ge och ta energi" },
      { href: "/traning", label: "Träning", what: "Rörelse i lagom dos" },
      { href: "/statistik", label: "Statistik", what: "Dina mönster över tid" },
    ],
  },
  {
    id: "hemma",
    emoji: "🏡",
    label: "Hemma",
    hint: "Mat, inköp, städ och pengar",
    entries: [
      { href: "/matlista", label: "Matlista", what: "Veckans mat – egen eller delad" },
      { href: "/shopping", label: "Inköp", what: "Inköpslista du kan dela med andra" },
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
      { href: "/min-livsprofil", label: "Min livsprofil", what: "Din vardag, styrkor och behov" },
      { href: "/anpassa-hem", label: "Anpassa hemskärmen", what: "Välj block, ordning och genvägar" },
      { href: "/anpassa", label: "Anpassa appen", what: "Lugnare färger, färre saker, tyst läge" },
      { href: "/insight", label: "Insight", what: "Testa strategier och se vad som funkar" },
    ],
  },
];
