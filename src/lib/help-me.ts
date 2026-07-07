// Logic for the "Hjälp mig" flow on the home page. Never blames or reminds the user
// of what they missed — only ever offers a calmer, smaller version of the day.

export type HelpFeelingId =
  | "unsure"
  | "low-energy"
  | "stressed"
  | "short-time"
  | "overwhelmed";

export interface HelpFeelingOption {
  id: HelpFeelingId;
  label: string;
}

export const HELP_FEELING_OPTIONS: HelpFeelingOption[] = [
  { id: "unsure", label: "Jag vet inte var jag ska börja" },
  { id: "low-energy", label: "Jag har låg energi" },
  { id: "stressed", label: "Jag känner mig stressad" },
  { id: "short-time", label: "Jag har ont om tid" },
  { id: "overwhelmed", label: "Jag känner mig överväldigad" },
];

export interface HelpPlan {
  feeling: HelpFeelingId;
  taskLimit: number;
  hideExtras: boolean;
  message: string;
}

export function buildHelpPlan(feeling: HelpFeelingId): HelpPlan {
  switch (feeling) {
    case "unsure":
      return {
        feeling,
        taskLimit: 1,
        hideExtras: true,
        message: "Vi börjar smått. Här är en enda sak att rikta blicken mot — resten får vänta tills du är redo.",
      };
    case "low-energy":
      return {
        feeling,
        taskLimit: 1,
        hideExtras: true,
        message: "Det är okej att gå försiktigt fram idag. Jag har plockat fram bara det allra viktigaste.",
      };
    case "short-time":
      return {
        feeling,
        taskLimit: 2,
        hideExtras: true,
        message: "Ont om tid räcker långt om vi håller det litet. Här är det som betyder mest just nu.",
      };
    case "stressed":
      return {
        feeling,
        taskLimit: 3,
        hideExtras: true,
        message: "Det blev mycket idag. Jag har prioriterat om och sparat resten till senare.",
      };
    case "overwhelmed":
      return {
        feeling,
        taskLimit: 1,
        hideExtras: true,
        message: "Det blev mycket idag. Jag har prioriterat om och sparat resten till senare.",
      };
  }
}
