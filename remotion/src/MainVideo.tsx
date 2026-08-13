import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill } from "remotion";
import { COLORS } from "./theme";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { SceneFlowVoice } from "./scenes/SceneFlowVoice";
import { SceneModulesConnected } from "./scenes/SceneModulesConnected";
import { SceneNewModules } from "./scenes/SceneNewModules";
import { SceneOrganize } from "./scenes/SceneOrganize";
import { SceneBudget } from "./scenes/SceneBudget";
import { SceneLifeAreas } from "./scenes/SceneLifeAreas";
import { SceneFlows } from "./scenes/SceneFlows";
import { SceneStudyBuddy } from "./scenes/SceneStudyBuddy";
import { SceneTraining } from "./scenes/SceneTraining";
import { SceneAssistant } from "./scenes/SceneAssistant";
import { SceneScenarios } from "./scenes/SceneScenarios";
import { SceneProactive } from "./scenes/SceneProactive";
import { SceneFlowPlan } from "./scenes/SceneFlowPlan";
import { SceneStop } from "./scenes/SceneStop";
import { SceneFeeling } from "./scenes/SceneFeeling";
import { ScenePushMobile } from "./scenes/ScenePushMobile";
import { SceneOutro } from "./scenes/SceneOutro";

export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;

const S_INTRO = 150;
const S_VOICE = 270;
const S_MODULES = 240;
const S_NEWMOD = 240;      // 8s – nya moduler
const S_ORGANIZE = 260;    // ~8.7s – mappar, FlowStudy, städning, barn
const S_BUDGET = 260;      // ~8.7s – budget per dag/vecka/månad
const S_AREAS = 240;        // 8s – livsområden med färg
const S_FLOWS = 240;        // 8s – fem flöden
const S_STUDY = 260;        // ~8.7s – StudyFlow & StudyBuddy
const S_TRAINING = 300;     // 10s – träning
const S_ASSISTANT = 240;    // 8s – assistent med historik
const S_SCENARIOS = 240;
const S_PROACTIVE = 240;   // 8s – proaktivt + Stop-teaser
const S_FLOWPLAN = 300;
const S_STOP = 240;
const S_FEELING = 210;
const S_PUSH = 270;        // 9s – push & mobil
const S_OUTRO = 300;
const TRANS = 20;

const SCENES = [S_INTRO, S_VOICE, S_MODULES, S_NEWMOD, S_ORGANIZE, S_BUDGET, S_AREAS, S_FLOWS, S_STUDY, S_TRAINING, S_ASSISTANT, S_SCENARIOS, S_PROACTIVE, S_FLOWPLAN, S_STOP, S_FEELING, S_PUSH, S_OUTRO];
export const TOTAL_FRAMES = SCENES.reduce((a, b) => a + b, 0) - TRANS * (SCENES.length - 1);

const timing = () => linearTiming({ durationInFrames: TRANS });

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={S_INTRO}><Scene1Intro /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_VOICE}><SceneFlowVoice /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_MODULES}><SceneModulesConnected /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_NEWMOD}><SceneNewModules /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_ORGANIZE}><SceneOrganize /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_BUDGET}><SceneBudget /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_AREAS}><SceneLifeAreas /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_FLOWS}><SceneFlows /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_STUDY}><SceneStudyBuddy /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_TRAINING}><SceneTraining /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_ASSISTANT}><SceneAssistant /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_SCENARIOS}><SceneScenarios /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_PROACTIVE}><SceneProactive /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_FLOWPLAN}><SceneFlowPlan /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_STOP}><SceneStop /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_FEELING}><SceneFeeling /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_PUSH}><ScenePushMobile /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={S_OUTRO}><SceneOutro /></TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
