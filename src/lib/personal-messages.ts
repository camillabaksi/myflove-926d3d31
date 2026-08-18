// Personliga, varma småmeddelanden på hemskärmen.
// Flow-röst: kort, peppig, aldrig skuldbeläggande.

export type PersonalNote = {
  emoji: string;
  text: string;
};

type Ctx = {
  name?: string;
  hour: number;
  streak: number;
  thisWeek: number;
  openToday: number;
  doneToday: number;
  isWeekend: boolean;
  /** ökas när användaren ber om ett annat meddelande */
  variation?: number;
};

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length] as T;
}

export function getPersonalNote(ctx: Ctx): PersonalNote {
  const you = ctx.name ? ctx.name : "du";
  const You = ctx.name ? ctx.name : "Du";
  const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 3)) + (ctx.variation ?? 0); // ny ton var tredje timme

  const notes: PersonalNote[] = [];

  if (ctx.doneToday > 0) {
    notes.push({
      emoji: "🎉",
      text: pick(
        [
          `${ctx.doneToday} sak${ctx.doneToday === 1 ? "" : "er"} avklarade idag – det räknas, ${you}.`,
          `Snyggt jobbat, ${you}. ${ctx.doneToday} avbockat redan.`,
          `Du har rört dig framåt idag: ${ctx.doneToday} klart.`,
        ],
        seed,
      ),
    });
  }

  if (ctx.openToday === 0) {
    notes.push({
      emoji: "🌿",
      text: pick(
        [
          "Inget måste just nu. Njut av det.",
          `Listan är lugn, ${you}. Vila är också att göra något.`,
          "Tom lista – perfekt läge för något du faktiskt vill göra.",
        ],
        seed + 1,
      ),
    });
  } else if (ctx.openToday >= 6) {
    notes.push({
      emoji: "🫶",
      text: pick(
        [
          "Det blev mycket idag. Välj en enda sak – resten väntar snällt.",
          `${You} behöver inte göra allt. Börja med det minsta.`,
          "Mycket på listan? Vi tar det i din takt, en sak i taget.",
        ],
        seed + 2,
      ),
    });
  } else {
    notes.push({
      emoji: "✨",
      text: pick(
        [
          `Lagom mycket idag, ${you}. Det här fixar du.`,
          "En sak i taget, så löser sig dagen.",
          `Fint tempo, ${you}. Inget stressigt på gång.`,
        ],
        seed + 3,
      ),
    });
  }

  if (ctx.streak >= 3) {
    notes.push({
      emoji: "🔥",
      text: `${ctx.streak} dagar i rad här inne. Det är en fin vana, ${you}.`,
    });
  } else if (ctx.thisWeek >= 3) {
    notes.push({
      emoji: "🌱",
      text: `${ctx.thisWeek} dagar den här veckan – du håller i det.`,
    });
  }

  if (ctx.hour < 9) {
    notes.push({
      emoji: "☕",
      text: pick(
        [
          "Ta morgonen lugnt. Kaffet först, listan sen.",
          "Morgonen är din. Inget måste hända direkt.",
        ],
        seed + 4,
      ),
    });
  } else if (ctx.hour >= 21) {
    notes.push({
      emoji: "🌙",
      text: pick(
        [
          "Dags att runda av. Det som är kvar finns imorgon.",
          `God natt snart, ${you}. Dagen räcker som den är.`,
        ],
        seed + 5,
      ),
    });
  } else if (ctx.isWeekend) {
    notes.push({
      emoji: "🌤️",
      text: pick(
        [
          "Helg. Lägg ribban lågt och gör det som känns bra.",
          "Helgläge – bara det du orkar, inget mer.",
        ],
        seed + 6,
      ),
    });
  }

  return pick(notes, seed + ctx.hour);
}
