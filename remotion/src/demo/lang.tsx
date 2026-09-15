import React, { createContext, useContext } from "react";

export type DemoLang = "en" | "sv";

const DemoLangContext = createContext<DemoLang>("en");

export const DemoLangProvider: React.FC<{ lang: DemoLang; children: React.ReactNode }> = ({
  lang,
  children,
}) => <DemoLangContext.Provider value={lang}>{children}</DemoLangContext.Provider>;

export const useDemoLang = () => useContext(DemoLangContext);

/** Texterna i demon, engelska källa → svensk variant. */
export const DEMO_COPY = {
  tagline: { en: "A calmer everyday life.", sv: "En lugnare vardag." },
  flowNote: {
    en: "Same list. A plan that fits today. ↗",
    sv: "Samma lista. En plan som passar idag. ↗",
  },
  capacity: {
    en: "Move it. Simplify it. Split it. You decide.",
    sv: "Flytta. Förenkla. Dela upp. Du bestämmer.",
  },
  recoveryLabel: { en: "RECOVERY", sv: "ÅTERHÄMTNING" },
  recoveryTitle: {
    en: "One calm place to land",
    sv: "En samlad väg tillbaka",
  },
  recoveryCard1: { en: "Micro pause", sv: "Mikropaus" },
  recoveryCard2: { en: "Urgent calm", sv: "Akut Lugn" },
  recoveryCard3: { en: "Light boost", sv: "Ljusboost" },
  recoveryCard4: { en: "The stop button", sv: "Stopp-knappen" },
  recoveryBreath: {
    en: "The sun breathes with you – 4 in, 2 hold, 6 out.",
    sv: "Solen andas med dig – 4 in, 2 håll, 6 ut.",
  },
  outroLine1: {
    en: "The goal isn’t to get more done.",
    sv: "Målet är inte att hinna mer.",
  },
  outroLine2: {
    en: "It’s to make the day more doable.",
    sv: "Det är att göra dagen mer görbar.",
  },
  outroBrand: {
    en: "♡ MyFlove · A calmer everyday life",
    sv: "♡ MyFlove · En lugnare vardag",
  },
} as const;

export const useDemoCopy = () => {
  const lang = useDemoLang();
  return (key: keyof typeof DEMO_COPY) => DEMO_COPY[key][lang];
};
