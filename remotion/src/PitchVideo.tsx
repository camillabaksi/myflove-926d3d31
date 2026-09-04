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
 * MyFlove – Pitchvideo 4.1 (16:9) för investerare/partners.
 * Gemensam enkel start → Quickflow → Batteriet → Kalendern → energipåverkan
 * → historik → söndagens veckoöversikt → adaptiv personalisering → investerarcase.
 */
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

const TRANS = 15;

const ENERGY = {
  green: "#6FBF7E",
  yellow: "#E5C15D",
  orange: "#E39A5F",
  red: "#DE6E6E",
};

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

/* ---------------- Scenes ---------------- */

const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 18) * 0.012;
  return (
    <Shell dark>
      <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
        <Eyebrow dark>MyFlove — pitch 2026 · v4.1</Eyebrow>
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
    "Komplexa formulär skapar mer belastning – inte mindre.",
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
        Bär mindre. Gör inte mer. MyFlove gör analysen bakom kulisserna – du svarar bara enkelt.
      </Sub>
    </div>
  </Shell>
);

const SceneStart: React.FC = () => (
  <Shell>
    <div style={{ display: "flex", flexDirection: "column", gap: 46 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Eyebrow>En gemensam start</Eyebrow>
        <Title size={70}>En enkel och lugn startsida – samma för alla</Title>
        <Sub delay={12}>
          Inga antaganden om diagnoser, familj eller behov. Tre primära funktioner:
        </Sub>
      </div>
      <div style={{ display: "flex", gap: 28 }}>
        <Card
          accent={COLORS.primary}
          title="Quickflow"
          text="Få ner tanken direkt – utan att kategorisera eller planera."
          delay={16}
        />
        <Card
          accent={COLORS.primarySoft}
          title="Batteriet"
          text="En enkel check-in: hur mycket ork har du idag?"
          delay={24}
        />
        <Card
          accent={COLORS.gold}
          title="Kalendern"
          text="Rätt sak på rätt dag – dag, vecka och månad."
          delay={32}
        />
      </div>
    </div>
  </Shell>
);

const BatteryRow: React.FC<{
  label: string;
  fill: number;
  color: string;
  delay: number;
}> = ({ label, fill, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay - 8, fps, config: { damping: 200 } });
  return (
    <InView
      delay={delay}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        background: COLORS.cream,
        borderRadius: 22,
        padding: "22px 30px",
        boxShadow: "0 14px 34px rgba(36,28,59,0.07)",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.display,
          fontWeight: 700,
          fontSize: 30,
          color: COLORS.ink,
          width: 300,
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          height: 26,
          borderRadius: 13,
          background: "rgba(36,28,59,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${fill * interpolate(s, [0, 1], [0, 1]) * 100}%`,
            height: "100%",
            borderRadius: 13,
            background: color,
          }}
        />
      </div>
    </InView>
  );
};

const SceneBattery: React.FC = () => (
  <Shell>
    <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Eyebrow>Batteriet</Eyebrow>
        <Title size={66}>”Hur mycket ork har du idag?”</Title>
        <Sub delay={10}>Fyra svar. Inga skalor, inga formulär.</Sub>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <BatteryRow label="Mycket" fill={1} color={ENERGY.green} delay={16} />
        <BatteryRow label="Okej" fill={0.66} color={ENERGY.yellow} delay={23} />
        <BatteryRow label="Lite" fill={0.35} color={ENERGY.orange} delay={30} />
        <BatteryRow label="Nästan slut" fill={0.12} color={ENERGY.red} delay={37} />
      </div>
      <div
        style={{
          ...useIn(48),
          fontFamily: FONTS.body,
          fontSize: 24,
          color: COLORS.muted,
        }}
      >
        Måendet är separat: ”Hur känns det just nu?” – fem enkla känslolägen.
      </div>
    </div>
  </Shell>
);

