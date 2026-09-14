import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { IntroScene } from "./demo/scenes/IntroScene";
import { QuickFlowScene } from "./demo/scenes/QuickFlowScene";
import { FlowScene } from "./demo/scenes/FlowScene";
import { CapacityScene } from "./demo/scenes/CapacityScene";
import { MyDayOutroScene } from "./demo/scenes/MyDayOutroScene";

export const DEMO_FPS = 30;
export const DEMO_WIDTH = 1920;
export const DEMO_HEIGHT = 1080;
export const DEMO_TOTAL_FRAMES = 900;

const TRANSITION_FRAMES = 15;
const transitionTiming = linearTiming({ durationInFrames: TRANSITION_FRAMES });

export const DemoVideo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={120}>
      <IntroScene />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />
    <TransitionSeries.Sequence durationInFrames={165}>
      <QuickFlowScene />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />
    <TransitionSeries.Sequence durationInFrames={225}>
      <FlowScene />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />
    <TransitionSeries.Sequence durationInFrames={255}>
      <CapacityScene />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />
    <TransitionSeries.Sequence durationInFrames={195}>
      <MyDayOutroScene />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
