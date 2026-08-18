import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  COLORS,
  FONTS,
  SceneShell,
  SectionEyebrow,
  SectionSub,
  SectionTitle,
  useEntrance,
} from "../theme";

const TABS = [
  { label: "Översikt", delay: 14 },
  { label: "Program", delay: 22 },
  { label: "Steg", delay: 30 },
  { label: "Vardagsmotion", delay: 38 },
  { label: "Veckoplan", delay: 46 },
  { label: "Vikt", delay: 54 },
];

const Sessions = [
  { day: "Måndag", title: "Helkropp – styrka", type: "styrka", min: 45, color: COLORS.work },
  { day: "Onsdag", title: "Rask promenad", type: "kondition", min: 30, color: COLORS.gold },
  {
    day: "Fredag",
    title: "Rörlighet & andning",
    type: "rörlighet",
    min: 20,
    color: COLORS.studies,
  },
];

const Bar: React.FC<{ pct: number; delay: number; color: string }> = ({ pct, delay, color }) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame - delay, [0, 30], [0, pct], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ background: COLORS.bgDeep, borderRadius: 999, height: 12, overflow: "hidden" }}>
      <div style={{ width: `${w}%`, height: "100%", background: color, borderRadius: 999 }} />
    </div>
  );
};

export const SceneTraining: React.FC = () => {
  const head = useEntrance(0);
  const card = useEntrance(20);
  const steps = useEntrance(46);
  return (
    <SceneShell bg={COLORS.bg}>
      <AbsoluteFill
        style={{ padding: "60px 80px", display: "flex", flexDirection: "column", gap: 22 }}
      >
        <div style={{ ...head, display: "flex", flexDirection: "column", gap: 8, maxWidth: 780 }}>
          <SectionEyebrow delay={0}>Träning</SectionEyebrow>
          <SectionTitle delay={3}>Rörelse som orkar med dig.</SectionTitle>
          <SectionSub delay={7}>
            Flow bygger programmet efter ditt mål – och du kan ändra, lägga till pass eller skapa om
            det med samma inställningar.
          </SectionSub>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {TABS.map((t, i) => {
            const e = useEntrance(t.delay);
            const active = i === 1;
            return (
              <div
                key={t.label}
                style={{
                  ...e,
                  fontFamily: FONTS.body,
                  fontSize: 16,
                  fontWeight: 600,
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: active ? COLORS.primary : COLORS.cream,
                  color: active ? COLORS.cream : COLORS.muted,
                }}
              >
                {t.label}
              </div>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 18 }}>
          <div
            style={{
              ...card,
              background: COLORS.cream,
              borderRadius: 26,
              padding: "22px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 12px 28px rgba(30,42,36,0.08)",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: 700,
                fontSize: 24,
                color: COLORS.ink,
              }}
            >
              Din vecka
            </div>
            {Sessions.map((s, i) => {
              const e = useEntrance(30 + i * 12);
              return (
                <div
                  key={s.title}
                  style={{
                    ...e,
                    borderRadius: 18,
                    padding: "12px 16px",
                    background: `${s.color}14`,
                    border: `1px solid ${s.color}44`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      color: s.color,
                    }}
                  >
                    {s.day} · {s.type} · {s.min} min
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.body,
                      fontWeight: 600,
                      fontSize: 20,
                      color: COLORS.ink,
                    }}
                  >
                    {s.title}
                  </div>
                </div>
              );
            })}
            <div style={{ fontFamily: FONTS.body, fontSize: 15, color: COLORS.muted }}>
              Ändra pass · Lägg till pass · Skapa om med samma inställningar
            </div>
          </div>

          <div
            style={{
              ...steps,
              background: COLORS.cream,
              borderRadius: 26,
              padding: "22px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              boxShadow: "0 12px 28px rgba(30,42,36,0.08)",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: 700,
                fontSize: 22,
                color: COLORS.ink,
              }}
            >
              Steg & vardagsmotion
            </div>
            <div>
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 15,
                  color: COLORS.muted,
                  marginBottom: 6,
                }}
              >
                8 240 av 7 000 steg
              </div>
              <Bar pct={100} delay={52} color={COLORS.primary} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 15,
                  color: COLORS.muted,
                  marginBottom: 6,
                }}
              >
                16 av 20 min rörelse idag
              </div>
              <Bar pct={80} delay={62} color={COLORS.gold} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 15,
                  color: COLORS.muted,
                  marginBottom: 6,
                }}
              >
                Vikt: −2,4 kg mot målet
              </div>
              <Bar pct={62} delay={72} color={COLORS.sage} />
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted }}>
              Synkas med hälsoappen i mobilen.
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
