import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS, SceneShell, SectionEyebrow, SectionTitle, useEntrance } from "../theme";

const MODULES: { title: string; sub: string; icon: string; color: string; delay: number }[] = [
  { title: "Wellness", sub: "Mood + energi tillsammans", icon: "🌿", color: COLORS.sage, delay: 18 },
  { title: "Daily Flow", sub: "Rutiner & medicin i ett flöde", icon: "☀️", color: COLORS.gold, delay: 40 },
  { title: "Rutiner™", sub: "Snabbstart – ändra tiden som du vill", icon: "🔁", color: COLORS.primarySoft, delay: 62 },
  { title: "Familj", sub: "Dela hushåll och matlista", icon: "🏡", color: COLORS.primary, delay: 84 },
];

const Tile: React.FC<{ title: string; sub: string; icon: string; color: string; delay: number }> = ({ title, sub, icon, color, delay }) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        ...e,
        background: COLORS.cream,
        borderRadius: 24,
        padding: "22px 24px",
        boxShadow: "0 10px 26px rgba(44,54,57,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: color,
          display: "grid",
          placeItems: "center",
          fontSize: 30,
        }}
      >
        {icon}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 24, color: COLORS.ink }}>{title}</div>
        <div style={{ fontFamily: FONTS.body, fontSize: 15, color: COLORS.muted }}>{sub}</div>
      </div>
    </div>
  );
};

export const SceneNewModules: React.FC = () => {
  return (
    <SceneShell bg={COLORS.bg}>
      <AbsoluteFill style={{ padding: "70px 80px", display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 720 }}>
          <SectionEyebrow delay={0}>Nytt i MyFlove</SectionEyebrow>
          <SectionTitle delay={4}>Fyra nya rum – samma lugn.</SectionTitle>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {MODULES.map((m) => <Tile key={m.title} {...m} />)}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
