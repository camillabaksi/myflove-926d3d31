import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { COLORS, FONTS } from "./theme";

/**
 * MyFlove – Pitchvideo (16:9) för investerare/partners.
 * Problem → insikt → produkt → hur det funkar → varför nu → vision.
 */
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

const TRANS = 15;

function useIn(delay: number, damping = 18) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping, stiffness: 145 } });
  return {
    opacity: interpolate(s, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px) scale(${interpolate(
      s,
      [0, 1],
      [0.965, 1],
    )})`,
  } as React.CSSProperties;
}

const InView: React.FC<{
  delay: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay, style, children }) => {
  const anim = useIn(delay);
  return <div style={{ ...anim, ...style }}>{children}</div>;
};

const Shell: React.FC<{ children: React.ReactNode; dark?: boolean }> = ({
  children,
  dark = false,
}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 50) * 12;
  return (
    <AbsoluteFill style={{ background: dark ? COLORS.ink : COLORS.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1200,
          height: 1200,
          borderRadius: "50%",
          background: dark ? COLORS.primary : COLORS.sage,
          opacity: dark ? 0.22 : 0.3,
          top: -420 + drift,
          left: -320,
          filter: "blur(16px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: COLORS.gold,
          opacity: dark ? 0.14 : 0.2,
          bottom: -320 - drift,
          right: -220,
          filter: "blur(16px)",
        }}
      />
      <AbsoluteFill style={{ padding: "110px 140px", justifyContent: "center" }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode; delay?: number; dark?: boolean }> = ({
  children,
  delay = 0,
  dark = false,
}) => (
  <div
    style={{
      ...useIn(delay),
      fontFamily: FONTS.body,
      fontWeight: 600,
      letterSpacing: 6,
      textTransform: "uppercase",
      fontSize: 20,
      color: dark ? COLORS.primarySoft : COLORS.primary,
    }}
  >
    {children}
  </div>
);

const Title: React.FC<{
  children: React.ReactNode;
  delay?: number;
  dark?: boolean;
  size?: number;
}> = ({ children, delay = 6, dark = false, size = 92 }) => (
  <h1
    style={{
      ...useIn(delay),
      fontFamily: FONTS.display,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1.03,
      margin: 0,
      maxWidth: 1300,
      color: dark ? COLORS.cream : COLORS.ink,
    }}
  >
    {children}
  </h1>
);

const Sub: React.FC<{ children: React.ReactNode; delay?: number; dark?: boolean }> = ({
  children,
  delay = 12,
  dark = false,
}) => (
  <p
    style={{
      ...useIn(delay),
      fontFamily: FONTS.body,
      fontSize: 32,
      lineHeight: 1.45,
      margin: 0,
      maxWidth: 1050,
      color: dark ? "rgba(255,255,255,0.78)" : COLORS.muted,
    }}
  >
    {children}
  </p>
);

const Card: React.FC<{
  accent: string;
  title: string;
  text: string;
  delay: number;
}> = ({ accent, title, text, delay }) => (
  <div
    style={{
      ...useIn(delay),
      background: COLORS.cream,
      borderRadius: 28,
      padding: "34px 32px",
      boxShadow: "0 18px 40px rgba(36,28,59,0.08)",
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 14,
    }}
  >
    <div
      style={{
        width: 76,
        height: 12,
        borderRadius: 6,
        background: accent,
      }}
    />
    <div
      style={{
        fontFamily: FONTS.display,
        fontWeight: 700,
        fontSize: 32,
        color: COLORS.ink,
      }}
    >
      {title}
    </div>
    <div
      style={{
        fontFamily: FONTS.body,
        fontSize: 22,
        lineHeight: 1.4,
        color: COLORS.muted,
      }}
    >
      {text}
    </div>
  </div>
);

/* ---------------- Scenes ---------------- */

const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 18) * 0.012;
  return (
    <Shell dark>
      <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
        <Eyebrow dark>MyFlove — pitch 2026 · v3.7</Eyebrow>
        <div style={{ transform: `scale(${pulse})`, transformOrigin: "left center" }}>
          <Title dark size={112}>
            Vardagen kraschar
            <br />
            inte av lathet.
          </Title>
        </div>
        <Sub dark delay={20}>
          Den kraschar när hjärnan får bära allt själv: tider, ansvar, relationer, energi.
        </Sub>
      </div>
    </Shell>
  );
};

const SceneProblem: React.FC = () => {
  const items = [
    "Kalendern säger vad. Inte om du orkar.",
    "To do-listan växer när energin sjunker.",
    "Appar löser en bit — ingen ser helheten.",
  ];
  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <Eyebrow>Problemet</Eyebrow>
        <Title size={78}>Verktygen är byggda för kalendrar — inte för människor.</Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 6 }}>
          {items.map((t, i) => (
            <InView
              key={t}
              delay={24 + i * 8}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                fontFamily: FONTS.body,
                fontSize: 30,
                color: COLORS.ink,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: COLORS.gold,
                  flexShrink: 0,
                }}
              />
              {t}
            </InView>
          ))}
        </div>
      </div>
    </Shell>
  );
};

const SceneInsight: React.FC = () => (
  <Shell>
    <div style={{ display: "flex", flexDirection: "column", gap: 30, alignItems: "flex-start" }}>
      <Eyebrow>Insikten</Eyebrow>
      <Title size={96}>
        Planera efter <span style={{ color: COLORS.primary }}>energi</span>,<br />
        inte bara efter tid.
      </Title>
      <Sub delay={18}>
        MyFlove är byggt utifrån NPF-vardag: låg tröskel, inget skäll, alltid en väg vidare.
      </Sub>
    </div>
  </Shell>
);

const SceneProduct: React.FC = () => (
  <Shell>
    <div style={{ display: "flex", flexDirection: "column", gap: 46 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Eyebrow>Produkten</Eyebrow>
        <Title size={72}>Ett lugnt system för hela vardagen</Title>
      </div>
      <div style={{ display: "flex", gap: 28 }}>
        <Card
          accent={COLORS.primary}
          title="Mitt batteri"
          text="Energi och mående loggas på ett enda ställe."
          delay={14}
        />
        <Card
          accent={COLORS.primarySoft}
          title="QuickFlow"
          text="Få tanken ur huvudet direkt – sortera senare."
          delay={22}
        />
        <Card
          accent={COLORS.gold}
          title="Idag"
          text="Aktiviteter, uppgifter och dagens ordning samlat."
          delay={30}
        />
      </div>
    </div>
  </Shell>
);

const FlowMascot: React.FC<{ size?: number; delay?: number }> = ({ size = 420, delay = 8 }) => {
  const frame = useCurrentFrame();
  const enter = useIn(delay, 14);
  const bob = Math.sin(frame / 22) * 12;
  const tilt = Math.sin(frame / 34) * 2.2;
  return (
    <div style={{ ...enter, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: -60,
          borderRadius: "50%",
          background: COLORS.primarySoft,
          opacity: 0.25,
          filter: "blur(30px)",
        }}
      />
      <Img
        src={staticFile("flow-mascot.png")}
        style={{
          position: "relative",
          width: size,
          transform: `translateY(${bob}px) rotate(${tilt}deg)`,
          filter: "drop-shadow(0 26px 46px rgba(36,28,59,0.22))",
        }}
      />
    </div>
  );
};

const SceneFlow: React.FC = () => (
  <Shell>
    <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 40, flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Eyebrow>Flow</Eyebrow>
          <Title size={64}>En följeslagare som säger en sak i taget</Title>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <Card
            accent={COLORS.primary}
            title="Levande karaktär"
            text="Flow ger lugna, situationsnära förslag utan att ta över."
            delay={14}
          />
          <Card
            accent={COLORS.primarySoft}
            title="Finns i hela appen"
            text="Samma trygga ton på Hem, Idag, planering och hjälp."
            delay={22}
          />
        </div>
      </div>
      <FlowMascot size={520} delay={10} />
    </div>
  </Shell>
);

const SceneFlowAlive: React.FC = () => {
  const frame = useCurrentFrame();
  const breath = 1 + Math.sin(frame / 26) * 0.03;
  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 36, flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Eyebrow>Flow i vardagen</Eyebrow>
            <Title size={62}>En levande guide som håller tonen lugn</Title>
          </div>
          <Sub delay={16}>
            Flow är en återkommande karaktär i appen: synlig när det hjälper, diskret när det behövs
            och alltid lätt att stänga av.
          </Sub>
          <div style={{ display: "flex", gap: 24 }}>
            <Card
              accent={COLORS.primary}
              title="Följer chatten"
              text="Lyssnar när du skriver, tänker djupt medan svaret kommer, andas ut när det är klart."
              delay={22}
            />
            <Card
              accent={COLORS.gold}
              title="Din nivå"
              text="Tyst, diskret eller aktiv – Flow-inställningarna sparas per användare."
              delay={30}
            />
          </div>
        </div>
        <div style={{ transform: `scale(${breath})` }}>
          <FlowMascot size={500} delay={10} />
        </div>
      </div>
    </Shell>
  );
};

const SceneHow: React.FC = () => {
  const steps = [
    { n: "1", t: "Fånga", d: "Skriv fritt i QuickFlow" },
    { n: "2", t: "Förstå", d: "Se vad som är viktigt och möjligt" },
    { n: "3", t: "Planera", d: "Ändra ordningen efter din kapacitet" },
    { n: "4", t: "Fortsätt", d: "Ta nästa rimliga steg utan skuld" },
  ];
  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Eyebrow>Så funkar det</Eyebrow>
          <Title size={72}>En daglig loop som lär sig dig</Title>
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          {steps.map((s, i) => (
            <InView
              key={s.n}
              delay={14 + i * 7}
              style={{
                flex: 1,
                background: COLORS.cream,
                borderRadius: 26,
                padding: "30px 26px",
                boxShadow: "0 14px 34px rgba(36,28,59,0.07)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: 800,
                  fontSize: 56,
                  color: COLORS.primarySoft,
                  lineHeight: 1,
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: 700,
                  fontSize: 30,
                  color: COLORS.ink,
                }}
              >
                {s.t}
              </div>
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 21,
                  lineHeight: 1.4,
                  color: COLORS.muted,
                }}
              >
                {s.d}
              </div>
            </InView>
          ))}
        </div>
      </div>
    </Shell>
  );
};

const SceneWhyNow: React.FC = () => (
  <Shell dark>
    <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
      <Eyebrow dark>Varför nu</Eyebrow>
      <Title dark size={80}>
        Diagnoser ökar. Stödet gör det inte.
      </Title>
      <Sub dark delay={16}>
        Personliga digitala stöd kan göra det lättare att få lugn vägledning i vardagen – med
        användaren i kontroll över förslag, data och tempo.
      </Sub>
      <div
        style={{
          ...useIn(26),
          display: "flex",
          gap: 20,
          marginTop: 10,
        }}
      >
        {["Familj & hushåll", "Skola & studier", "Arbetsliv"].map((t) => (
          <div
            key={t}
            style={{
              border: `1px solid ${COLORS.primarySoft}`,
              color: COLORS.cream,
              borderRadius: 999,
              padding: "14px 28px",
              fontFamily: FONTS.body,
              fontSize: 24,
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </div>
  </Shell>
);

const SceneMarket: React.FC = () => {
  const stats = [
    {
      v: "140M+",
      l: "vuxna globalt",
      d: "Extern uppskattning baserad på 2,58 % vuxenprevalens.",
      a: COLORS.primary,
    },
    {
      v: "~3 %",
      l: "vuxna i Sverige",
      d: "Extern uppskattning från Socialstyrelsen.",
      a: COLORS.primarySoft,
    },
    {
      v: "$1,9B",
      l: "ADHD-appar 2025",
      d: "Extern uppskattning av global appmarknad.",
      a: COLORS.gold,
    },
    {
      v: "$6,7B",
      l: "ADHD-appar 2033",
      d: "Extern marknadsprognos – inte MyFloves intäkt.",
      a: COLORS.primary,
    },
    {
      v: "17,5 %",
      l: "CAGR 2025–2033",
      d: "Extern prognos för appmarknadens årliga tillväxt.",
      a: COLORS.primarySoft,
    },
  ];
  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Eyebrow>Marknaden · market opportunity</Eyebrow>
          <Title size={64}>En stor, växande målgrupp – och en marknad som skalar</Title>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          {stats.map((s, i) => (
            <InView
              key={s.v}
              delay={12 + i * 6}
              style={{
                width: 500,
                background: COLORS.cream,
                borderRadius: 24,
                padding: "24px 28px",
                boxShadow: "0 14px 34px rgba(36,28,59,0.07)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ width: 60, height: 10, borderRadius: 5, background: s.a }} />
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: 800,
                  fontSize: 44,
                  color: COLORS.ink,
                  lineHeight: 1,
                }}
              >
                {s.v}
              </div>
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontWeight: 700,
                  fontSize: 20,
                  color: COLORS.primary,
                }}
              >
                {s.l}
              </div>
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 18,
                  lineHeight: 1.35,
                  color: COLORS.muted,
                }}
              >
                {s.d}
              </div>
            </InView>
          ))}
        </div>

        <div
          style={{
            ...useIn(56),
            fontFamily: FONTS.body,
            fontSize: 18,
            color: COLORS.muted,
            maxWidth: 1500,
            lineHeight: 1.4,
          }}
        >
          Uppskattningar och prognoser – externa marknadssiffror, inte MyFloves egna
          traction-siffror. Källor: Global systematisk översikt (PubMed, 2021) · Socialstyrelsen ·
          Grand View Research, ADHD Apps Market · aktuell marknadsrapport för digital hälsa för
          neurodivergenta användare.
        </div>
        <div
          style={{
            ...useIn(64),
            fontFamily: FONTS.display,
            fontWeight: 700,
            fontSize: 26,
            color: COLORS.primary,
          }}
        >
          MyFlove starts with ADHD — but is built for the complexity of everyday life.
        </div>
      </div>
    </Shell>
  );
};

const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = 0.35 + Math.sin(frame / 20) * 0.08;
  return (
    <Shell dark>
      <div style={{ display: "flex", alignItems: "center", gap: 70 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 30, flex: 1 }}>
          <div
            style={{
              ...useIn(4),
              width: 120,
              height: 18,
              borderRadius: 9,
              background: COLORS.primary,
              boxShadow: `0 0 90px rgba(124,92,224,${glow})`,
            }}
          />
          <Title dark size={104}>
            MyFlove
          </Title>
          <Sub dark delay={16}>
            Ett lugnare sätt att få vardagen att hålla ihop.
          </Sub>
          <div
            style={{
              ...useIn(26),
              fontFamily: FONTS.body,
              fontSize: 28,
              color: COLORS.primarySoft,
              letterSpacing: 1,
            }}
          >
            myflove.lovable.app
          </div>
        </div>
        <FlowMascot size={440} delay={14} />
      </div>
    </Shell>
  );
};

const SCENES: { c: React.FC; d: number }[] = [
  { c: SceneHook, d: 140 },
  { c: SceneProblem, d: 165 },
  { c: SceneInsight, d: 130 },
  { c: SceneProduct, d: 170 },
  { c: SceneFlow, d: 165 },
  { c: SceneFlowAlive, d: 200 },
  { c: SceneHow, d: 175 },
  { c: SceneWhyNow, d: 165 },
  { c: SceneMarket, d: 220 },
  { c: SceneOutro, d: 150 },
];

export const TOTAL_FRAMES = SCENES.reduce((a, s) => a + s.d, 0) - TRANS * (SCENES.length - 1);

export const PitchVideo: React.FC = () => (
  <TransitionSeries>
    {SCENES.map((s, i) => (
      <React.Fragment key={i}>
        <TransitionSeries.Sequence durationInFrames={s.d}>
          <s.c />
        </TransitionSeries.Sequence>
        {i < SCENES.length - 1 ? (
          <TransitionSeries.Transition
            presentation={fade()}
            timing={linearTiming({ durationInFrames: TRANS })}
          />
        ) : null}
      </React.Fragment>
    ))}
  </TransitionSeries>
);
