import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS, SceneShell, SectionEyebrow, SectionTitle, useEntrance } from "../theme";

const MESSAGES: { text: string; delay: number }[] = [
  {
    text: "God morgon Camilla.\n\nDet ser ut att bli regn idag. Ta gärna med ett paraply.\n\nGlöm inte din medicin innan du går hemifrån.",
    delay: 20,
  },
  {
    text: "Jag ser att du har mycket idag.\n\nSka vi börja med de tre viktigaste sakerna?",
    delay: 70,
  },
];

const Bubble: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        ...e,
        alignSelf: "flex-start",
        maxWidth: 560,
        background: COLORS.cream,
        borderRadius: "24px 24px 24px 6px",
        padding: "22px 26px",
        boxShadow: "0 10px 30px rgba(44,54,57,0.08)",
        fontFamily: FONTS.body,
        fontSize: 20,
        lineHeight: 1.5,
        color: COLORS.ink,
        whiteSpace: "pre-wrap",
      }}
    >
      {text}
    </div>
  );
};

export const SceneFlowVoice: React.FC = () => {
  return (
    <SceneShell bg={COLORS.bg}>
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: COLORS.sage,
            opacity: 0.35,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -140,
            left: -100,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: COLORS.primary,
            opacity: 0.12,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ padding: "60px 80px", display: "flex", flexDirection: "column", gap: 24 }}>
        <SectionEyebrow delay={0}>Flow talar</SectionEyebrow>
        <SectionTitle delay={4}>Som en vän i fickan.</SectionTitle>
        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            alignItems: "flex-start",
          }}
        >
          {MESSAGES.map((m) => (
            <Bubble key={m.delay} text={m.text} delay={m.delay} />
          ))}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
