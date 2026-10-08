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
  // Approved first text stage; legacy keys intentionally remain unchanged.
  Pace: "Pace",
  "Din takt": "Your pace",
  "Pace & samtal": "Pace & conversations",
  "Prata med Pace": "Talk to Pace",
  "Chatta med Pace": "Chat with Pace",
  "Chatta med Pace – din personliga följeslagare": "Chat with Pace – your personal companion",
  "Planeringsläget i Pace – ordna dagens saker": "Pace's planning mode – arrange today's things",
  "Pace-inställningar": "Pace settings",
  "Fler Pace-inställningar": "More Pace settings",
  "Anpassa Paceable": "Customise Paceable",
  "Anpassa Paceable, konto och appens inställningar.": "Customise Paceable, your account and app settings.",
  "Så funkar Paceable": "How Paceable works",
  "Vad som visas och hur Pace hjälper": "What is shown and how Pace helps",
  "Idag, Kalender, Fånga, Min plats och Mer ligger fast för alla.": "Today, Calendar, Capture, My space and More are fixed for everyone.",
  "Pace tänker…": "Pace is thinking…",
  "Pace lyssnar när du behöver det.": "Pace listens when you need it.",
  "Pace utgår från din profil och dina mönster i appen.": "Pace uses your profile and your patterns in the app.",
  "En liten lägesbild från Pace": "A small snapshot from Pace",
  "Skriv när du vill – Pace lyssnar": "Write whenever you want – Pace listens",
  "Skriv till Pace…": "Write to Pace…",
  "Spara hos Pace?": "Save with Pace?",
  "Pace använder det i framtida samtal. Du kan ändra eller ta bort det när du vill.": "Pace uses it in future conversations. You can change or delete it whenever you want.",
  "Sparade samtal är bara din historik – de blir inte automatiskt en del av vad Pace lär sig om dig.": "Saved conversations are only your history – they do not automatically become part of what Pace learns about you.",
  "Pace kunde inte läsa meddelandet. Prova att starta en ny chatt eller skriv lite kortare.": "Pace could not read the message. Try starting a new chat or writing a little less.",
  "Pace – Paceables följeslagare": "Pace – Paceable's companion",
  "Hur mycket ska Pace hjälpa till?": "How much should Pace help?",
  "Du bestämmer. Pace ska aldrig vara i vägen.": "You decide. Pace should never get in the way.",
  "Pace syns men säger inget": "Pace is visible but says nothing",
  "Pace hör av sig oftare": "Pace reaches out more often",
  "Pace syns men säger inget själv.": "Pace is visible but does not speak unprompted.",
  "Pace hör bara av sig när det spelar roll.": "Pace only reaches out when it matters.",
  "Pace hör av sig oftare och tipsar mer.": "Pace reaches out more often with more tips.",
  "Pace får berätta vad Pace lär sig": "Pace may share what it learns",
  "Pace får berätta vad Pace lär sig om dig": "Pace may share what it learns about you",
  "Visa Pace i appen": "Show Pace in the app",
  "Hur mycket plats Pace får ta i vardagen.": "How much space Pace may take in everyday life.",
  "Du bestämmer hur mycket Pace får säga, när Pace får höra av sig och vad Pace ska hålla koll på. Inget av det här ändrar dina uppgifter.": "You decide how much Pace may say, when Pace may reach out and what Pace should keep track of. None of this changes your tasks.",
  "När får Pace höra av sig?": "When may Pace reach out?",
  "Utanför det här fönstret är Pace tyst – Pace finns kvar men säger inget själv.": "Outside this window Pace is quiet – still here, but does not speak unprompted.",
  "Vad ska Pace prioritera?": "What should Pace prioritise?",
  "Välj vilka typer av tider Pace håller extra koll på. Resten ligger kvar i appen som vanligt.": "Choose which types of times Pace pays extra attention to. Everything else stays in the app as usual.",
  "Se Pace live": "See Pace live",

  // ── Navigation ──────────────────────────────────────────────────────────
  Hem: "Home",
  Idag: "Today",
  Fånga: "Capture",
  "Min plats": "My space",
  "Anpassa Paceable, konto och appens inställningar": "Customise Paceable, your account and app settings",
  "Huvudnavigation": "Main navigation",
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
  "Din dag, i din takt": "Your day, at your pace",
  "Din kapacitet idag": "Your capacity today",
  "Hur börjar du dagen?": "How are you starting today?",
  "Checka in": "Check in",
  "Checka in när du vill för att se hur dagen passar det du har att röra dig med.": "Check in when you want to see how today fits what you have available.",
  "Din egen registrering blir dagens kapacitet. Du kan hoppa över detta.": "Your own check-in becomes today's capacity. You can skip this.",
  "En dag med lite mindre kapacitet.": "A day with a little less capacity.",
  "Det här är vad du har att röra dig med idag.": "This is what you have available today.",
  "Det finns mer kapacitet att röra sig med idag.": "There is more capacity available today.",
  "Dagens Pace": "Today's Pace",
  Varsamt: "Gentle",
  Jämnt: "Steady",
  Utrymme: "Open",
  "Belastningen är inte uppskattad ännu.": "The load has not been estimated yet.",
  "Det är ganska mycket som kräver din uppmärksamhet idag.": "Quite a lot is asking for your attention today.",
  "Ta dagen varsamt. Planen får ändras om du behöver.": "Take the day gently. The plan can change if you need it to.",
  "Det är tätt mellan flera saker med kända tider.": "Several activities with known times are close together.",
  "Det finns lite luft i dagen. Du behöver inte använda den.": "There is some room in the day. You do not need to use it.",
  "Idag ser ganska jämn ut. Ta dagen som den kommer.": "Today looks fairly steady. Take it as it comes.",
  "Gör dagen lättare": "Make today lighter",
  "Det här kan vara en krävande dag även om inget går att flytta.": "This may be a demanding day even if nothing can be moved.",
  "Inget ändras förrän du själv väljer. Här är det som faktiskt finns i planen.": "Nothing changes until you choose. This is what is actually in the plan.",
  "Tider i planen": "Times in the plan",
  "Kan granskas": "Can be reviewed",
  "Öppna kalendern och välj själv": "Open the calendar and choose",
  "Du behöver inte använda allt utrymme.": "You do not need to use all the room.",
  "Vi börjar där du är idag.": "We start where you are today.",
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
  "Se allt som finns i MyFlove": "See everything in MyFlove",
  "Fråga Flow": "Ask Flow",
  "Min profil": "My profile",
  "Anpassa hemskärmen": "Customise home screen",
  "Anpassa appen": "Customise the app",
  Mer: "More",
  "Vad har du i huvudet?": "What's on your mind?",
  "Skriv eller säg det som det är.": "Write or say it as it is.",
  "Du granskar alltid förslaget innan något sparas.": "You always review the suggestion before anything is saved.",
  "En lugn plats för dig": "A calm space for you",
  "Checka in, se dina mönster eller hitta återhämtning.": "Check in, see your patterns or find recovery.",
  "Välj en paus som passar just nu.": "Choose a pause that fits right now.",

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
  "Inget som snurrar just nu – tryck på Fånga när något dyker upp.":
    "Nothing spinning right now – tap Capture when something comes up.",
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
  "Du använder Fånga mest, så den ligger först här nu.":
    "You use Capture the most, so it comes first here now.",
  "Du använder kalendern mest, så den ligger först här nu.":
    "You use the calendar the most, so it comes first here now.",
  "Du checkar in i batteriet ofta, så det ligger först här nu.":
    "You check in on your battery often, so it comes first here now.",

  // ── Profil: språk ───────────────────────────────────────────────────────
  Språk: "Language",
  "Välj språk för appen": "Choose the app language",
  "Appens språk – texterna byts direkt.": "The app language – texts switch right away.",

  // ── Inloggning ──────────────────────────────────────────────────────────
  "Logga in på MyFlove — Ditt stöd i vardagen":
    "Sign in to MyFlove — Your support in everyday life",
  "Välkommen tillbaka. Logga in för att fortsätta din flow.":
    "Welcome back. Sign in to continue your flow.",
  "E-post": "Email",
  "Lösenord": "Password",
  "Logga in": "Sign in",
  "Loggar in…": "Signing in…",
  "Väcker tjänsten…": "Waking the service…",
  "Kunde inte logga in": "Couldn't sign in",
  "Tjänsten vaknar fortfarande. Vänta en liten stund och försök igen.":
    "The service is still waking up. Wait a moment and try again.",
  "Glömt lösenord?": "Forgot password?",
  "Inget konto?": "No account?",
  "Skapa ett här": "Create one here",

  // ── PWA-installation ────────────────────────────────────────────────────
  "Lägg till MyFlove på hemskärmen": "Add MyFlove to your home screen",
  "Öppna MyFlove snabbare när du behöver Flow.": "Open MyFlove faster when you need Flow.",
  "Lägg till på hemskärmen": "Add to home screen",
  "Så lägger du till MyFlove": "How to add MyFlove",
  "Ha Flow nära till hands 💜 – appen hamnar direkt på din hemskärm.":
    "Keep Flow close 💜 – the app lands right on your home screen.",
  "1. Tryck på Dela längst ner i Safari.": "1. Tap Share at the bottom of Safari.",
  "2. Välj ”Lägg till på hemskärmen” och tryck Lägg till.":
    "2. Choose “Add to home screen” and tap Add.",
  "1. Öppna webbläsarens meny (⋮ eller ☰).": "1. Open the browser menu (⋮ or ☰).",
  "2. Välj ”Installera app” eller ”Lägg till på startskärmen”.":
    "2. Choose “Install app” or “Add to home screen”.",
  "Okej, jag fixar det": "Okay, I'll do it",
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
