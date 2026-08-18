// Städning – vardagsstädning och storstädning per rum.
// Tydligt, kort och konkret: varje steg har tidsåtgång och vad du behöver.

export type CleanMode = "vardag" | "stor";

export interface CleanStep {
  id: string;
  label: string;
  minutes: number;
  /** Vad man behöver för just det här steget */
  needs: string[];
}

export interface CleanRoom {
  id: string;
  label: string;
  emoji: string;
  hue: string;
  steps: Record<CleanMode, CleanStep[]>;
}

export const CLEAN_MODE_LABEL: Record<CleanMode, string> = {
  vardag: "Vardagsstädning",
  stor: "Storstädning",
};

export const CLEAN_MODE_BLURB: Record<CleanMode, string> = {
  vardag: "Snabbt och lagom – håller hemmet i schack.",
  stor: "Grundligare pass. Ta det i din egen takt.",
};

export const CLEAN_ROOMS: CleanRoom[] = [
  {
    id: "kok",
    label: "Kök",
    emoji: "🍳",
    hue: "38 62% 42%",
    steps: {
      vardag: [
        {
          id: "kok-disk",
          label: "Diska eller fyll diskmaskinen",
          minutes: 10,
          needs: ["Diskmedel", "Disksvamp"],
        },
        {
          id: "kok-banka",
          label: "Torka bänkar och spis",
          minutes: 5,
          needs: ["Allrengöring", "Trasa"],
        },
        { id: "kok-sopor", label: "Töm soporna", minutes: 3, needs: ["Soppåse"] },
        {
          id: "kok-golv",
          label: "Sopa/dammsug golvet",
          minutes: 5,
          needs: ["Sopborste eller dammsugare"],
        },
      ],
      stor: [
        {
          id: "kok-skap",
          label: "Torka ur skåp och lådor",
          minutes: 30,
          needs: ["Allrengöring", "Trasa"],
        },
        {
          id: "kok-kyl",
          label: "Rensa och torka kylen",
          minutes: 25,
          needs: ["Allrengöring", "Soppåse"],
        },
        {
          id: "kok-ugn",
          label: "Rengör ugn och mikro",
          minutes: 25,
          needs: ["Ugnsrent", "Handskar", "Svamp"],
        },
        {
          id: "kok-flakt",
          label: "Rengör fläktfilter",
          minutes: 15,
          needs: ["Diskmedel", "Hett vatten"],
        },
        {
          id: "kok-golv-stor",
          label: "Skura golvet",
          minutes: 15,
          needs: ["Mopp", "Golvrent", "Hink"],
        },
      ],
    },
  },
  {
    id: "badrum",
    label: "Badrum",
    emoji: "🛁",
    hue: "205 45% 34%",
    steps: {
      vardag: [
        {
          id: "bad-toa",
          label: "Rengör toaletten",
          minutes: 5,
          needs: ["Toalettborste", "WC-rent"],
        },
        {
          id: "bad-handfat",
          label: "Torka handfat och spegel",
          minutes: 5,
          needs: ["Allrengöring", "Mikrofiberduk"],
        },
        { id: "bad-golv", label: "Torka golvet", minutes: 5, needs: ["Mopp eller trasa"] },
      ],
      stor: [
        {
          id: "bad-dusch",
          label: "Skura dusch/badkar",
          minutes: 20,
          needs: ["Badrumsrent", "Skursvamp", "Handskar"],
        },
        {
          id: "bad-kakel",
          label: "Rengör kakel och fogar",
          minutes: 25,
          needs: ["Fogborste", "Badrumsrent"],
        },
        {
          id: "bad-golvbrunn",
          label: "Rensa golvbrunnen",
          minutes: 10,
          needs: ["Handskar", "Soppåse"],
        },
        { id: "bad-skap", label: "Rensa i badrumsskåpet", minutes: 15, needs: ["Soppåse"] },
      ],
    },
  },
  {
    id: "vardagsrum",
    label: "Vardagsrum",
    emoji: "🛋️",
    hue: "152 40% 28%",
    steps: {
      vardag: [
        {
          id: "vrum-plocka",
          label: "Plocka undan i 10 min",
          minutes: 10,
          needs: ["Korg för sånt som ska bort"],
        },
        { id: "vrum-damma", label: "Damma ytor", minutes: 7, needs: ["Mikrofiberduk"] },
        { id: "vrum-dammsug", label: "Dammsug golvet", minutes: 8, needs: ["Dammsugare"] },
      ],
      stor: [
        {
          id: "vrum-soffa",
          label: "Dammsug soffan och under kuddarna",
          minutes: 15,
          needs: ["Dammsugare", "Möbelmunstycke"],
        },
        {
          id: "vrum-under",
          label: "Flytta möbler och dammsug under",
          minutes: 25,
          needs: ["Dammsugare"],
        },
        {
          id: "vrum-fonster",
          label: "Putsa fönster",
          minutes: 20,
          needs: ["Fönsterputs", "Skrapa", "Trasa"],
        },
        { id: "vrum-textil", label: "Tvätta gardiner/plädar", minutes: 10, needs: ["Tvättmedel"] },
      ],
    },
  },
  {
    id: "sovrum",
    label: "Sovrum",
    emoji: "🛏️",
    hue: "265 32% 45%",
    steps: {
      vardag: [
        { id: "sov-badda", label: "Bädda sängen", minutes: 3, needs: [] },
        { id: "sov-klader", label: "Lägg undan kläder", minutes: 7, needs: ["Tvättkorg"] },
        { id: "sov-damma", label: "Damma nattduksbord", minutes: 4, needs: ["Mikrofiberduk"] },
      ],
      stor: [
        { id: "sov-sang", label: "Byt sängkläder", minutes: 12, needs: ["Rena sängkläder"] },
        {
          id: "sov-madrass",
          label: "Vädra och dammsug madrassen",
          minutes: 15,
          needs: ["Dammsugare"],
        },
        {
          id: "sov-garderob",
          label: "Rensa garderoben",
          minutes: 30,
          needs: ["Kassar för second hand"],
        },
        {
          id: "sov-golv",
          label: "Dammsug och torka golvet",
          minutes: 15,
          needs: ["Dammsugare", "Mopp"],
        },
      ],
    },
  },
  {
    id: "hall",
    label: "Hall",
    emoji: "🚪",
    hue: "18 55% 45%",
    steps: {
      vardag: [
        { id: "hall-skor", label: "Ställ undan skor", minutes: 3, needs: [] },
        { id: "hall-ytor", label: "Torka hyllan/skoställ", minutes: 4, needs: ["Trasa"] },
        { id: "hall-golv", label: "Sopa golvet", minutes: 5, needs: ["Sopborste"] },
      ],
      stor: [
        { id: "hall-rensa", label: "Rensa ytterkläder och skor", minutes: 20, needs: ["Kassar"] },
        {
          id: "hall-dorr",
          label: "Torka dörrar och lister",
          minutes: 15,
          needs: ["Allrengöring", "Trasa"],
        },
        { id: "hall-golv-stor", label: "Skura golvet", minutes: 10, needs: ["Mopp", "Golvrent"] },
      ],
    },
  },
  {
    id: "tvatt",
    label: "Tvätt",
    emoji: "🧺",
    hue: "195 35% 38%",
    steps: {
      vardag: [
        { id: "tvatt-start", label: "Starta en maskin", minutes: 5, needs: ["Tvättmedel"] },
        {
          id: "tvatt-hang",
          label: "Häng eller vik tvätt",
          minutes: 12,
          needs: ["Galgar", "Torkställning"],
        },
      ],
      stor: [
        {
          id: "tvatt-sortera",
          label: "Sortera hela tvättberget",
          minutes: 20,
          needs: ["Tvättkorgar"],
        },
        {
          id: "tvatt-maskin",
          label: "Rengör tvättmaskinens fack och filter",
          minutes: 15,
          needs: ["Ättika eller maskinrent"],
        },
        {
          id: "tvatt-strryk",
          label: "Stryk det som behövs",
          minutes: 25,
          needs: ["Strykjärn", "Strykbräda"],
        },
      ],
    },
  },
];

export function roomById(id: string): CleanRoom | undefined {
  return CLEAN_ROOMS.find((r) => r.id === id);
}

export function totalMinutes(steps: CleanStep[]): number {
  return steps.reduce((sum, s) => sum + s.minutes, 0);
}

/** Samlad lista på allt man behöver för valda steg – utan dubbletter. */
export function suppliesFor(steps: CleanStep[]): string[] {
  return Array.from(new Set(steps.flatMap((s) => s.needs)));
}

const CLEAN_CHEERS = [
  "Snyggt! Ett steg mindre att bära ✨",
  "Bra jobbat – det syns redan 🌱",
  "Klart! Du behöver inte göra allt idag 💛",
  "Så bra. Nästa när du orkar 🐾",
  "Det där räknas, på riktigt 🙌",
  "Ett steg i taget – precis så 🌤️",
];

export function cleaningCheer(): string {
  return CLEAN_CHEERS[Math.floor(Math.random() * CLEAN_CHEERS.length)]!;
}

export function finishCheer(mode: CleanMode, room: string): string {
  return mode === "stor"
    ? `Hela ${room.toLowerCase()} storstädat! Det var stort – vila nu 🎉`
    : `${room} klart! Du gjorde det 💚`;
}
