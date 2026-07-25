import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, FONTS, SceneShell, SectionEyebrow, SectionTitle, useEntrance } from "../theme";

const NUDGES = [
  { time: "07:12", text: "Regn kl 15 – ta paraplyet.", delay: 20 },
  { time: "08:00", text: "Har du tagit din medicin?", delay: 45 },
  { time: "09:50", text: "Tvätten är klar om 5 min.", delay: 70 },
  { time: "17:30", text: "Andas. Du behöver inte lösa allt ikväll.", delay: 95 },
];

const Nudge: React.FC<{ time: string; text: string; delay: number }> = ({ time, text, delay }) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        ...e,
        background: COLORS.cream,
        borderRadius: 20,
        padding: "16px 22px",
        boxShadow: "0 8px 22px rgba(44,54,57,0.07)",
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}
    >
      <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 14, color: COLORS.primary, minWidth: 56 }}>{time}</div>
      <div style={{ fontFamily: FONTS.display, fontSize: 20, color: COLORS.ink, lineHeight: 1.3 }}>{text}</div>
    </div>
  );
};

export const SceneProactive: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame / 12), [-1, 1], [0.9, 1.05]);
  return (
    <SceneShell bg={COLORS.bgDeep}>
      <AbsoluteFill style={{ padding: "70px 80px", display: "flex", flexDirection: "row", gap: 48, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionEyebrow delay={0}>Proaktivt stöd</SectionEyebrow>
          <SectionTitle delay={4}>Puffar innan du hinner glömma.</SectionTitle>
          <div
            style={{
              marginTop: 20,
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              background: COLORS.primary,
              color: COLORS.cream,
              borderRadius: 999,
              padding: "14px 22px",
              alignSelf: "flex-start",
              fontFamily: FONTS.display,
              fontWeight: 600,
              fontSize: 20,
              transform: `scale(${pulse})`,
              boxShadow: "0 10px 26px rgba(184,80,66,0.35)",
            }}
          >
            ✋ Stop-knappen – en paus när impulsen är stark
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {NUDGES.map((n) => <Nudge key={n.time} {...n} />)}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
