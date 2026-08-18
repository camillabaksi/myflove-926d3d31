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

const MODULES = [
  { label: "Kalender", icon: "▤" },
  { label: "Ekonomi", icon: "◈" },
  { label: "Hälsa", icon: "♥" },
  { label: "Familj", icon: "☺" },
  { label: "Inköp", icon: "◉" },
  { label: "Ärenden", icon: "✓" },
  { label: "FlowPlan™", icon: "≡" },
];

const CENTER = { x: 900, y: 400 };
const RADIUS = 260;

const Node: React.FC<{ label: string; icon: string; angle: number; delay: number }> = ({
  label,
  icon,
  angle,
  delay,
}) => {
  const e = useEntrance(delay);
  const x = CENTER.x + Math.cos(angle) * RADIUS;
  const y = CENTER.y + Math.sin(angle) * RADIUS;
  return (
    <div
      style={{
        ...e,
        position: "absolute",
        left: x - 70,
        top: y - 40,
        width: 140,
        padding: "10px 12px",
        borderRadius: 18,
        background: COLORS.cream,
        boxShadow: "0 8px 20px rgba(44,54,57,0.08)",
        textAlign: "center",
        fontFamily: FONTS.body,
      }}
    >
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink }}>{label}</div>
    </div>
  );
};

export const SceneModulesConnected: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame % 60, [0, 30, 60], [0.6, 1, 0.6]);

  return (
    <SceneShell bg={COLORS.bg}>
      <AbsoluteFill style={{ padding: "70px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
          <SectionEyebrow delay={0}>Allt hänger ihop</SectionEyebrow>
          <SectionTitle delay={4}>En hjärna. Inte sju appar.</SectionTitle>
          <SectionSub delay={10}>
            Flow läser av kalender, ekonomi, hälsa, familj, inköp och ärenden – och hjälper dig med
            helheten.
          </SectionSub>
        </div>

        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          {MODULES.map((m, i) => {
            const angle = (i / MODULES.length) * Math.PI * 2 - Math.PI / 2;
            const x = CENTER.x + Math.cos(angle) * RADIUS;
            const y = CENTER.y + Math.sin(angle) * RADIUS;
            return (
              <line
                key={m.label}
                x1={CENTER.x}
                y1={CENTER.y}
                x2={x}
                y2={y}
                stroke={COLORS.primary}
                strokeOpacity={0.25}
                strokeWidth={2}
                strokeDasharray="4 6"
              />
            );
          })}
        </svg>

        <div
          style={{
            position: "absolute",
            left: CENTER.x - 80,
            top: CENTER.y - 80,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, ${COLORS.primarySoft}, ${COLORS.primary})`,
            boxShadow: `0 0 ${40 * pulse}px ${COLORS.primary}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONTS.display,
            fontWeight: 700,
            color: COLORS.cream,
            fontSize: 36,
          }}
        >
          Flow
        </div>

        {MODULES.map((m, i) => {
          const angle = (i / MODULES.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <Node key={m.label} label={m.label} icon={m.icon} angle={angle} delay={20 + i * 5} />
          );
        })}
      </AbsoluteFill>
    </SceneShell>
  );
};
