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