const SceneCalendar: React.FC = () => (
  <Shell>
    <div style={{ display: "flex", flexDirection: "column", gap: 46 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Eyebrow>Kalendern & datumlogik</Eyebrow>
        <Title size={70}>Rätt aktivitet på rätt dag</Title>
        <Sub delay={12}>
          Varje förekomst är en egen datuminstans – flyttas något lämnas inga spökposter kvar.
        </Sub>
      </div>
      <div style={{ display: "flex", gap: 28 }}>
        <Card
          accent={COLORS.primary}
          title="Fem statusar"
          text="Planerad, pågående, genomförd, inställd och flyttad."
          delay={16}
        />
        <Card
          accent={COLORS.primarySoft}
          title="Flytt utan spökposter"
          text="Den gamla dagens planering räknas aldrig som genomförd."
          delay={24}
        />
        <Card
          accent={COLORS.gold}
          title="Egen energipåverkan"
          text="Varje instans har egen status och egen energipåverkan."
          delay={32}
        />
      </div>
    </div>
  </Shell>
);

const EnergyChip: React.FC<{ label: string; color: string; delay: number }> = ({
  label,
  color,
  delay,
}) => (
  <InView
    delay={delay}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      background: COLORS.cream,
      borderRadius: 999,
      padding: "20px 34px",
      boxShadow: "0 14px 34px rgba(36,28,59,0.07)",
      fontFamily: FONTS.display,
      fontWeight: 700,
      fontSize: 27,
      color: COLORS.ink,
    }}
  >
    <div style={{ width: 22, height: 22, borderRadius: 11, background: color }} />
    {label}
  </InView>
);

const SceneEnergy: React.FC = () => (
  <Shell>
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Eyebrow>Efter en genomförd aktivitet</Eyebrow>
        <Title size={66}>Vad gav energi – och vad tog den?</Title>
        <Sub delay={10}>Ett frivilligt svar med ett klick. Aldrig ett krav.</Sub>
      </div>
      <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
        <EnergyChip label="Gav energi" color={ENERGY.green} delay={18} />
        <EnergyChip label="Neutral" color={ENERGY.yellow} delay={25} />
        <EnergyChip label="Tog lite energi" color={ENERGY.orange} delay={32} />
        <EnergyChip label="Tog mycket energi" color={ENERGY.red} delay={39} />
      </div>
      <div
        style={{
          ...useIn(50),
          fontFamily: FONTS.body,
          fontSize: 25,
          lineHeight: 1.45,
          color: COLORS.muted,
          maxWidth: 1100,
        }}
      >
        Historiken visar svaren per faktisk aktivitet och datum. Förväntad och faktisk
        energipåverkan är två separata datapunkter – ingen tvingas fylla i båda.
      </div>
    </div>
  </Shell>
);

const SceneWeek: React.FC = () => (
  <Shell>
    <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Eyebrow>Veckoöversikt</Eyebrow>
        <Title size={70}>Din vecka – varje söndag</Title>
        <Sub delay={10}>En enkel sammanfattning byggd på faktisk data. Aldrig påhittade mönster.</Sub>
      </div>
      <div style={{ display: "flex", gap: 28 }}>
        <Card
          accent={COLORS.primary}
          title="Vad som hänt"
          text="Aktiviteter, Quickflow, ork och mående under veckan."
          delay={16}
        />
        <Card
          accent={COLORS.primarySoft}
          title="Trender när datan räcker"
          text="Ork- och måendetrender visas bara med tillräckligt underlag."
          delay={24}
        />
        <Card
          accent={COLORS.gold}
          title="Försiktiga reflektioner"
          text="Handlingsinriktade förslag inför nästa vecka – utan skuld."
          delay={32}
        />
      </div>
    </div>
  </Shell>
);

const SceneAdaptive: React.FC = () => {
  const steps = [
    { n: "1", t: "Gemensam grund", d: "Samma enkla upplevelse för alla från dag ett" },
    { n: "2", t: "Du ger signaler", d: "Det du fyller i, använder och registrerar" },
    { n: "3", t: "MyFlove lär sig", d: "Mönster byggs bara på din faktiska data" },
    { n: "4", t: "Upplevelsen anpassas", d: "Gradvis personalisering – i din takt" },
  ];
  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Eyebrow>Adaptiv personalisering</Eyebrow>
          <Title size={70}>En app som lär sig din vardag</Title>
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
            Bär mindre. Gör inte mer.
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
            myflove.lovable.app · version 4.1
          </div>
        </div>
        <FlowMascot size={440} delay={14} />
      </div>
    </Shell>
  );
};

const SCENES: { c: React.FC; d: number }[] = [
  { c: SceneHook, d: 140 },
  { c: SceneProblem, d: 160 },
  { c: SceneInsight, d: 125 },
  { c: SceneStart, d: 170 },
  { c: SceneBattery, d: 175 },
  { c: SceneCalendar, d: 165 },
  { c: SceneEnergy, d: 180 },
  { c: SceneWeek, d: 160 },
  { c: SceneAdaptive, d: 175 },
  { c: SceneWhyNow, d: 150 },
  { c: SceneMarket, d: 215 },
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
