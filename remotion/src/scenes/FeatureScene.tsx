import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, SceneShell, SectionEyebrow, SectionTitle, SectionSub, FeaturePill } from "../theme";

interface FeatureSceneProps {
  eyebrow: string;
  title: string;
  sub: string;
  features: { icon: string; label: string; desc: string; color?: string }[];
  accent?: string;
}

export const FeatureScene: React.FC<FeatureSceneProps> = ({ eyebrow, title, sub, features, accent = COLORS.primary }) => {
  return (
    <SceneShell bg={COLORS.bg}>
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            top: -140,
            left: -140,
            width: 340,
            height: 340,
            borderRadius: "50%",
            background: accent,
            opacity: 0.15,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -180,
            right: -120,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: COLORS.sage,
            opacity: 0.35,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ padding: "70px 80px", display: "flex", flexDirection: "row", gap: 60, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionEyebrow delay={0}>{eyebrow}</SectionEyebrow>
          <SectionTitle delay={4}>{title}</SectionTitle>
          <SectionSub delay={10}>{sub}</SectionSub>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {features.map((f, i) => (
            <FeaturePill key={f.label} icon={f.icon} label={f.label} desc={f.desc} delay={16 + i * 6} color={f.color ?? accent} />
          ))}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
