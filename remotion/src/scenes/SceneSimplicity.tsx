import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import {
  COLORS,
  FONTS,
  SceneShell,
  SectionEyebrow,
  SectionTitle,
  SectionSub,
  useEntrance,
} from "../theme";

const ITEMS = [
  {
    icon: "ⓘ",
    label: "Hjälptexter överallt",
    desc: "Liten i-knapp på varje kort förklarar vad du gör här.",
    delay: 24,
  },
  { icon: "→", label: "Introtur", desc: "En kort rundtur första gången du loggar in.", delay: 44 },
  {
    icon: "◐",
    label: "Enkelt läge",
    desc: "Visar bara det viktigaste när huvudet är fullt.",
    delay: 64,
  },
  {
    icon: "⌄",
    label: "Minimera & maximera",
    desc: "Fäll ihop det du inte behöver – valet sparas.",
    delay: 84,
  },
  {
    icon: "←",
    label: "Tillbakaknapp",
    desc: "Alltid en väg tillbaka, på mobil och dator.",
    delay: 104,
  },
];

const Row: React.FC<(typeof ITEMS)[number]> = ({ icon, label, desc, delay }) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        ...e,
        background: COLORS.cream,
        borderRadius: 22,
        padding: "16px 22px",
        display: "flex",
        alignItems: "center",
        gap: 18,
        boxShadow: "0 8px 22px rgba(44,54,57,0.07)",
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          background: COLORS.primary,
          color: COLORS.cream,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontFamily: FONTS.body,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 22, color: COLORS.ink }}
        >
          {label}
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 15, color: COLORS.muted }}>{desc}</div>
      </div>
    </div>
  );
};

export const SceneSimplicity: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame / 14), [-1, 1], [0.94, 1.04]);
  return (
    <SceneShell>
      <AbsoluteFill
        style={{
          padding: "70px 80px",
          display: "flex",
          flexDirection: "row",
          gap: 48,
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionEyebrow delay={0}>Enklare att förstå</SectionEyebrow>
          <SectionTitle delay={4}>Du ska aldrig behöva gissa.</SectionTitle>
          <SectionSub delay={10}>
            MyFlove förklarar sig själv – med korta svenska texter, färre val och en app du kan
            fälla ihop efter dagsformen.
          </SectionSub>
          <div
            style={{
              marginTop: 18,
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: COLORS.gold,
              color: COLORS.ink,
              borderRadius: 999,
              padding: "12px 22px",
              fontFamily: FONTS.display,
              fontWeight: 600,
              fontSize: 19,
              transform: `scale(${pulse})`,
            }}
          >
            ⓘ Tryck på i – så förklarar Flow
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {ITEMS.map((i) => (
            <Row key={i.label} {...i} />
          ))}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
