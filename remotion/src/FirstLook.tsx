import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { COLORS, FONTS } from "./theme";

/**
 * "Första blicken" – kort introvideo för en helt ny användare.
 * Slutar med en tydlig uppmaning att ladda ner MyFlove.
 */
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

const TRANS = 15;

function useIn(delay: number, damping = 17) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping, stiffness: 150 } });
  return {
    opacity: interpolate(s, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(s, [0, 1], [34, 0])}px) scale(${interpolate(s, [0, 1], [0.95, 1])})`,
  } as React.CSSProperties;
}

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 45) * 10;
  return (
    <AbsoluteFill style={{ background: COLORS.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background: COLORS.sage,
          opacity: 0.28,
          top: -320 + drift,
          left: -280,
          filter: "blur(14px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 760,
          height: 760,
          borderRadius: "50%",
          background: COLORS.gold,
          opacity: 0.2,
          bottom: -240 - drift,
          right: -200,
          filter: "blur(14px)",
        }}
      />
      <AbsoluteFill
        style={{
          padding: "130px 90px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 34,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => (
  <div
    style={{
      ...useIn(delay),
      fontFamily: FONTS.body,
      fontWeight: 600,
      letterSpacing: 6,
      textTransform: "uppercase",
      fontSize: 26,
      color: COLORS.primary,
    }}
  >
    {children}
  </div>
);

const Title: React.FC<{ children: React.ReactNode; delay?: number; size?: number }> = ({
  children,
  delay = 6,
  size = 88,
}) => (
  <h1
    style={{
      ...useIn(delay),
      fontFamily: FONTS.display,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1.06,
      whiteSpace: "pre-line",
      color: COLORS.ink,
      margin: 0,
    }}
  >
    {children}
  </h1>
);

const Sub: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 12 }) => (
  <p
    style={{
      ...useIn(delay),
      fontFamily: FONTS.body,
      fontWeight: 400,
      fontSize: 34,
      lineHeight: 1.45,
      color: COLORS.muted,
      margin: 0,
      whiteSpace: "pre-line",
    }}
  >
    {children}
  </p>
);

/** Enkel telefonram med appinnehåll. */
const Phone: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 16,
}) => (
  <div
    style={{
      ...useIn(delay),
      alignSelf: "center",
      width: 660,
      borderRadius: 56,
      background: COLORS.cream,
      border: `10px solid ${COLORS.ink}`,
      boxShadow: "0 40px 90px rgba(36,28,59,0.18)",
      padding: "34px 30px 40px",
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}
  >
    <div
      style={{
        alignSelf: "center",
        width: 150,
        height: 12,
        borderRadius: 999,
        background: COLORS.bgDeep,
      }}
    />
    {children}
  </div>
);

const Card: React.FC<{
  children: React.ReactNode;
  delay?: number;
  tone?: "plain" | "primary";
}> = ({ children, delay = 20, tone = "plain" }) => (
  <div
    style={{
      ...useIn(delay),
      background: tone === "primary" ? "rgba(124,92,224,0.10)" : COLORS.bg,
      border: `2px solid ${tone === "primary" ? "rgba(124,92,224,0.30)" : COLORS.bgDeep}`,
      borderRadius: 30,
      padding: "24px 26px",
      display: "flex",
      alignItems: "center",
      gap: 18,
    }}
  >
    {children}
  </div>
);

const CardText: React.FC<{ title: string; meta?: string }> = ({ title, meta }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
    <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 30, color: COLORS.ink }}>
      {title}
    </div>
    {meta ? (
      <div style={{ fontFamily: FONTS.body, fontSize: 24, color: COLORS.muted }}>{meta}</div>
    ) : null}
  </div>
);

const CheckPill: React.FC<{ done?: boolean }> = ({ done }) => (
  <div
    style={{
      width: 60,
      height: 44,
      borderRadius: 999,
      background: done ? COLORS.primary : "transparent",
      border: `2px solid ${COLORS.primary}`,
      color: done ? COLORS.cream : COLORS.primary,
      fontFamily: FONTS.body,
      fontWeight: 600,
      fontSize: 24,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    ✓
  </div>
);

/* ---------------------------------- scener --------------------------------- */

const SceneHook: React.FC = () => (
  <Shell>
    <Eyebrow>Känner du igen dig?</Eyebrow>
    <Title>{"Huvudet är fullt.\nDagen har redan\nbörjat."}</Title>
    <Sub delay={16}>
      {"Tvätten. Medicinen. Mejlet.\nAllt ligger kvar i huvudet – samtidigt."}
    </Sub>
  </Shell>
);

const SceneMeet: React.FC = () => (
  <Shell>
    <Eyebrow>Möt</Eyebrow>
    <Title size={120}>MyFlove</Title>
    <Sub delay={14}>
      {"En lugn app för dig med mycket i huvudet.\nDen tar en sak i taget – i din takt."}
    </Sub>
    <Card delay={22} tone="primary">
      <span style={{ fontSize: 44 }}>💜</span>
      <CardText title="Ingen stress, inga pekpinnar" meta="Byggd för NPF-vänlig vardag" />
    </Card>
  </Shell>
);

const SceneBattery: React.FC = () => (
  <Shell>
    <Eyebrow>1 · Din energi</Eyebrow>
    <Title size={72}>{"Appen frågar hur\ndu mår – inte vad\ndu presterar."}</Title>
    <Phone delay={14}>
      <div style={{ fontFamily: FONTS.body, fontSize: 24, color: COLORS.muted }}>
        MITT ENERGIBATTERI
      </div>
      <div
        style={{
          height: 62,
          borderRadius: 999,
          background: COLORS.bgDeep,
          overflow: "hidden",
        }}
      >
        <div style={{ width: "62%", height: "100%", background: COLORS.primary }} />
      </div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 34, color: COLORS.ink }}>
        Du har medelbra energi
      </div>
      <div style={{ fontFamily: FONTS.body, fontSize: 26, color: COLORS.muted }}>
        Den är på väg upp – starkast kl 14–16 ↑
      </div>
    </Phone>
  </Shell>
);

const SceneQuickflow: React.FC = () => (
  <Shell>
    <Eyebrow>2 · QuickFlow</Eyebrow>
    <Title size={72}>{"Skriv av dig.\nAppen sorterar\nåt dig."}</Title>
    <Phone delay={14}>
      <Card delay={20}>
        <span style={{ fontSize: 40 }}>✍️</span>
        <CardText title="”Ringa vårdcentralen imorgon 9”" />
      </Card>
      <div
        style={{
          ...useIn(30),
          alignSelf: "center",
          fontSize: 40,
          color: COLORS.primary,
        }}
      >
        ↓
      </div>
      <Card delay={36} tone="primary">
        <span style={{ fontSize: 40 }}>📅</span>
        <CardText title="Ringa vårdcentralen" meta="Imorgon kl 09:00 · Kalender" />
      </Card>
    </Phone>
  </Shell>
);

const SceneToday: React.FC = () => (
  <Shell>
    <Eyebrow>3 · Min dag</Eyebrow>
    <Title size={72}>{"En sak i taget –\nbocka av med\nett tryck."}</Title>
    <Phone delay={14}>
      <Card delay={20}>
        <span style={{ fontSize: 38 }}>💊</span>
        <CardText title="Medicin" meta="kl 08:00 · dags nu" />
        <CheckPill />
      </Card>
      <Card delay={28}>
        <span style={{ fontSize: 38 }}>🔁</span>
        <CardText title="Frukost" meta="kl 08:30" />
        <CheckPill done />
      </Card>
      <Card delay={36}>
        <span style={{ fontSize: 38 }}>🎓</span>
        <CardText title="Läsa 20 min" meta="kl 10:00 · liten insats" />
        <CheckPill />
      </Card>
    </Phone>
  </Shell>
);

const SceneFlow: React.FC = () => (
  <Shell>
    <Eyebrow>4 · Flow</Eyebrow>
    <Title size={72}>{"”Jag vet inte vad\njag ska göra nu.”"}</Title>
    <Sub delay={14}>Då får du ett förslag. Bara ett.</Sub>
    <Phone delay={20}>
      <Card delay={26} tone="primary">
        <span style={{ fontSize: 40 }}>✨</span>
        <CardText
          title="Ta något litet nu"
          meta="Diska 10 min – låg tröskel medan energin är på väg upp"
        />
      </Card>
      <Card delay={34}>
        <span style={{ fontSize: 40 }}>🌙</span>
        <CardText title="Orkar du inte?" meta="Tryck Stop – vi planerar om dagen tillsammans" />
      </Card>
    </Phone>
  </Shell>
);

const SceneCta: React.FC = () => {
  const pulse = 1 + Math.sin(useCurrentFrame() / 9) * 0.015;
  return (
    <Shell>
      <div style={{ ...useIn(0), alignSelf: "center", fontSize: 120 }}>💜</div>
      <Title size={92} delay={6}>
        {"Prova MyFlove\nidag."}
      </Title>
      <Sub delay={14}>{"Gratis att komma igång.\nFungerar direkt i mobilen – ingen väntan."}</Sub>
      <div
        style={{
          ...useIn(22),
          alignSelf: "center",
          transform: `scale(${pulse})`,
          background: COLORS.primary,
          color: COLORS.cream,
          borderRadius: 999,
          padding: "34px 66px",
          fontFamily: FONTS.display,
          fontWeight: 700,
          fontSize: 46,
          boxShadow: "0 24px 60px rgba(124,92,224,0.35)",
        }}
      >
        Ladda ner MyFlove
      </div>
      <div
        style={{
          ...useIn(30),
          alignSelf: "center",
          fontFamily: FONTS.body,
          fontSize: 34,
          color: COLORS.ink,
        }}
      >
        myflove.lovable.app
      </div>
      <div
        style={{
          ...useIn(36),
          alignSelf: "center",
          fontFamily: FONTS.body,
          fontSize: 26,
          color: COLORS.muted,
          textAlign: "center",
        }}
      >
        Lägg till på hemskärmen – som en vanlig app
      </div>
    </Shell>
  );
};

const SCENES: Array<{ c: React.FC; d: number }> = [
  { c: SceneHook, d: 150 },
  { c: SceneMeet, d: 165 },
  { c: SceneBattery, d: 180 },
  { c: SceneQuickflow, d: 210 },
  { c: SceneToday, d: 210 },
  { c: SceneFlow, d: 210 },
  { c: SceneCta, d: 240 },
];

export const TOTAL_FRAMES =
  SCENES.reduce((a, s) => a + s.d, 0) - TRANS * (SCENES.length - 1);

export const FirstLookVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
    <TransitionSeries>
      {SCENES.map(({ c: C, d }, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <TransitionSeries.Transition
              presentation={fade()}
              timing={linearTiming({ durationInFrames: TRANS })}
            />
          ) : null}
          <TransitionSeries.Sequence durationInFrames={d}>
            <C />
          </TransitionSeries.Sequence>
        </React.Fragment>
      ))}
    </TransitionSeries>
  </AbsoluteFill>
);
