import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill } from "remotion";
import { COLORS } from "./theme";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { SceneFlowVoice } from "./scenes/SceneFlowVoice";
import { SceneModulesConnected } from "./scenes/SceneModulesConnected";
import { SceneScenarios } from "./scenes/SceneScenarios";
import { SceneFlowPlan } from "./scenes/SceneFlowPlan";
import { SceneStop } from "./scenes/SceneStop";
import { SceneFeeling } from "./scenes/SceneFeeling";
import { SceneOutro } from "./scenes/SceneOutro";

export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;

const S_INTRO = 150;   // 5s
const S_VOICE = 270;   // 9s – Flow talar
const S_MODULES = 240; // 8s – allt hänger ihop
const S_SCENARIOS = 240; // 8s
const S_FLOWPLAN = 300; // 10s
const S_STOP = 240;     // 8s – Stoppknappen
const S_FEELING = 210;  // 7s
const S_OUTRO = 300;    // 10s
const TRANS = 20;

export const TOTAL_FRAMES =
  S_INTRO + S_VOICE + S_MODULES + S_SCENARIOS + S_FLOWPLAN + S_STOP + S_FEELING + S_OUTRO - TRANS * 7;


const timing = () => linearTiming({ durationInFrames: TRANS });

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={S_INTRO}>
          <Scene1Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_VOICE}>
          <SceneFlowVoice />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_MODULES}>
          <SceneModulesConnected />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_SCENARIOS}>
          <SceneScenarios />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_FLOWPLAN}>
          <SceneFlowPlan />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_STOP}>
          <SceneStop />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_FEELING}>
          <SceneFeeling />
        </TransitionSeries.Sequence>

        <TransitionSeries.Sequence durationInFrames={S_FEELING}>
          <SceneFeeling />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_OUTRO}>
          <SceneOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
