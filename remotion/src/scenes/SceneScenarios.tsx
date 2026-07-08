import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS, SceneShell, SectionEyebrow, SectionTitle, useEntrance } from "../theme";

const SCENARIOS: { situation: string; response: string; delay: number }[] = [
  {
    situation: "Morgonstress",
    response: "Vi tar en sak i taget. Börja med kaffet – resten väntar.",
    delay: 20,
  },
  {
    situation: "Glömde paraplyet",
    response: "Regn om 20 min. Paraplyet står vid dörren.",
    delay: 50,
  },
  {
    situation: "Vet inte var jag ska börja",
    response: "Här är de tre viktigaste idag. Välj en – jag håller resten.",
    delay: 80,
  },
  {
    situation: "Dålig energidag",
    response: "Idag räcker det. Vi flyttar det som inte måste göras.",
    delay: 110,
  },
];

const Card: React.FC<{ situation: string; response: string; delay: number }> = ({
  situation,
  response,
  delay,
}) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        ...e,
        background: COLORS.cream,
        borderRadius: 22,
        padding: "20px 24px",
        boxShadow: "0 8px 22px rgba(44,54,57,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.body,
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: COLORS.primary,
        }}
      >
        {situation}
      </div>
      <div
        style={{
          fontFamily: FONTS.display,
          fontWeight: 600,
          fontSize: 22,
          lineHeight: 1.35,
          color: COLORS.ink,
        }}
      >
        {response}
      </div>
    </div>
  );
};

export const SceneScenarios: React.FC = () => {
  return (
    <SceneShell bg={COLORS.bgDeep}>
      <AbsoluteFill style={{ padding: "70px 80px", display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
          <SectionEyebrow delay={0}>I vardagen</SectionEyebrow>
          <SectionTitle delay={4}>När livet skaver – finns Flow där.</SectionTitle>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
          {SCENARIOS.map((s) => (
            <Card key={s.situation} {...s} />
          ))}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
