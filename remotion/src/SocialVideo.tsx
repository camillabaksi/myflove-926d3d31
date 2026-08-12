import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { COLORS, FONTS } from "./theme";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1350;

const TRANS = 15;

function useIn(delay: number, damping = 16) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping, stiffness: 150 } });
  return {
    opacity: interpolate(s, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px) scale(${interpolate(s, [0, 1], [0.94, 1])})`,
  } as React.CSSProperties;
}

const Shell: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = COLORS.bg }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 40) * 8;
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: COLORS.sage,
          opacity: 0.22,
          top: -260 + drift,
          left: -220,
          filter: "blur(10px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 620,
          height: 620,
          borderRadius: "50%",
          background: COLORS.gold,
          opacity: 0.16,
          bottom: -200 - drift,
          right: -160,
          filter: "blur(10px)",
        }}
      />
      <AbsoluteFill
        style={{
          padding: 90,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <div
    style={{
      ...useIn(delay),
      fontFamily: FONTS.body,
      fontWeight: 600,
      letterSpacing: 5,
      textTransform: "uppercase",
      fontSize: 22,
      color: COLORS.primary,
    }}
  >
    {children}
  </div>
);

const Title: React.FC<{ children: React.ReactNode; delay?: number; size?: number }> = ({
  children,
  delay = 5,
  size = 82,
}) => (
  <h1
    style={{
      ...useIn(delay),
      fontFamily: FONTS.display,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1.05,
      whiteSpace: "pre-line",
      color: COLORS.ink,
      margin: 0,
    }}
  >
    {children}
  </h1>
);

const Sub: React.FC<{ children: React.ReactNode; delay?: number; size?: number }> = ({
  children,
  delay = 14,
  size = 34,
}) => (
  <p
    style={{
      ...useIn(delay),
      fontFamily: FONTS.body,
      fontSize: size,
      lineHeight: 1.4,
      color: COLORS.muted,
      margin: 0,
    }}
  >
    {children}
  </p>
);

const Card: React.FC<{ icon: string; label: string; desc: string; delay: number; color?: string }> = ({
  icon,
  label,
  desc,
  delay,
  color = COLORS.primary,
}) => (
  <div
    style={{
      ...useIn(delay),
      display: "flex",
      alignItems: "center",
      gap: 22,
      background: COLORS.cream,
      borderRadius: 28,
      padding: "22px 26px",
      boxShadow: "0 10px 26px rgba(30,42,36,0.08)",
    }}
  >
    <div
      style={{
        width: 66,
        height: 66,
        borderRadius: 20,
        background: color,
        color: COLORS.cream,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 32,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 30, color: COLORS.ink }}>{label}</div>
      <div style={{ fontFamily: FONTS.body, fontSize: 22, color: COLORS.muted }}>{desc}</div>
    </div>
  </div>
);

/* 1. 47 flikar i huvudet */
const TABS = [
  "Ringa tandläkaren",
  "Var är kvittot?",
  "Tvätten!!",
  "Betala räkning",
  "Handla mjölk",
  "Maila läraren",
  "Boka bilen",
  "Vattna blommorna",
  "Ringa mamma",
];

const SceneTabs: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Shell>
      <Eyebrow>Känner du igen dig?</Eyebrow>
      <Title>47 flikar öppna.{"\n"}I huvudet. 🫠</Title>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10 }}>
        {TABS.map((t, i) => {
          const s = spring({ frame: frame - 30 - i * 5, fps: 30, config: { damping: 12, stiffness: 180 } });
          const wobble = Math.sin((frame + i * 12) / 9) * 2.5;
          return (
            <div
              key={t}
              style={{
                opacity: s,
                transform: `scale(${0.8 + s * 0.2}) rotate(${wobble}deg)`,
                fontFamily: FONTS.body,
                fontSize: 25,
                color: COLORS.ink,
                background: COLORS.cream,
                border: `2px solid ${COLORS.bgDeep}`,
                borderRadius: 999,
                padding: "12px 22px",
              }}
            >
              {t}
            </div>
          );
        })}
      </div>
      <Sub delay={95} size={31}>
        Kalendern här, uppgiften där, påminnelsen i en tredje app… och det du skulle
        göra för två timmar sedan försvann någonstans mellan Instagram och verkligheten.
      </Sub>
    </Shell>
  );
};

/* 2. En hjärna, inte sju appar */
const SceneOneBrain: React.FC = () => (
  <Shell bg={COLORS.primary}>
    <div style={{ ...useIn(0), fontSize: 120 }}>🧠</div>
    <h1
      style={{
        ...useIn(8),
        fontFamily: FONTS.display,
        fontWeight: 700,
        fontSize: 96,
        lineHeight: 1.05,
      whiteSpace: "pre-line",
        color: COLORS.cream,
        margin: 0,
      }}
    >
      En hjärna.{"\n"}Inte sju appar.
    </h1>
    <p
      style={{
        ...useIn(20),
        fontFamily: FONTS.body,
        fontSize: 36,
        color: COLORS.sage,
        margin: 0,
      }}
    >
      MyFlove samlar vardagen på ett ställe – och minskar friktionen.
    </p>
  </Shell>
);

/* 3. Vad finns i appen */
const SceneFeatures: React.FC = () => (
  <Shell>
    <Eyebrow>Det här finns redan</Eyebrow>
    <Title size={70}>Flow hjälper dig{"\n"}planera & komma ihåg</Title>
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 12 }}>
      <Card icon="🗓️" label="Planering" desc="Kalender, uppgifter och dagens fokus" delay={22} />
      <Card icon="🔔" label="Påminnelser" desc="Puffar som kommer även när appen är stängd" delay={32} color={COLORS.gold} />
      <Card icon="📚" label="Friktionsbibliotek" desc="Det som skaver – samlat och synligt" delay={42} color={COLORS.studies} />
      <Card icon="🛑" label="Stoppknappen" desc="För de där impulsiva besluten" delay={52} color="#B4462F" />
    </div>
  </Shell>
);

/* 4. Studieflöde – på gång */
const SceneStudy: React.FC = () => (
  <Shell>
    <Eyebrow>På gång</Eyebrow>
    <Title size={76}>Studieflöde 🎓</Title>
    <Sub size={33}>Skoluppgifter, deadlines – och snart quiz och flashcards inför provet.</Sub>
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 8 }}>
      <Card icon="📝" label="Uppgifter" desc="Nedbrutna i små, görbara steg" delay={26} color={COLORS.studies} />
      <Card icon="⏳" label="Deadlines" desc="Koll utan panik kvällen innan" delay={36} color={COLORS.work} />
      <Card icon="🃏" label="Flashcards & quiz" desc="Kommer snart" delay={46} color={COLORS.gold} />
    </div>
  </Shell>
);

/* 5. Söker 100 testare */
const SceneTesters: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 8) * 0.02;
  return (
    <Shell bg={COLORS.bgDeep}>
      <Eyebrow>Appen är långt ifrån färdig</Eyebrow>
      <Title size={86}>Jag söker{"\n"}100 testare ❤️</Title>
      <Sub size={33}>
        Gratis. Ärlig feedback: Vad funkar? Vad är krångligt? Vad saknas? Vad skulle få
        dig att vilja använda den varje dag?
      </Sub>
      <div
        style={{
          ...useIn(30),
          transform: `scale(${pulse})`,
          alignSelf: "flex-start",
          background: COLORS.primary,
          color: COLORS.cream,
          fontFamily: FONTS.body,
          fontWeight: 600,
          fontSize: 40,
          padding: "24px 44px",
          borderRadius: 999,
          marginTop: 14,
          boxShadow: "0 14px 34px rgba(36,80,60,0.28)",
        }}
      >
        myflove.se
      </div>
    </Shell>
  );
};

/* 6. Outro */
const SceneOutro: React.FC = () => (
  <Shell bg={COLORS.primary}>
    <h1
      style={{
        ...useIn(0),
        fontFamily: FONTS.display,
        fontWeight: 700,
        fontSize: 104,
        lineHeight: 1.02,
      whiteSpace: "pre-line",
        color: COLORS.cream,
        margin: 0,
      }}
    >
      MyFlove
    </h1>
    <p style={{ ...useIn(10), fontFamily: FONTS.body, fontSize: 40, color: COLORS.sage, margin: 0 , whiteSpace: "pre-line" }}>
      Lite mer ordning. Lite mindre stress.{"\n"}Framför allt – lite mer flow. 💙
    </p>
    <div
      style={{
        ...useIn(22),
        alignSelf: "flex-start",
        background: COLORS.gold,
        color: "#2A1E06",
        fontFamily: FONTS.body,
        fontWeight: 600,
        fontSize: 38,
        padding: "22px 40px",
        borderRadius: 999,
        marginTop: 12,
      }}
    >
      Testa gratis: myflove.se
    </div>
    <p style={{ ...useIn(32), fontFamily: FONTS.body, fontSize: 28, color: COLORS.sage, margin: 0 }}>
      Kommentera "testat" och berätta vad du tycker 🥰
    </p>
  </Shell>
);

const D = [180, 130, 210, 190, 200, 190];
export const TOTAL_FRAMES = D.reduce((a, b) => a + b, 0) - TRANS * (D.length - 1);

const t = () => linearTiming({ durationInFrames: TRANS });

export const SocialVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={D[0]!}><SceneTabs /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t()} />
      <TransitionSeries.Sequence durationInFrames={D[1]!}><SceneOneBrain /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t()} />
      <TransitionSeries.Sequence durationInFrames={D[2]!}><SceneFeatures /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t()} />
      <TransitionSeries.Sequence durationInFrames={D[3]!}><SceneStudy /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t()} />
      <TransitionSeries.Sequence durationInFrames={D[4]!}><SceneTesters /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t()} />
      <TransitionSeries.Sequence durationInFrames={D[5]!}><SceneOutro /></TransitionSeries.Sequence>
    </TransitionSeries>
    <Sequence from={0} />
  </AbsoluteFill>
);
