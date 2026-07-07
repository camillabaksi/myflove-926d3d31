const ENCOURAGEMENTS = [
  "Bra jobbat! 🌱",
  "Ett steg i taget ❤️",
  "Snyggt! Du gjorde det 🙌",
  "Så himla bra 🌟",
  "Du är på gång! 🚀",
  "Det räknas, hur litet det än känns ✨",
  "Stolt över dig 💪",
  "Fint jobbat idag 🌤️",
  "Ännu ett steg framåt 🐾",
  "Du klarade det! 🎉",
];

export function getRandomEncouragement(): string {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)] as string;
}
