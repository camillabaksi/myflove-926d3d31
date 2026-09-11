/**
 * Minimal i18n för MyFlove.
 *
 * Princip: svenska är källspråket. Nycklarna ÄR den svenska texten, så att
 * befintlig kod kan lindas in med `t(...)` utan att skrivas om. Saknas en
 * engelsk översättning faller vi tillbaka på svenskan – aldrig en tom sträng
 * eller en synlig nyckel.
 */

import { EN_QUICKFLOW } from "@/lib/i18n-dicts/quickflow";
import { EN_CALENDAR } from "@/lib/i18n-dicts/calendar";
import { EN_BATTERY } from "@/lib/i18n-dicts/battery";
import { EN_HISTORY } from "@/lib/i18n-dicts/history";
import { EN_NOTES } from "@/lib/i18n-dicts/notes";
import { EN_ADMIN } from "@/lib/i18n-dicts/admin";

export type Lang = "sv" | "en";

export const LANGUAGE_KEY = "myflove-language";

export const LANGUAGES: { value: Lang; label: string; flag: string }[] = [
  { value: "sv", label: "Svenska", flag: "🇸🇪" },
  { value: "en", label: "English", flag: "🇬🇧" },
];

/** Svenska → engelska. Håll den sorterad efter område. */
export const EN: Record<string, string> = {
  // ── Navigation ──────────────────────────────────────────────────────────
  Hem: "Home",
  Idag: "Today",
  Hälsa: "Health",
  "Mitt batteri": "My battery",
  "Energins historik": "Energy history",
  "Stop-paus": "Stop & pause",
  Träning: "Exercise",
  "Rutiner & medicin": "Routines & meds",
  "Rutiner och medicin": "Routines and meds",
  QuickFlow: "QuickFlow",
  Anteckningar: "Notes",
  Kalender: "Calendar",
  Påminnelser: "Reminders",
  "Alla uppgifter": "All tasks",
  "Dagens balans": "Today's balance",
  "Veckans översikt": "Week overview",
  Timer: "Timer",
  Inköpslista: "Shopping list",
  Matlista: "Meal plan",
  Städning: "Cleaning",
  Ekonomi: "Finances",
  Resor: "Travel",
  Relationer: "Relationships",
  Familj: "Family",
  Barn: "Children",
  Historik: "History",
  Statistik: "Statistics",
  Belöningar: "Rewards",
  "Mina mönster": "My patterns",
  Planera: "Plan",
  Flow: "Flow",
  "Chatta med Flow": "Chat with Flow",
  Feedback: "Feedback",
  Studier: "Studies",
  Studiehjälp: "Study help",
  Jobb: "Work",
  Jobbplanering: "Work planning",
  Adminöversikt: "Admin overview",
  Appstatistik: "App statistics",
  "Flow-inställningar": "Flow settings",
  "Så funkar MyFlove": "How MyFlove works",
  "Min profil": "My profile",
  "Anpassa hemskärmen": "Customise home screen",
  "Anpassa appen": "Customise the app",
  Mer: "More",

  // Navigationens hjälptexter
  "Din överblick över dagen": "Your overview of the day",
  "Vad som händer idag – hela dagens lista": "What's happening today – the full list",
  "Energi, mående, träning, medicin och vila": "Energy, mood, exercise, meds and rest",
  "Energi och mående – checka in på några sekunder": "Energy and mood – check in in a few seconds",
  "Mönster: vad som brukar ge och ta energi": "Patterns: what usually gives and takes energy",
  "🛑 En paus mellan impuls och beslut": "🛑 A pause between impulse and decision",
  "Enkla pass anpassade efter din ork": "Simple sessions matched to your energy",
  "Fasta rutiner och dagens doser": "Fixed routines and today's doses",
  "Fånga något snabbt – sortera sedan": "Capture it quickly – sort it later",
  "Din idébank – tankar utan krav": "Your idea bank – thoughts without demands",
  "Tider och händelser, dag för dag": "Times and events, day by day",
  "Lägg till, ändra och avboka påminnelser": "Add, change and cancel reminders",
  "Hela listan framåt – dagens saker bor i Idag":
    "The whole list ahead – today's things live in Today",
  "Hur dagens krav matchar din ork": "How today's demands match your energy",
  "Lugn tillbakablick på veckan": "A calm look back at the week",
  "Jobba en stund, ta paus": "Work a while, then pause",
  "Inköpslista du kan dela": "A shopping list you can share",
  "Planera veckans mat": "Plan the week's meals",
  "Vad som behöver göras hemma": "What needs doing at home",
  "Räkningar och budget": "Bills and budget",
  "Buss och tåg i realtid": "Buses and trains in real time",
  "Personerna som hör till ditt liv": "The people in your life",
  "Dela listor och kalender med andra": "Share lists and calendar with others",
  "Scheman och rutiner för barnen": "Schedules and routines for the kids",
  "Vad hände dina dagar – och vad gav eller tog energi":
    "What happened in your days – and what gave or took energy",
  "Se dina mönster över tid": "See your patterns over time",
  "Små morötter när du gjort något": "Small rewards when you've done something",
  "Vad som brukar funka för dig": "What usually works for you",
  "Planeringsläget i Flow – ordna dagens saker": "Flow's planning mode – arrange today's things",
  "Hjälp, planering och chatt på ett ställe": "Help, planning and chat in one place",
  "Chatten i Flow": "The chat in Flow",
  "Berätta vad som skaver i appen": "Tell us what feels off in the app",
  "Schema, prov och vad du ska plugga nu": "Schedule, exams and what to study now",
  "Flashcards och quiz på ditt material": "Flashcards and quizzes on your material",
  "Dina arbetsuppgifter och möten": "Your work tasks and meetings",
  "Vad du ska göra härnäst på jobbet": "What to do next at work",
  "Roller, åtkomst och rapporter": "Roles, access and reports",
  "Besökare och användning": "Visitors and usage",
  "Hjälpnivå, när Flow får höra av sig och vad han prioriterar":
    "Help level, when Flow may reach out and what it prioritises",
  "Enkel sammanfattning av allt i appen – och vart du går":
    "A simple summary of everything in the app – and where to go",
  "Namn, barn, din vardag, styrkor och vad du vill ha hjälp med":
    "Name, children, your everyday life, strengths and where you want help",
  "Välj vilka block som syns på Hem, ordning och dina genvägar":
    "Choose which blocks show on Home, their order and your shortcuts",
  "Lugnare färger, färre saker, tyst läge och enkla ord":
    "Calmer colours, fewer things, quiet mode and simple words",

  // ── Flow-röst: empty states ─────────────────────────────────────────────
  "Inget att göra just nu. Det är okej att bara vara.":
    "Nothing to do right now. It's okay to just be.",
  "Inget fokus valt idag – välj något smått om du orkar.":
    "No focus chosen today – pick something small if you have it in you.",
  "Listan är tom. En sak i taget räcker gott.": "The list is empty. One thing at a time is plenty.",
  "Inget inplanerat – dagen är din.": "Nothing planned – the day is yours.",
  "Lugn dag. Inget måste hända.": "A calm day. Nothing has to happen.",
  "Du har inte loggat något än idag – bara om du vill.":
    "You haven't logged anything today – only if you want to.",
  "Inga mediciner tillagda än – lägg till när det passar.":
    "No medications added yet – add them when it suits you.",
  "Inga transaktioner än – börja när du är redo.": "No transactions yet – start when you're ready.",
  "Huvudet får vara tomt här. Skriv när det kommer något.":
    "Your head can be empty here. Write when something comes.",
  "Inget skaver just nu – kul att höra.": "Nothing feels off right now – good to hear.",
  "Här är tomt. Det är också okej.": "It's empty here. That's okay too.",

  // ── Flow-röst: bekräftelser ─────────────────────────────────────────────
  "Klart. En sak mindre att bära.": "Done. One less thing to carry.",
  "Sparat. Vi tar det när det passar.": "Saved. We'll take it when it suits you.",
  "Tack för att du berättade.": "Thank you for telling me.",
  "Bockat. Bra jobbat.": "Ticked off. Nicely done.",
  Sparat: "Saved",
  "Sparat.": "Saved.",
  "Då kör vi på det – bara det, inget annat.": "Then let's go with that – just that, nothing else.",

  // ── Flow-röst: fel ──────────────────────────────────────────────────────
  "Det gick inte just nu. Prova igen om en stund.":
    "That didn't work right now. Try again in a little while.",
  "Det verkar knagga med anslutningen. Vi väntar in den.":
    "The connection seems shaky. We'll wait for it.",
  "Sparningen fastnade. Din text finns kvar – prova igen.":
    "The save got stuck. Your text is still here – try again.",
  "Kunde inte hämta det just nu.": "Couldn't fetch that right now.",
  "Flow är tyst just nu. Prova igen om en stund.":
    "Flow is quiet right now. Try again in a little while.",
  "Många frågar Flow just nu. Testa igen om en stund.":
    "A lot of people are asking Flow right now. Try again shortly.",
  "AI-krediten är slut. Fyll på i inställningarna när det passar.":
    "The AI credit has run out. Top it up in settings when it suits you.",

  // ── Flow-röst: uppmuntran ───────────────────────────────────────────────
  "En liten sak räcker.": "One small thing is enough.",
  "Att vila är också att göra något.": "Resting is doing something too.",
  "Bra nog är bra.": "Good enough is good.",
  "Vi börjar om imorgon om det behövs.": "We'll start over tomorrow if we need to.",
  "En sak i taget. Du hinner.": "One thing at a time. You have time.",

  // ── Hälsning ────────────────────────────────────────────────────────────
  "Hej på dig": "Hello there",
  "God natt-timme": "Late-night hour",
  "Fint att du tittar in": "Lovely that you stopped by",
  "God morgon": "Good morning",
  Godmorgon: "Good morning",
  "Hej på morgonen": "Morning to you",
  "Mysig morgon": "Cosy morning",
  "Hej i dagen": "Hello today",
  "Skön förmiddag": "Lovely morning",
  "Kul att se dig": "Good to see you",
  "God eftermiddag": "Good afternoon",
  Hej: "Hi",
  "Trevlig eftermiddag": "Nice afternoon",
  "God kväll": "Good evening",
  "Skön kväll": "Lovely evening",
  "Fint att du är här": "Lovely that you're here",
  "Sen kväll?": "Late night?",
  "Hej, nattlugn": "Hi, night calm",
  "Fin sen kväll": "Nice late evening",
  "Kul att se dig igen.": "Good to see you again.",
  "Fint att du kom tillbaka.": "Lovely that you came back.",
  "Skönt att ha dig här.": "Good to have you here.",
  "Välkommen tillbaka.": "Welcome back.",
  "Välkommen tillbaka efter pausen.": "Welcome back after the break.",
  "Hoppas du haft det bra sen sist.": "Hope you've been well since last time.",
  "Kul att du hittade tillbaka.": "Glad you found your way back.",
  "Vad kul att du är här!": "So glad you're here!",
  "Välkommen. Ta det i din takt.": "Welcome. Take it at your own pace.",
  "Så fint att du hittade hit.": "Lovely that you found your way here.",
  "Här är en lugn överblick över idag.": "Here's a calm overview of today.",

  // ── Hem ─────────────────────────────────────────────────────────────────
  "Hej!": "Hi!",
  "Du gör ett fantastiskt jobb!": "You're doing an amazing job!",
  "Vad ska jag kalla dig?": "What should I call you?",
  Spara: "Save",
  Avbryt: "Cancel",
  "Byt namn": "Change name",
  "Vad vill du göra just nu?": "What would you like to do right now?",
  Quickflow: "Quickflow",
  "Få ner det snabbt": "Get it out quickly",
  Batteriet: "The battery",
  "Hur mycket ork har du?": "How much energy do you have?",
  "Din ork idag": "Your energy today",
  "Du har": "You have",
  energi: "energy",
  Kalendern: "The calendar",
  "Din överblick": "Your overview",
  "Ditt batteri": "Your battery",
  "Gott jobbat!": "Well done!",
  "Du har gott om kraft kvar idag.": "You have plenty of energy left today.",
  "Du har lite kvar att ge idag.": "You have a little left to give today.",
  "Ganska tomt just nu – ta det lugnt.": "Fairly empty right now – take it easy.",
  "Tips för mer energi": "Tips for more energy",
  "Logga energi & mående": "Log energy & mood",
  "Visa dagsschema": "Show day schedule",
  "Inget inlagt för idag ännu. Det är också helt okej.":
    "Nothing added for today yet. That's completely okay too.",
  "Från ditt huvud": "From your head",
  "Visa alla": "Show all",
  "Inget som snurrar just nu – tryck på Quickflow när något dyker upp.":
    "Nothing spinning right now – tap Quickflow when something comes up.",
  "Dagens tanke": "Today's thought",
  "Små steg varje dag": "Small steps every day",
  "skapar stora förändringar.": "create big changes.",
  "Din vardag": "Your everyday life",
  "Det här har MyFlove lärt sig av dina egna dagar":
    "This is what MyFlove has learned from your own days",
  "Det här har MyFlove lärt sig om din vardag":
    "This is what MyFlove has learned about your everyday life",
  "Se fler mönster": "See more patterns",
  "MyFlove har lagt märke till…": "MyFlove has noticed…",
  "MyFlove har lagt märke till": "MyFlove has noticed",
  "Små mönster i din egen data": "Small patterns in your own data",
  Insikter: "Insights",
  "Dagens rutiner och doser": "Today's routines and doses",
  "MyFlove ser hela din dag – oavsett vilket rum sakerna hör till.":
    "MyFlove sees your whole day – no matter which room things belong to.",
  "Du använder Quickflow mest, så den ligger först här nu.":
    "You use Quickflow the most, so it comes first here now.",
  "Du använder kalendern mest, så den ligger först här nu.":
    "You use the calendar the most, so it comes first here now.",
  "Du checkar in i batteriet ofta, så det ligger först här nu.":
    "You check in on your battery often, so it comes first here now.",

  // ── Profil: språk ───────────────────────────────────────────────────────
  Språk: "Language",
  "Välj språk för appen": "Choose the app language",
  "Appens språk – texterna byts direkt.": "The app language – texts switch right away.",
};

