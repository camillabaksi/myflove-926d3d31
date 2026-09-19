import React from "react";
import { Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ProblemScene } from "./marketing90/scenes/ProblemScene";
import { InvisibleScene } from "./marketing90/scenes/InvisibleScene";
import { BatteryScene } from "./marketing90/scenes/BatteryScene";
import { CaptureScene } from "./marketing90/scenes/CaptureScene";
import { FlowScene } from "./marketing90/scenes/FlowScene";
import { AdaptScene } from "./marketing90/scenes/AdaptScene";
import { PatternsScene } from "./marketing90/scenes/PatternsScene";
import { OutroScene } from "./marketing90/scenes/OutroScene";

export const MARKETING_90_FPS=30; export const MARKETING_90_FRAMES=2700;
const T=15; const timing=linearTiming({durationInFrames:T});
const D=[300,345,345,345,375,375,345,375];
export const Marketing90Video:React.FC=()=> <><Audio src={staticFile("marketing90/myflove-ambient.mp3")} volume={0.48}/><TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={D[0]}><ProblemScene duration={D[0]}/></TransitionSeries.Sequence><TransitionSeries.Transition presentation={fade()} timing={timing}/>
  <TransitionSeries.Sequence durationInFrames={D[1]}><InvisibleScene duration={D[1]}/></TransitionSeries.Sequence><TransitionSeries.Transition presentation={fade()} timing={timing}/>
  <TransitionSeries.Sequence durationInFrames={D[2]}><BatteryScene duration={D[2]}/></TransitionSeries.Sequence><TransitionSeries.Transition presentation={fade()} timing={timing}/>
  <TransitionSeries.Sequence durationInFrames={D[3]}><CaptureScene duration={D[3]}/></TransitionSeries.Sequence><TransitionSeries.Transition presentation={fade()} timing={timing}/>
  <TransitionSeries.Sequence durationInFrames={D[4]}><FlowScene duration={D[4]}/></TransitionSeries.Sequence><TransitionSeries.Transition presentation={fade()} timing={timing}/>
  <TransitionSeries.Sequence durationInFrames={D[5]}><AdaptScene duration={D[5]}/></TransitionSeries.Sequence><TransitionSeries.Transition presentation={fade()} timing={timing}/>
  <TransitionSeries.Sequence durationInFrames={D[6]}><PatternsScene duration={D[6]}/></TransitionSeries.Sequence><TransitionSeries.Transition presentation={fade()} timing={timing}/>
  <TransitionSeries.Sequence durationInFrames={D[7]}><OutroScene duration={D[7]}/></TransitionSeries.Sequence>
  </TransitionSeries></>;