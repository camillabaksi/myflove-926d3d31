/**
 * MyFlove – gemensam emoji-mappning.
 * Samma emoji för samma funktion i hela appen. Byt aldrig emoji per sida.
 */
export const MYFLOVE_EMOJI = {
  // Hem & navigation
  home: "🏠",
  lifeflow: "🏠",
  calendar: "📅",
  search: "🔍",
  settings: "⚙️",
  profile: "👤",
  place: "📍",

  // Flow
  quickflow: "⚡",
  energy: "⚡",
  insight: "🧠",
  focus: "🧠",
  flowplan: "🗺️",
  flowscore: "📊",
  flowReset: "🌙",
  dailyFlow: "☀️",
  whatNow: "🤔",
  assistant: "💬",
  pomodoro: "⏳",
  dump: "🗒️",
  weekFlow: "🌤️",

  // Att göra
  priority: "🎯",
  tasks: "🎯",
  reminder: "⏰",
  meetings: "⏰",
  done: "✓",
  replan: "🔄",
  routines: "🔁",
  achievements: "🏆",
  stats: "📈",

  // Livsområden
  work: "💼",
  study: "🎓",
  studyflow: "🎓",
  travel: "✈️",
  finance: "💰",
  documents: "📄",
  notes: "📝",
  material: "📎",
  family: "👨‍👩‍👧",
  children: "🧒",

  // Hem & hälsa
  errands: "🛒",
  shopping: "🛒",
  food: "🍽️",
  cleaning: "🧽",
  wellness: "💜",
  mood: "💜",
  training: "🏃",
  walk: "🚶",
  medicine: "💊",
  weather: "🌤️",
  stop: "🛑",
  help: "🫶",
  calls: "📞",
  friction: "🪨",
} as const;

export type MyFloveEmojiKey = keyof typeof MYFLOVE_EMOJI;

/** Hämta emoji för en funktion. */
export function emojiFor(key: MyFloveEmojiKey): string {
  return MYFLOVE_EMOJI[key];
}

/** Vänliga bekräftelser – aldrig skuldbeläggande. */
export const MYFLOVE_CONFIRMATIONS = [
  "Klart. 💜",
  "Jag håller koll.",
  "Bra, den är sparad.",
  "En sak mindre i huvudet.",
  "Du behöver inte göra allt idag.",
];

export function friendlyConfirmation(): string {
  return MYFLOVE_CONFIRMATIONS[Math.floor(Math.random() * MYFLOVE_CONFIRMATIONS.length)] as string;
}