/** Områdesordlistor slås ihop med kärnan. Kärnan vinner vid krock. */
const DICT: Record<string, string> = {
  ...EN_QUICKFLOW,
  ...EN_CALENDAR,
  ...EN_BATTERY,
  ...EN_HISTORY,
  ...EN_NOTES,
  ...EN_ADMIN,
  ...EN,
};

/** Svenska veckodagar → engelska, för genererade meningar. */
const WEEKDAY_EN: Record<string, string> = {
  måndag: "Monday",
  tisdag: "Tuesday",
  onsdag: "Wednesday",
  torsdag: "Thursday",
  fredag: "Friday",
  lördag: "Saturday",
  söndag: "Sunday",
  måndagar: "Mondays",
  tisdagar: "Tuesdays",
  onsdagar: "Wednesdays",
  torsdagar: "Thursdays",
  fredagar: "Fridays",
  lördagar: "Saturdays",
  söndagar: "Sundays",
  och: "and",
};

function enWords(part: string): string {
  return part
    .split(/\b/)
    .map((w) => WEEKDAY_EN[w.toLowerCase()] ?? w)
    .join("");
}

/**
 * Genererade meningar (veckoöversikt m.m.) matchas som mönster, så att
 * dynamiska delar – veckodagar, kategorinamn – följer med över.
 */
