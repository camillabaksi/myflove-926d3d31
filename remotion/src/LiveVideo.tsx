import React from "react";
import { AbsoluteFill, interpolate, Series, useCurrentFrame } from "remotion";
import { ProblemScene } from "./marketing90/scenes/ProblemScene";
import { OutroScene } from "./marketing90/scenes/OutroScene";
import { PhoneScene } from "./live/PhoneScene";
import { C, NoSelfFade } from "./marketing90/theme";

export const LIVE_FPS = 30;
export const LIVE_FRAMES = 2700; // 90 s

const V = "#7657B6";

// Nio separata 10-sekundersscener. De överlappar aldrig varandra.
const D = Array.from({ length: 9 }, () => 300);
const FADE_FRAMES = 18;

const SceneFade: React.FC<{ children: React.ReactNode; duration: number }> = ({ children, duration }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, FADE_FRAMES, duration - FADE_FRAMES, duration - 1],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const LiveVideo: React.FC = () => (
  <NoSelfFade.Provider value={true}>
    <AbsoluteFill style={{ backgroundColor: C.bg2 }}>
    <Series>
    <Series.Sequence durationInFrames={D[0]}>
      <SceneFade duration={D[0]}><ProblemScene duration={D[0]} /></SceneFade>
    </Series.Sequence>

    <Series.Sequence durationInFrames={D[1]}>
      <SceneFade duration={D[1]}>
      <PhoneScene
        duration={D[1]}
        label="Ditt levande batteri"
        title={<>Din kapacitet blir <span style={{ color: V }}>synlig.</span></>}
        body={<>Du loggar ork och mående på några sekunder. MyFlove bygger bilden av hur din energi rör sig över tid.</>}
        image="batteri.png"
      />
      </SceneFade>
    </Series.Sequence>

    <Series.Sequence durationInFrames={D[2]}>
      <SceneFade duration={D[2]}>
      <PhoneScene
        duration={D[2]}
        label="QuickFlow"
        title={<>Få ut det som <span style={{ color: V }}>snurrar.</span></>}
        body={<>Skriv eller prata fritt. Flow sorterar sen — du behöver inte ha ordning på tankarna först.</>}
        image="quickflow2.png"
      />
      </SceneFade>
    </Series.Sequence>

    <Series.Sequence durationInFrames={D[3]}>
      <SceneFade duration={D[3]}>
      <PhoneScene
        duration={D[3]}
        label="Din dag"
        title={<>Allt som händer idag — <span style={{ color: V }}>i en lista.</span></>}
        body={<>Kalender, uppgifter och rutiner samlat. Tider visas bara där de faktiskt finns.</>}
        image="minday.png"
      />
      </SceneFade>
    </Series.Sequence>

    <Series.Sequence durationInFrames={D[4]}>
      <SceneFade duration={D[4]}>
      <PhoneScene
        duration={D[4]}
        label="Flow"
        title={<>Ett nästa steg som <span style={{ color: V }}>faktiskt går.</span></>}
        body={<>Flow tittar på din energi och dagens saker — och föreslår ett steg i taget. Du bestämmer alltid.</>}
        image="vadnu.png"
        note="Du godkänner alltid förändringen."
      />
      </SceneFade>
    </Series.Sequence>

    <Series.Sequence durationInFrames={D[5]}>
      <SceneFade duration={D[5]}>
      <PhoneScene
        duration={D[5]}
        label="Kalender"
        title={<>Planera efter kapacitet — <span style={{ color: V }}>inte bara tid.</span></>}
        body={<>Träning, studier, arbete och vardagssysslor kan bli mindre eller flyttas. Fasta tider lämnas kvar.</>}
        image="kalender.png"
      />
      </SceneFade>
    </Series.Sequence>

    <Series.Sequence durationInFrames={D[6]}>
      <SceneFade duration={D[6]}>
      <PhoneScene
        duration={D[6]}
        label="Återhämtning"
        title={<>När det är dags att <span style={{ color: V }}>pausa.</span></>}
        body={<>Mikropaus, Akut Lugn, Ljusboost och Stopp-knappen — alltid ett tryck bort.</>}
        image="aterhamtning.png"
      />
      </SceneFade>
    </Series.Sequence>

    <Series.Sequence durationInFrames={D[7]}>
      <SceneFade duration={D[7]}>
      <PhoneScene
        duration={D[7]}
        label="Dina mönster"
        title={<>Se vart energin <span style={{ color: V }}>tar vägen.</span></>}
        body={<>Över tid blir det osynliga arbetet synligt. Du gör förmodligen mycket mer än du själv hinner se.</>}
        image="historik.png"
      />
      </SceneFade>
    </Series.Sequence>

    <Series.Sequence durationInFrames={D[8]}>
      <SceneFade duration={D[8]}><OutroScene duration={D[8]} /></SceneFade>
    </Series.Sequence>
    </Series>
    </AbsoluteFill>
  </NoSelfFade.Provider>
);
