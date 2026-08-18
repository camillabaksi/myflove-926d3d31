import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS, SceneShell, SectionEyebrow, SectionTitle, useEntrance } from "../theme";

const TASKS = ["Duscha", "Starta tvättmaskinen", "Laga middag", "Starta robotdammsugaren"];

const ORDER: { step: string; why: string; time: string; delay: number }[] = [
  { step: "Starta tvättmaskinen", why: "Går själv medan du gör annat.", time: "0 min", delay: 40 },
  { step: "Starta robotdammsugaren", why: "Städar medan du duschar.", time: "1 min", delay: 60 },
  { step: "Duscha", why: "Lugn stund. Ingen väntar på dig.", time: "5 min", delay: 80 },
  {
    step: "Laga middag",
    why: "Tvätten färdig snart – hänger efter maten.",
    time: "25 min",
    delay: 100,
  },
];

const Chip: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        ...e,
        padding: "10px 16px",
        borderRadius: 999,
        background: COLORS.cream,
        border: `1px solid ${COLORS.sage}`,
        fontFamily: FONTS.body,
        fontSize: 16,
        color: COLORS.ink,
      }}
    >
      {text}
    </div>
  );
};

const Step: React.FC<{ n: number; step: string; why: string; time: string; delay: number }> = ({
  n,
  step,
  why,
  time,
  delay,
}) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        ...e,
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: COLORS.cream,
        borderRadius: 18,
        padding: "14px 18px",
        boxShadow: "0 6px 18px rgba(44,54,57,0.06)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: COLORS.primary,
          color: COLORS.cream,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONTS.display,
          fontWeight: 700,
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {n}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: FONTS.body, fontWeight: 600, color: COLORS.ink, fontSize: 18 }}>
          {step}
        </div>
        <div style={{ fontFamily: FONTS.body, color: COLORS.muted, fontSize: 14 }}>{why}</div>
      </div>
      <div
        style={{
          fontFamily: FONTS.body,
          fontWeight: 600,
          fontSize: 13,
          color: COLORS.primary,
          background: `${COLORS.primary}15`,
          padding: "4px 10px",
          borderRadius: 8,
        }}
      >
        {time}
      </div>
    </div>
  );
};

export const SceneFlowPlan: React.FC = () => {
  return (
    <SceneShell bg={COLORS.bg}>
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            top: -160,
            left: -120,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: COLORS.gold,
            opacity: 0.2,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{ padding: "60px 70px", display: "flex", flexDirection: "row", gap: 50 }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionEyebrow delay={0}>FlowPlan™</SectionEyebrow>
          <SectionTitle delay={4}>
            Rätt sak,
            <br />i rätt ordning.
          </SectionTitle>
          <div
            style={{
              fontFamily: FONTS.body,
              color: COLORS.muted,
              fontSize: 17,
              lineHeight: 1.45,
              maxWidth: 400,
            }}
          >
            Du säger vad som ska göras. Flow räknar ut den mest effektiva ordningen – och förklarar
            varför.
          </div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: COLORS.muted,
              }}
            >
              Du behöver
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TASKS.map((t, i) => (
                <Chip key={t} text={t} delay={16 + i * 4} />
              ))}
            </div>
          </div>
        </div>
        <div
          style={{
            flex: 1.1,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: COLORS.primary,
              marginBottom: 6,
            }}
          >
            Flow föreslår
          </div>
          {ORDER.map((o, i) => (
            <Step key={o.step} n={i + 1} {...o} />
          ))}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
