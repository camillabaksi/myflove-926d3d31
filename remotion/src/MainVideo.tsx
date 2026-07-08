import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill } from "remotion";
import { COLORS } from "./theme";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { FeatureScene } from "./scenes/FeatureScene";
import { SceneOutro } from "./scenes/SceneOutro";

export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;

const SCENE_A = 150; // 5s intro
const SCENE_B = 270; // 9s feature block
const SCENE_C = 270;
const SCENE_D = 270;
const SCENE_E = 240; // 8s
const SCENE_F = 180; // 6s outro
const TRANS = 20;

export const TOTAL_FRAMES = SCENE_A + SCENE_B + SCENE_C + SCENE_D + SCENE_E + SCENE_F - TRANS * 5;

const timing = () => linearTiming({ durationInFrames: TRANS });

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_A}>
          <Scene1Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={SCENE_B}>
          <FeatureScene
            eyebrow="Planera dagen"
            title="Struktur som håller."
            sub="Se dagen i ett svep, bryt ner det i mjuka steg och håll fokus utan att bränna ut dig."
            accent={COLORS.primary}
            features={[
              { icon: "◐", label: "Hem", desc: "Dagens överblick – lugn start." },
              { icon: "▤", label: "Kalender", desc: "Allt på ett ställe, färgkodat." },
              { icon: "≡", label: "FlowPlan", desc: "Dagen i realistiska block." },
              { icon: "✓", label: "Att göra", desc: "Små steg, inte långa listor." },
              { icon: "◎", label: "Fokus & Timer", desc: "Pomodoro utan press." },
            ]}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={SCENE_C}>
          <FeatureScene
            eyebrow="Må bra"
            title="Kroppen med, inte emot."
            sub="Lyssna på energin, kom ihåg medicinen och fira det som gick bra – oavsett hur stort."
            accent={COLORS.sage}
            features={[
              { icon: "☺", label: "Mående", desc: "Snabb check-in utan ord." },
              { icon: "⚡", label: "Energikarta", desc: "Se när du toppar och dippar." },
              { icon: "℞", label: "Medicin", desc: "Påminnelser du inte missar." },
              { icon: "★", label: "Belöningar", desc: "Små segrar räknas." },
            ]}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={SCENE_D}>
          <FeatureScene
            eyebrow="Vardagen"
            title="Praktisk hjälp där det skaver."
            sub="Från kylskåp till kontoutdrag – mindre mental last i det som annars faller mellan stolarna."
            accent={COLORS.primary}
            features={[
              { icon: "🛒", label: "Inköp", desc: "Larmar när du är nära affären." },
              { icon: "🍽", label: "Matlista", desc: "Veckans måltider – klara." },
              { icon: "💳", label: "Ekonomi", desc: "Koll utan ångest." },
              { icon: "🧭", label: "Resor", desc: "Avgångar & påminnelser." },
              { icon: "👪", label: "Familj", desc: "Alla synkade, en kalender." },
            ]}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={SCENE_E}>
          <FeatureScene
            eyebrow="Reflektera & växa"
            title="Se mönstren. Forma appen."
            sub="Töm huvudet, se vad som funkar, be om hjälp när det behövs – och forma appen efter dig."
            accent={COLORS.gold}
            features={[
              { icon: "⇩", label: "Dumping", desc: "Tanketömning på 5 sek." },
              { icon: "📊", label: "Statistik", desc: "Mönster du själv missar." },
              { icon: "✨", label: "Hjälp-AI", desc: "Bollplank, alltid vaken." },
              { icon: "🔥", label: "Feedback", desc: "Rösta upp det som ska fixas." },
            ]}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={SCENE_F}>
          <SceneOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
