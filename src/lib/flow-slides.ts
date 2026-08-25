// Flow 2.0 – vilken slide är mest relevant just nu?
//
// Ren logik, ingen egen data. Den väger samman det som redan finns:
// dagens incheckning (mående/energi), Mitt batteri och Flow-motorns förslag.

export type FlowSlideId = "checkin" | "energy" | "suggestion" | "rest";

export interface FlowSlideInput {
  /** Har användaren registrerat både mående och energi idag? */
  hasCheckin: boolean;
  /** 0–100 från Mitt batteri. */
  batteryNow: number;
  /** Dagen kostar mer än som finns kvar. */
  overloaded: boolean;
  /** Finns det något Flow kan föreslå att göra? */
  hasSuggestion: boolean;
  /** Dagen känns tung (från assessToday). */
  heavyDay?: boolean;
}

/**
 * Returnerar sliderna i den ordning Flow tycker är mest relevant.
 * Aldrig fler än fyra – och aldrig sådant som saknar innehåll.
 */
export function pickFlowSlides(input: FlowSlideInput): FlowSlideId[] {
  const { hasCheckin, batteryNow, overloaded, hasSuggestion, heavyDay } = input;

  const low = batteryNow < 40;
  const high = batteryNow >= 66;
  const needsRest = overloaded || heavyDay === true || low;

  const order: FlowSlideId[] = [];
  const add = (id: FlowSlideId) => {
    if (!order.includes(id)) order.push(id);
  };

  if (!hasCheckin) add("checkin");
  if (needsRest) add("rest");
  if (high && hasSuggestion) add("suggestion");

  add("energy");
  if (hasSuggestion) add("suggestion");
  if (needsRest) add("rest");
  add("checkin");

  return order;
}

/** En kort mening från Flow om energin – samma språk som resten av appen. */
export function energySentence(level: number, trend: "stiger" | "jamn" | "sjunker"): string {
  const word =
    level >= 75
      ? "Du har gott om energi"
      : level >= 55
        ? "Du har medelbra energi"
        : level >= 35
          ? "Du har energi på halvfart"
          : "Din energi är låg just nu";
  const move =
    trend === "stiger"
      ? "Den verkar öka."
      : trend === "sjunker"
        ? "Det verkar som att du börjar bli tröttare."
        : "Den ligger ganska jämn.";
  return `${word}. ${move}`;
}
