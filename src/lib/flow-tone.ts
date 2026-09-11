/**
 * Flows röst – ton och formuleringar utifrån verklig kontext.
 *
 * Rena funktioner utan sidoeffekter, så att Flow låter likadant överallt
 * (Hem, Idag, Planera, Hälsa) och går att testa. Ingen ny datamodell:
 * allt bygger på batteri, uppgifter och klockslag som redan finns.
 *
 * Regler: aldrig skuld, aldrig "du ligger efter", aldrig hittade-på mönster.
 */

export type BatteryTone = "high" | "medium" | "low" | "verylow";

export function batteryTone(level: number): BatteryTone {
  if (level >= 70) return "high";
  if (level >= 45) return "medium";
  if (level >= 25) return "low";
  return "verylow";
}

/** Flows grundton om dagens energi – en mening, aldrig en tillsägelse. */
export function batteryLine(level: number): string {
  switch (batteryTone(level)) {
    case "high":
      return "Du verkar ha bra med energi idag. Kanske finns det utrymme för en lite större sak.";
    case "medium":
      return "Du har ganska lagom med energi. Vi kan ta en sak i taget.";
    case "low":
      return "Du verkar ha lite mindre energi idag. Jag skulle göra resten lite enklare.";
    case "verylow":
      return "Vi behöver inte pressa idag. Vad är viktigast just nu?";
  }
}

/** Hur mycket val Flow bör erbjuda – lägre energi, färre beslut. */
export function decisionPrompt(level: number): string {
  return batteryTone(level) === "high" || batteryTone(level) === "medium"
    ? "Vad vill du göra?"
    : "Jag tror vi kan börja med den här lilla saken.";
}

export interface HomeContext {
  /** Timme 0–23. */
  hour: number;
  /** Batterinivå 0–100. */
  battery: number;
  /** Antal avklarade saker idag. */
  completedToday: number;
  /** Antal saker kvar idag. */
  remainingToday: number;
  /** Nästa sak på tur, om någon. */
  nextTitle?: string | null;
  /** Har användaren checkat in energi/mående idag? */
  checkedIn: boolean;
}

/**
 * En kort mening på Hem som följer dagen – inte slumpad, alltid härledd.
 * Hem får aldrig fler kort; det är samma yta som ändrar innehåll.
 */
export function homeContextLine(ctx: HomeContext): string {
  const { hour, battery, completedToday, remainingToday, nextTitle, checkedIn } = ctx;

  if (hour < 10 && !checkedIn) return "God morgon 🌱 Hur känns batteriet idag?";
  if (hour >= 21) {
    return remainingToday === 0
      ? "Du är klar för idag. 🌙"
      : "Du är snart klar för idag. Resten kan få vänta.";
  }
  if (batteryTone(battery) === "verylow") return "Vi tar det lugnt idag.";
  if (hour >= 18 && batteryTone(battery) === "low")
    return "Det börjar bli kväll och batteriet är lågt. Vi kan göra resten enkelt.";
  if (completedToday >= 3) return "Du har fått flera saker gjorda idag. ❤️";
  if (batteryTone(battery) === "low" && remainingToday > 0)
    return "Det verkar vara lite ont om batteri idag. En sak i taget.";
  if (nextTitle) return `Du är mitt i dagen. Nästa är ${nextTitle.toLowerCase()}.`;
  if (remainingToday === 0 && completedToday > 0)
    return "Inget mer inplanerat just nu. Fint jobbat.";
  if (remainingToday > 0)
    return `Det är ${remainingToday} ${remainingToday === 1 ? "sak" : "saker"} kvar. Vi behöver inte ta alla nu.`;
  return "Lugnt läge just nu. Jag finns här.";
}

export interface CompletionContext {
  title?: string | null;
  battery: number;
  /** Saker kvar idag efter den avklarade. */
  remainingToday: number;
}

/**
 * Flows reaktion när något blir klart. Kort, varm och inte varje gång –
 * anroparen avgör hur ofta den visas.
 */
export function completionReaction(ctx: CompletionContext): { message: string; followUp?: string } {
  const what = ctx.title ? `"${ctx.title}"` : "";
  const tone = batteryTone(ctx.battery);

  if (ctx.remainingToday === 0) {
    return {
      message: `${what ? `${what} klart. ` : "Klart. "}Nu andas vi ut. Du är klar för idag.`,
    };
  }
  if (tone === "verylow" || tone === "low") {
    return {
      message: `${what ? `${what} är klart. ` : "Klart. "}Nu andas vi ut. Det räckte gott. Hur känns axlarna just nu?`,
    };
  }
  if (tone === "high") {
    return {
      message: `${what ? `${what} är klart. ` : "Klart. "}Nu andas vi ut.`,
      followUp: "Hur känns axlarna just nu?",
    };
  }
  return {
    message: `${what ? `${what} klart. ` : "Klart. "}En sak mindre i huvudet.`,
    followUp: "Nu andas vi ut. Hur känns axlarna just nu?",
  };
}

