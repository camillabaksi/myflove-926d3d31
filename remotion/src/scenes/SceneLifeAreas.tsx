import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS, SceneShell, SectionEyebrow, SectionSub, SectionTitle, useEntrance } from "../theme";

const AREAS = [
  { label: "Vardag", emoji: "🏠", sub: "Kalender, att göra, rutiner", color: COLORS.gold, delay: 16 },
  { label: "Privat", emoji: "❦", sub: "Familj, ärenden, inköp", color: COLORS.primary, delay: 32 },
  { label: "Studier", emoji: "🎓", sub: "Kurser, deadlines, dokument", color: COLORS.studies, delay: 48 },
  { label: "Jobb", emoji: "📊", sub: "Projekt, möten, uppföljning", color: COLORS.work, delay: 64 },
];

const AreaCard: React.FC<(typeof AREAS)[number]> = ({ label, emoji, sub, color, delay }) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        ...e,
        background: COLORS.cream,
        borderRadius: 26,
        padding: "24px 26px",
        borderLeft: `10px solid ${color}`,
        boxShadow: "0 12px 28px rgba(30,42,36,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          background: `${color}22`,
          display: "grid",
          placeItems: "center",
          fontSize: 30,
        }}
      >
        {emoji}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 26, color }}>{label}</div>
        <div style={{ fontFamily: FONTS.body, fontSize: 15, color: COLORS.muted }}>{sub}</div>
      </div>
    </div>
  );
};

export const SceneLifeAreas: React.FC = () => (
  <SceneShell bg={COLORS.bg}>
    <AbsoluteFill style={{ padding: "64px 80px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 760 }}>
        <SectionEyebrow delay={0}>Livsområden</SectionEyebrow>
        <SectionTitle delay={4}>Egen färg för varje del av livet.</SectionTitle>
        <SectionSub delay={8}>Ikon och ton visar direkt vilket område något hör till – i menyn, i listan och i kalendern.</SectionSub>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {AREAS.map((a) => (
          <AreaCard key={a.label} {...a} />
        ))}
      </div>
    </AbsoluteFill>
  </SceneShell>
);
