import React from "react";
import { AbsoluteFill } from "remotion";
import {
  COLORS,
  FONTS,
  SceneShell,
  SectionEyebrow,
  SectionSub,
  SectionTitle,
  useEntrance,
} from "../theme";

const HISTORY = [
  { title: "Plan för veckan", when: "Idag" },
  { title: "Hjälp med inlämning", when: "Igår" },
  { title: "Rutin för morgonen", when: "Tisdag" },
];

const BUBBLES = [
  { from: "user", text: "Jag orkar inte börja med tvätten." },
  { from: "flow", text: "Vi tar bara första steget: bär korgen till maskinen. Sen ses vi igen." },
];

export const SceneAssistant: React.FC = () => {
  const list = useEntrance(18);
  return (
    <SceneShell bg={COLORS.bg}>
      <AbsoluteFill
        style={{ padding: "64px 80px", display: "flex", flexDirection: "column", gap: 24 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 780 }}>
          <SectionEyebrow delay={0}>Flow-assistenten</SectionEyebrow>
          <SectionTitle delay={4}>Samtalen finns kvar.</SectionTitle>
          <SectionSub delay={8}>
            Varje chatt sparas som en tråd du kan gå tillbaka till – och sökfunktionen hittar allt i
            appen.
          </SectionSub>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.4fr", gap: 18 }}>
          <div
            style={{
              ...list,
              background: COLORS.cream,
              borderRadius: 26,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              boxShadow: "0 12px 28px rgba(30,42,36,0.08)",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: COLORS.muted,
              }}
            >
              Historik
            </div>
            {HISTORY.map((h, i) => {
              const e = useEntrance(26 + i * 10);
              const active = i === 0;
              return (
                <div
                  key={h.title}
                  style={{
                    ...e,
                    borderRadius: 16,
                    padding: "12px 14px",
                    background: active ? `${COLORS.primary}14` : "transparent",
                    border: `1px solid ${active ? COLORS.primary + "44" : COLORS.bgDeep}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONTS.body,
                      fontWeight: 600,
                      fontSize: 18,
                      color: COLORS.ink,
                    }}
                  >
                    {h.title}
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted }}>
                    {h.when}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: 14, justifyContent: "center" }}
          >
            {BUBBLES.map((b, i) => {
              const e = useEntrance(46 + i * 26);
              const mine = b.from === "user";
              return (
                <div
                  key={b.text}
                  style={{
                    ...e,
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    background: mine ? COLORS.primary : COLORS.cream,
                    color: mine ? COLORS.cream : COLORS.ink,
                    borderRadius: 24,
                    padding: "16px 20px",
                    fontFamily: FONTS.body,
                    fontSize: 21,
                    lineHeight: 1.35,
                    boxShadow: "0 10px 24px rgba(30,42,36,0.08)",
                  }}
                >
                  {b.text}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