/** När något passerat utan att bli gjort – aldrig skuld, alltid en väg vidare. */
export function missedTaskLine(title: string, battery: number): string {
  const low = batteryTone(battery) === "low" || batteryTone(battery) === "verylow";
  const base = `${title} får vänta tills det finns mer utrymme.`;
  return low
    ? `${base} Du har också ganska lite energi idag – jag tycker vi gör det enklare.`
    : `${base} Vill du flytta den eller släppa den idag?`;
}

/**
 * Flow minns. Används när en rekommendation bygger på något Flow sett tidigare,
 * så att kopplingen blir synlig i stället för att kallas "AI-förslag".
 */
export function recallPrefix(insightText?: string | null): string | null {
  if (!insightText) return null;
  const trimmed = insightText.trim();
  if (!trimmed) return null;
  return `Jag minns: ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}

/**
 * Flows röst om vad han lärt sig – språket följer den faktiska
 * inlärningsnivån (0–100) och antalet verkliga insikter. Aldrig påhittat:
 * utan insikter säger Flow bara att han fortfarande lär känna dig.
 */
export function learningVoice(level: number, insightCount: number): string {
  if (insightCount === 0) return "Jag lär fortfarande känna dig.";
  if (level < 15) return "Jag har börjat lägga märke till några små saker om dig.";
  if (level < 40) return "Jag börjar förstå dina mönster.";
  if (level < 70) return "Jag har upptäckt ett mönster i hur din vardag hänger ihop.";
  return "Jag minns hur din energi och din vardag brukar hänga ihop.";
}

/**
 * Varför det kan vara värt att berätta något – språket följer hur väl Flow
 * redan känner användaren. Aldrig ett krav och aldrig ett påstått mönster:
 * utan verkliga insikter säger Flow bara att han fortfarande lär känna dig.
 */
export function benefitVoice(level: number, insightCount: number): string {
  if (insightCount === 0) {
    return level < 15
      ? "Jag lär fortfarande känna dig. Det du berättar hjälper mig förstå din vardag."
      : "Det du berättar hjälper mig förstå vad som brukar fungera för dig.";
  }
  if (level < 40) return "Det du berättar gör att jag börjar se vad som brukar påverka dig.";
  if (level < 70)
    return "Jag börjar se ett mönster i hur din energi förändras – det du berättar gör det tydligare.";
  return "Det du berättar hjälper mig föreslå rätt sorts saker vid rätt tid för dig.";
}

/** Ämnen där nyttan behöver förklaras för nya användare. */
export type ExplainerTopic = "energi" | "maende" | "planering" | "promenad" | "medicin";

const EXPLAINERS: Record<ExplainerTopic, { intro: string; growing: string; light: string }> = {
  energi: {
    intro:
      "Det här hjälper Flow förstå hur din energi förändras under dagen – och vad som brukar ge eller ta energi för dig.",
    growing: "Ju mer du berättar, desto tydligare ser jag vad som påverkar din energi.",
    light: "Bra att veta hur du ligger till just nu.",
  },
  maende: {
    intro:
      "Flow lär sig om ditt mående och din energi brukar hänga ihop för dig. Du kan hoppa över.",
    growing: "Det här gör bilden av dina dagar lite tydligare. Valfritt.",
    light: "Valfritt.",
  },
  planering: {
    intro:
      "Planera utifrån vad du har ork till – inte bara vad som behöver göras. Flow föreslår en ordning, du ändrar den som du vill.",
    growing: "Flow föreslår en ordning som passar din ork idag – du ändrar den som du vill.",
    light: "Du ändrar ordningen som du vill.",
  },
  promenad: {
    intro:
      "Hitta en promenad som passar din energi just nu. Säg hur länge du vill gå, så föreslår Flow vägar nära dig.",
    growing: "Förslagen anpassas efter hur mycket ork du har just nu.",
    light: "Välj längd, så föreslår Flow en runda.",
  },
  medicin: {
    intro:
      "Bocka av när du tagit dem – då slipper du hålla tiderna i huvudet, och Flow kan påminna dig när det passar din dag.",
    growing: "Avbockningen gör att påminnelserna kan passa din dag bättre.",
    light: "",
  },
};

/**
 * Gradvis förklarande copy. Nya användare får hela meningen, användare som
 * kommit en bit får en kortare, och den som redan känner appen får ingenting
 * alls – så att samma förklaring inte upprepas gång på gång.
 */
export function explainerVoice(
  topic: ExplainerTopic,
  level: number,
  insightCount: number,
): string | null {
  const copy = EXPLAINERS[topic];
  if (level < 20 && insightCount === 0) return copy.intro;
  if (level < 45) return copy.growing;
  if (level < 70) return copy.light || null;
  return null;
}
