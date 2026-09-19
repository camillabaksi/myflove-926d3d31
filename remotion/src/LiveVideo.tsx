import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ProblemScene } from "./marketing90/scenes/ProblemScene";
import { OutroScene } from "./marketing90/scenes/OutroScene";
import { PhoneScene } from "./live/PhoneScene";
import { NoSelfFade } from "./marketing90/theme";

export const LIVE_FPS = 30;
export const LIVE_FRAMES = 2700; // 90 s

const T = 25; // längre crossfade = tydlig fade in/fade out mellan bilderna
const timing = linearTiming({ durationInFrames: T });
const V = "#7657B6";

// 9 scener, 8 övergångar: summan minus 8*25 = 2700
const D = [300, 330, 330, 330, 330, 320, 320, 320, 320];

export const LiveVideo: React.FC = () => (
  <NoSelfFade.Provider value={true}>
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={D[0]}>
      <ProblemScene duration={D[0]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={timing} />

    <TransitionSeries.Sequence durationInFrames={D[1]}>
      <PhoneScene
        duration={D[1]}
        label="Ditt levande batteri"
        title={<>Din kapacitet blir <span style={{ color: V }}>synlig.</span></>}
        body={<>Du loggar ork och mående på några sekunder. MyFlove bygger bilden av hur din energi rör sig över tid.</>}
        image="batteri.png"
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={timing} />

    <TransitionSeries.Sequence durationInFrames={D[2]}>
      <PhoneScene
        duration={D[2]}
        label="QuickFlow"
        title={<>Få ut det som <span style={{ color: V }}>snurrar.</span></>}
        body={<>Skriv eller prata fritt. Flow sorterar sen — du behöver inte ha ordning på tankarna först.</>}
        image="quickflow2.png"
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={timing} />

    <TransitionSeries.Sequence durationInFrames={D[3]}>
      <PhoneScene
        duration={D[3]}
        label="Din dag"
        title={<>Allt som händer idag — <span style={{ color: V }}>i en lista.</span></>}
        body={<>Kalender, uppgifter och rutiner samlat. Tider visas bara där de faktiskt finns.</>}
        image="minday.png"
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={timing} />

    <TransitionSeries.Sequence durationInFrames={D[4]}>
      <PhoneScene
        duration={D[4]}
        label="Flow"
        title={<>Ett nästa steg som <span style={{ color: V }}>faktiskt går.</span></>}
        body={<>Flow tittar på din energi och dagens saker — och föreslår ett steg i taget. Du bestämmer alltid.</>}
        image="vadnu.png"
        note="Du godkänner alltid förändringen."
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={timing} />

    <TransitionSeries.Sequence durationInFrames={D[5]}>
      <PhoneScene
        duration={D[5]}
        label="Kalender"
        title={<>Planera efter kapacitet — <span style={{ color: V }}>inte bara tid.</span></>}
        body={<>Träning, studier, arbete och vardagssysslor kan bli mindre eller flyttas. Fasta tider lämnas kvar.</>}
        image="kalender.png"
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={timing} />

    <TransitionSeries.Sequence durationInFrames={D[6]}>
      <PhoneScene
        duration={D[6]}
        label="Återhämtning"
        title={<>När det är dags att <span style={{ color: V }}>pausa.</span></>}
        body={<>Mikropaus, Akut Lugn, Ljusboost och Stopp-knappen — alltid ett tryck bort.</>}
        image="aterhamtning.png"
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={timing} />

    <TransitionSeries.Sequence durationInFrames={D[7]}>
      <PhoneScene
        duration={D[7]}
        label="Dina mönster"
        title={<>Se vart energin <span style={{ color: V }}>tar vägen.</span></>}
        body={<>Över tid blir det osynliga arbetet synligt. Du gör förmodligen mycket mer än du själv hinner se.</>}
        image="historik.png"
      />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={timing} />

    <TransitionSeries.Sequence durationInFrames={D[8]}>
      <OutroScene duration={D[8]} />
    </TransitionSeries.Sequence>
  </TransitionSeries>
  </NoSelfFade.Provider>
);
