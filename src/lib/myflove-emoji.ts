/**
 * MyFlove – gemensam emoji-mappning.
 * Samma emoji för samma funktion i hela appen. Byt aldrig emoji per sida.
 */
export const MYFLOVE_EMOJI = {
  home: "🏠",
  lifeflow: "🏠",
  calendar: "📅",
  quickflow: "⚡",
  energy: "⚡",
  insight: "🧠",
  focus: "🧠",
  priority: "🎯",
  tasks: "🎯",
  reminder: "⏰",
  meetings: "⏰",
  done: "✓",
  replan: "🔄",
  work: "💼",
  travel: "✈️",
  finance: "💰",
  documents: "📄",
  notes: "📝",
  material: "📎",
  settings: "⚙️",
  flowReset: "🌙",
  dailyFlow: "☀️",
  family: "👨‍👩‍👧",
  errands: "🛒",
  shopping: "🛒",
  wellness: "💜",
  training: "🏃",
  study: "🎓",
  children: "🧒",
  food: "🍽️",
  cleaning: "🧽",
  medicine: "💊",
  profile: "👤",
  place: "📍",
  calls: "📞",
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
