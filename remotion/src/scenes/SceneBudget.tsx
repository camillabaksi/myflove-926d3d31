import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS, SceneShell, SectionEyebrow, SectionTitle, useEntrance } from "../theme";

const PERIODS = ["Dag", "Vecka", "Månad"];

const Bar: React.FC<{
  label: string;
  spent: number;
  budget: number;
  delay: number;
  color: string;
}> = ({ label, spent, budget, delay, color }) => {
  const frame = useCurrentFrame();
  const e = useEntrance(delay);
  const grow = interpolate(frame - delay - 6, [0, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pct = Math.min(100, (spent / budget) * 100) * grow;
  return (
    <div style={{ ...e, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 19, color: COLORS.ink }}>
          {label}
        </span>
        <span style={{ fontFamily: FONTS.body, fontSize: 16, color: COLORS.muted }}>
          {Math.round(spent * grow)} / {budget} kr
        </span>
      </div>
      <div style={{ height: 12, borderRadius: 999, background: COLORS.bgDeep, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: color }} />
      </div>
    </div>
  );
};

export const SceneBudget: React.FC = () => {
  const frame = useCurrentFrame();
  const card = useEntrance(20);
  const active = frame < 90 ? 2 : frame < 150 ? 1 : 0;
  const left = interpolate(frame, [40, 90], [0, 1840], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell bg={COLORS.bg}>
      <AbsoluteFill
        style={{ padding: "70px 80px", display: "flex", flexDirection: "column", gap: 26 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 760 }}>
          <SectionEyebrow delay={0}>Ekonomi</SectionEyebrow>
          <SectionTitle delay={4}>Budget per dag, vecka och månad.</SectionTitle>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.25fr 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div
            style={{
              ...card,
              background: COLORS.cream,
              borderRadius: 28,
              padding: "26px 30px",
              boxShadow: "0 14px 34px rgba(44,54,57,0.09)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                background: COLORS.bgDeep,
                padding: 6,
                borderRadius: 16,
              }}
            >
              {PERIODS.map((p, i) => (
                <div
                  key={p}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "8px 0",
                    borderRadius: 12,
                    fontFamily: FONTS.body,
                    fontWeight: 600,
                    fontSize: 17,
                    color: i === active ? COLORS.ink : COLORS.muted,
                    background: i === active ? COLORS.cream : "transparent",
                    boxShadow: i === active ? "0 4px 12px rgba(44,54,57,0.10)" : "none",
                  }}
                >
                  {p}
                </div>
              ))}
            </div>

            <Bar label="Totalt" spent={4260} budget={6100} delay={34} color={COLORS.primary} />
            <Bar label="Mat" spent={2180} budget={2500} delay={50} color={COLORS.gold} />
            <Bar label="Transport" spent={640} budget={900} delay={64} color={COLORS.sage} />
            <Bar label="Nöje" spent={520} budget={700} delay={78} color={COLORS.primarySoft} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                ...useEntrance(46),
                background: COLORS.primary,
                color: COLORS.cream,
                borderRadius: 28,
                padding: "26px 30px",
                boxShadow: "0 14px 34px rgba(36,80,60,0.22)",
              }}
            >
              <div style={{ fontFamily: FONTS.body, fontSize: 16, opacity: 0.8 }}>
                Kvar denna månad
              </div>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: 700,
                  fontSize: 52,
                  lineHeight: 1.1,
                }}
              >
                {Math.round(left)} kr
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 16, opacity: 0.85, marginTop: 6 }}>
                ca 118 kr/dag i 16 dagar
              </div>
            </div>

            <div
              style={{
                ...useEntrance(70),
                background: COLORS.cream,
                borderRadius: 24,
                padding: "20px 24px",
                boxShadow: "0 10px 26px rgba(44,54,57,0.08)",
                fontFamily: FONTS.body,
                fontSize: 17,
                color: COLORS.muted,
                lineHeight: 1.5,
              }}
            >
              Räknas om automatiskt från dina inkomster och utgifter – inget kalkylark, ingen skam.
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