export const EN_PATTERNS: { re: RegExp; en: (m: RegExpMatchArray) => string }[] = [
  {
    re: /^Du hade mest ork på (.+), medan (.+) verkar ha varit tyngre\.$/,
    en: (m) =>
      `You had the most energy on ${enWords(m[1]!)}, while ${enWords(m[2]!)} seem to have been heavier.`,
  },
  {
    re: /^Du verkar ha haft mycket på (.+)\. Vill du planera lite mer luft nästa (.+)\?$/,
    en: (m) =>
      `You seem to have had a lot on ${enWords(m[1]!)}. Would you like to plan a bit more space next ${enWords(m[2]!)}?`,
  },
  {
    re: /^(.+) verkar ha gett dig energi\.$/,
    en: (m) => `${translateSegment(m[1]!)} seems to have given you energy.`,
  },
  {
    re: /^(.+) verkar ha tagit mer av din ork\.$/,
    en: (m) => `${translateSegment(m[1]!)} seems to have taken more of your energy.`,
  },
];

function translateSegment(text: string): string {
  const trimmed = text.trim();
  const hit = DICT[trimmed];
  if (hit) return hit;
  for (const p of EN_PATTERNS) {
    const m = trimmed.match(p.re);
    if (m) return p.en(m);
  }
  return text;
}

/** Översätt en svensk källsträng. Okänd text returneras oförändrad. */
export function translate(text: string, lang: Lang): string {
  if (lang === "sv") return text;
  const direct = DICT[text];
  if (direct) return direct;
  for (const p of EN_PATTERNS) {
    const m = text.match(p.re);
    if (m) return p.en(m);
  }
  // Sammansatta meningar översätts mening för mening.
  const parts = text.match(/[^.!?]+[.!?]+\s*/g);
  if (parts && parts.length > 1) {
    const out = parts.map((part) => {
      const trailing = part.match(/\s*$/)?.[0] ?? "";
      return translateSegment(part.trim()) + trailing;
    });
    return out.join("");
  }
  return text;
}

/** Locale för datum, tider och tal. */
export function localeFor(lang: Lang): string {
  return lang === "en" ? "en-GB" : "sv-SE";
}

/** Ersätter hårdkodad "sv-SE" i datumformatering. */
export function formatDate(
  date: Date | string,
  lang: Lang,
  options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" },
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(localeFor(lang), options);
}
