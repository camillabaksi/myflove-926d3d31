import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS, SceneShell, SectionEyebrow, SectionTitle, useEntrance } from "../theme";

const POINTS = [
  { label: "WCAG AA-kontrast", desc: "Läsbart även för trötta ögon", delay: 20 },
  { label: "Semantiska landmärken", desc: "Skärmläsare hittar rätt direkt", delay: 45 },
  { label: "SEO & öppen guide", desc: "Hittas av dem som söker hjälp", delay: 70 },
  { label: "CSP & säker inloggning", desc: "Dina data stannar hos dig", delay: 95 },
];

const Row: React.FC<{ label: string; desc: string; delay: number }> = ({ label, desc, delay }) => {
  const e = useEntrance(delay);
  return (
    <div style={{ ...e, display: "flex", alignItems: "flex-start", gap: 16 }}>
      <div style={{ width: 14, height: 14, borderRadius: 999, background: COLORS.sage, marginTop: 10 }} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 22, color: COLORS.ink }}>{label}</div>
        <div style={{ fontFamily: FONTS.body, fontSize: 15, color: COLORS.muted }}>{desc}</div>
      </div>
    </div>
  );
};

export const SceneAccessibility: React.FC = () => {
  return (
    <SceneShell bg={COLORS.bgDeep}>
      <AbsoluteFill style={{ padding: "70px 80px", display: "flex", flexDirection: "column", gap: 30 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 780 }}>
          <SectionEyebrow delay={0}>Tillgängligt & tryggt</SectionEyebrow>
          <SectionTitle delay={4}>Byggd för att vara enkel att lita på.</SectionTitle>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 780 }}>
          {POINTS.map((p) => <Row key={p.label} {...p} />)}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
