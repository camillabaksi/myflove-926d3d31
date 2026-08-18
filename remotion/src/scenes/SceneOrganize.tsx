import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS, SceneShell, SectionEyebrow, SectionTitle, useEntrance } from "../theme";

const CARDS = [
  {
    title: "Mappar i Studier & Jobb",
    sub: "Filtrera per kurs eller projekt – flytta en uppgift med ett tryck",
    icon: "🗂️",
    color: COLORS.studies,
    delay: 18,
  },
  {
    title: "FlowStudy",
    sub: "Ladda upp material, få flashcards, quiz och pluggplan",
    icon: "🎓",
    color: COLORS.work,
    delay: 38,
  },
  {
    title: "Städning",
    sub: "Vardagsstäd eller storstäd per rum, med tidsåtgång och peppning",
    icon: "🧽",
    color: COLORS.sage,
    delay: 58,
  },
  {
    title: "Barn",
    sub: "Aktiviteter, papper och påminnelser – delat i kalendern",
    icon: "🧸",
    color: COLORS.gold,
    delay: 78,
  },
];

export const SceneOrganize: React.FC = () => {
  return (
    <SceneShell bg={COLORS.bgDeep}>
      <AbsoluteFill
        style={{ padding: "70px 80px", display: "flex", flexDirection: "column", gap: 28 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 760 }}>
          <SectionEyebrow delay={0}>Ordning utan press</SectionEyebrow>
          <SectionTitle delay={4}>Allt får en egen hylla.</SectionTitle>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {CARDS.map((c) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks -- Remotion-scen: listan är statisk, hook-ordningen är alltid densamma
            const e = useEntrance(c.delay);
            return (
              <div
                key={c.title}
                style={{
                  ...e,
                  background: COLORS.cream,
                  borderRadius: 26,
                  padding: "24px 26px",
                  boxShadow: "0 12px 30px rgba(44,54,57,0.10)",
                  display: "flex",
                  gap: 18,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 18,
                    background: c.color,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 30,
                    flexShrink: 0,
                  }}
                >
                  {c.icon}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div
                    style={{
                      fontFamily: FONTS.display,
                      fontWeight: 600,
                      fontSize: 24,
                      color: COLORS.ink,
                    }}
                  >
                    {c.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 16,
                      color: COLORS.muted,
                      lineHeight: 1.4,
                    }}
                  >
                    {c.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
