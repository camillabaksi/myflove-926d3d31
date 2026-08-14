import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS, SceneShell, SectionEyebrow, SectionSub, SectionTitle, useEntrance } from "../theme";

const FLOWS = [
  { label: "MyFlow", emoji: "✦", sub: "Dag, mående, Insight", color: COLORS.gold, delay: 16 },
  { label: "HomeFlow", emoji: "🏠", sub: "Hem, mat, städning, resor", color: COLORS.primary, delay: 28 },
  { label: "FamilyFlow", emoji: "❦", sub: "Familj, barn, delade listor", color: COLORS.sage, delay: 40 },
  { label: "StudyFlow", emoji: "🎓", sub: "Kurser, plugg, StudyBuddy", color: COLORS.studies, delay: 52 },
  { label: "WorkFlow", emoji: "💼", sub: "Kapacitet, nu-lista, möten", color: COLORS.work, delay: 64 },
];

const Card: React.FC<(typeof FLOWS)[number]> = ({ label, emoji, sub, color, delay }) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        ...e,
        background: COLORS.cream,
        borderRadius: 24,
        padding: "20px 22px",
        borderTop: `8px solid ${color}`,
        boxShadow: "0 12px 28px rgba(30,42,36,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 30 }}>{emoji}</div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 24, color }}>{label}</div>
      <div style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted, lineHeight: 1.35 }}>{sub}</div>
    </div>
  );
};

export const SceneFlows: React.FC = () => (
  <SceneShell bg={COLORS.bg}>
    <AbsoluteFill style={{ padding: "60px 80px", display: "flex", flexDirection: "column", gap: 26 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 820 }}>
        <SectionEyebrow delay={0}>Fem flöden</SectionEyebrow>
        <SectionTitle delay={4}>Allt samlat i fem flöden.</SectionTitle>
        <SectionSub delay={8}>Menyn är grupperad efter livet – inte efter funktioner. Du hittar rätt sak direkt, oavsett var du är.</SectionSub>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        {FLOWS.map((f) => (
          <Card key={f.label} {...f} />
        ))}
      </div>
    </AbsoluteFill>
  </SceneShell>
);
